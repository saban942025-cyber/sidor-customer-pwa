import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  updatePassword
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  where, 
  getDoc,
  addDoc,
  serverTimestamp,
  limit,
  collectionGroup,
  updateDoc
} from "firebase/firestore";
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";

// --- הגדרות Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyDq0oVwS6zbEfsgrYBRkeBq80dDUKMedzo", 
  authDomain: "saban94-78949.firebaseapp.com", 
  projectId: "saban94-78949",
  storageBucket: "saban94-78949.firebasestorage.app",
  messagingSenderId: "41553157903", 
  appId: "1:41553157903:web:cc33d252cff023be97a87a",
  measurementId: "G-XV6RZDESSB"
};

// --- אתחול שירותים ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- בסיס ידע (קטלוג) מוטמע ---
const placeholderImage = (text) => `https://placehold.co/100x100/e0e7ff/3730a3?text=${encodeURIComponent(text)}`;

const KnowledgeBase = {
  products: [
    {
      id: "p-101",
      sku: "10-101",
      name: "לוח גבס לבן (סטנדרטי)",
      category: "גבס",
      image: placeholderImage('לוח גבס'),
      spec: "עובי: 12.5 מ\"מ | גודל: 120x260 ס\"מ",
      description: "לוח גבס סטנדרטי לשימוש כללי בקירות פנים ומחיצות.",
      proInfo: {
        application: "משמש לבניית מחיצות, חיפוי קירות קיימים, והנמכות תקרה. אינו מתאים לחדרים רטובים.",
        dryingTime: "זמן ייבוש שפכטל בחיבורים: כ-24 שעות, תלוי באוורור ובלחות."
      },
      calculator: {
        unit: "m²", 
        calculate: (area) => {
          const boardsNeeded = Math.ceil(area / 3.12);
          return `לכיסוי ${area} מ"ר, תצטרך כ-${boardsNeeded} לוחות גבס (מומלץ להוסיף 10% פחת).`;
        }
      },
      relatedProducts: ["p-102", "p-103", "p-201"]
    },
    {
      id: "p-102",
      sku: "10-102",
      name: "ניצב 70 מ\"מ",
      category: "גבס",
      image: placeholderImage('ניצב 70'),
      spec: "אורך: 260 / 300 ס\"מ | עובי: 0.5 מ\"מ",
      description: "פרופיל פח מגולוון המשמש כחלק האנכי בקונסטרוקציית קיר גבס.",
      proInfo: {
        application: "יש להתקין במרווחים של 40 ס\"מ או 60 ס\"מ אחד מהשני, תלוי בדרישת התקן.",
        dryingTime: "N/A"
      },
      calculator: {
        unit: "מטר אורך (קיר)",
        calculate: (length) => {
          const numStuds = Math.ceil(length / 0.6) + 1; 
          return `לקיר באורך ${length} מטר, תצטרך כ-${numStuds} ניצבים (לגובה סטנדרטי).`;
        }
      },
      relatedProducts: ["p-101", "p-103"]
    },
    {
      id: "p-103",
      sku: "10-103",
      name: "מסלול 70 מ\"מ",
      category: "גבס",
      image: placeholderImage('מסלול 70'),
      spec: "אורך: 300 ס\"מ | עובי: 0.5 מ\"מ",
      description: "פרופיל פח מגולוון המשמש כמסילה ברצפה ובתקרה לקיבוע הניצבים.",
      proInfo: {
        application: "יש לקבע לרצפה ולתקרה באמצעות ברגים מתאימים כל 60 ס\"מ.",
        dryingTime: "N/A"
      },
      calculator: {
        unit: "מטר אורך (קיר)",
        calculate: (length) => {
          const numTracks = Math.ceil((length * 2) / 3);
          return `לקיר באורך ${length} מטר, תצטרך כ-${numTracks} מסלולים (אחד לרצפה ואחד לתקרה).`;
        }
      },
      relatedProducts: ["p-101", "p-102"]
    },
    {
      id: "p-201",
      sku: "20-201",
      name: "שפכטל אמריקאי (דלי 20 ק\"ג)",
      category: "צבע וחומרי גמר",
      image: placeholderImage('שפכטל'),
      spec: "משקל: 20 ק\"ג | מוכן לשימוש",
      description: "תרכובת מוכנה לשימוש להחלקת קירות גבס וטיפול בחיבורים.",
      proInfo: {
        application: "יש ליישם שכבה ראשונה, להמתין לייבוש מלא, לשייף קלות וליישם שכבה שנייה.",
        dryingTime: "כ-4-6 שעות בין שכבות, 24 שעות לייבוש מלא."
      },
      calculator: null,
      relatedProducts: ["p-101"]
    }
  ],
  search: function(term) {
    if (term.length < 2) {
      return [];
    }
    const lowerTerm = term.toLowerCase();
    return this.products.filter(p => 
      p.name.toLowerCase().includes(lowerTerm) || 
      p.sku.toLowerCase().includes(lowerTerm) ||
      p.description.toLowerCase().includes(lowerTerm)
    );
  },
  getById: function(id) {
    return this.products.find(p => p.id === id);
  },
  getRelatedProducts: function(id) {
    const product = this.getById(id);
    if (!product || !product.relatedProducts) {
      return [];
    }
    return product.relatedProducts.map(relatedId => this.getById(relatedId)).filter(Boolean);
  }
};

// --- קומפוננטת שורש ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [isDefaultPassword, setIsDefaultPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await loadCustomerProfile(user.uid);
        if (profile) {
          setUser(user);
          setCustomerProfile(profile);
          if (profile.forcePasswordChange) {
            setIsDefaultPassword(true);
          }
        } else {
          console.error("Auth successful but customer profile not found.");
          signOut(auth);
        }
      } else {
        setUser(null);
        setCustomerProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePasswordUpdate = async (newPassword) => {
    try {
      await updatePassword(auth.currentUser, newPassword);
      const userDocRef = doc(db, 'customers', auth.currentUser.uid);
      await updateDoc(userDocRef, { forcePasswordChange: false });
      setIsDefaultPassword(false);
      alert("סיסמה עודכנה בהצלחה!");
    } catch (error) {
      console.error("Error updating password:", error);
      alert("שגיאה בעדכון סיסמה: " + error.message);
    }
  };

  if (loading) return <FullScreenLoader text="טוען אפליקציה..." />;
  if (!user) return <AuthScreen />;
  if (isDefaultPassword) return <ForcePasswordChangeScreen onUpdate={handlePasswordUpdate} />;

  return <MainApp user={user} customerProfile={customerProfile} />;
}

async function loadCustomerProfile(uid) {
  try {
    const docRef = doc(db, "customers", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { uid, ...docSnap.data() };
    return null;
  } catch (error) {
    console.error("Error loading customer profile:", error);
    return null;
  }
}

function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError("שם משתמש או סיסמה שגויים.");
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 m-4 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Sidor</h2>
        <h3 className="text-xl font-semibold text-center text-gray-700 mb-8">פורטל לקוחות</h3>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">אימייל</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">סיסמה</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg" required />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
            {loading ? "מתחבר..." : "כניסה"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ForcePasswordChangeScreen({ onUpdate }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("סיסמה חייבת להכיל לפחות 6 תווים."); return; }
    if (newPassword !== confirmPassword) { setError("הסיסמאות אינן תואמות."); return; }
    onUpdate(newPassword);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 m-4 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">הגדרת סיסמה חדשה</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">סיסמה חדשה</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">אימות סיסמה</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg" required />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button type="submit" className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">עדכן סיסמה</button>
        </form>
      </div>
    </div>
  );
}

function MainApp({ user, customerProfile }) {
  const [page, setPage] = useState('chats');
  const [currentRoom, setCurrentRoom] = useState(null);

  if (currentRoom) {
    return <ChatRoomPage room={currentRoom} user={user} customerProfile={customerProfile} onBack={() => setCurrentRoom(null)} />;
  }

  const renderPage = () => {
    switch (page) {
      case 'chats': return <ChatListPage customerProfile={customerProfile} onEnterRoom={setCurrentRoom} />;
      case 'knowledge': return <KnowledgeBasePage />;
      case 'orders': return <OrderHistoryPage />;
      case 'profile': return <ProfilePage customerProfile={customerProfile} />;
      default: return <ChatListPage customerProfile={customerProfile} onEnterRoom={setCurrentRoom} />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="flex-1 overflow-y-auto pb-20">{renderPage()}</div>
      <BottomNav currentPage={page} setPage={setPage} />
    </div>
  );
}

function BottomNav({ currentPage, setPage }) {
  const navItems = [
    { id: 'chats', name: 'שיחות', icon: 'MessageSquare' },
    { id: 'knowledge', name: 'בסיס ידע', icon: 'BookOpen' },
    { id: 'orders', name: 'הזמנות', icon: 'Archive' },
    { id: 'profile', name: 'פרופיל', icon: 'User' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
      <div className="flex justify-around max-w-lg mx-auto px-4 py-2">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setPage(item.id)} className={`flex flex-col items-center p-2 rounded-lg w-20 transition-all ${currentPage === item.id ? 'text-blue-600 scale-105' : 'text-gray-500'}`}>
            <Icon name={item.icon} className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{item.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function ChatListPage({ customerProfile, onEnterRoom }) {
  const [projectsWithData, setProjectsWithData] = useState([]);
  
  useEffect(() => {
    if (!customerProfile.projects || customerProfile.projects.length === 0) {
      setProjectsWithData([]);
      return;
    }
    const projectIds = customerProfile.projects.map(p => p.projectId);
    const q = query(collection(db, "messages"), where("roomId", "in", projectIds), orderBy("createdAt", "desc"), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lastMessages = new Map();
      snapshot.docs.forEach(doc => {
        const msg = doc.data();
        if (!lastMessages.has(msg.roomId)) lastMessages.set(msg.roomId, msg);
      });
      
      const enhancedProjects = customerProfile.projects.map(project => ({
        ...project,
        lastMessage: lastMessages.get(project.projectId)?.text || "אין הודעות",
        lastMessageTimestamp: lastMessages.get(project.projectId)?.createdAt?.toDate()
      }));
      
      enhancedProjects.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
      setProjectsWithData(enhancedProjects);
    });
    return () => unsubscribe();
  }, [customerProfile.projects]);
  
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 bg-white z-10 shadow-sm p-4"><h1 className="text-2xl font-bold text-blue-600">השיחות שלי</h1></header>
      <main className="flex-1 p-2 space-y-2">
        {projectsWithData.length === 0 && <p className="text-center text-gray-500 mt-10">אין פרויקטים משויכים.</p>}
        {projectsWithData.map(project => (
          <div key={project.projectId} onClick={() => onEnterRoom(project)} className="flex items-center p-3 bg-white rounded-lg shadow-sm cursor-pointer">
            <img src={project.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.name)}`} className="w-12 h-12 rounded-full object-cover" />
            <div className="flex-1 mr-4">
              <div className="flex justify-between"><h3 className="font-semibold">{project.name}</h3><span className="text-xs text-gray-400">{project.lastMessageTimestamp?.toLocaleDateString()}</span></div>
              <p className="text-sm text-gray-500 truncate">{project.lastMessage}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

function ChatRoomPage({ room, user, customerProfile, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const customerUid = user.uid;

  useEffect(() => {
    const q = query(collection(db, "messages"), where("roomId", "==", room.projectId), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filtered = [];
      snapshot.forEach(doc => {
        const msg = { id: doc.id, ...doc.data() };
        if (msg.senderId === customerUid || (msg.replyTo && msg.replyTo.ownerId === customerUid)) filtered.push(msg);
      });
      setMessages(filtered);
    });
    return () => unsubscribe();
  }, [room.projectId, customerUid]);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const handleSendText = async () => {
    if (!text.trim()) return;
    const messageData = {
      roomId: room.projectId,
      senderId: user.uid,
      senderName: customerProfile.name || "לקוח",
      type: "TEXT",
      text: text.trim(),
      createdAt: serverTimestamp(),
      replyTo: null 
    };
    await addDoc(collection(db, "messages"), messageData);
    setText('');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="sticky top-0 bg-white z-10 shadow-sm flex items-center p-3">
        <button onClick={onBack} className="p-2"><Icon name="ArrowRight" /></button>
        <h2 className="font-semibold mr-2">{room.name}</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} isMine={msg.senderId === customerUid} />)}
        <div ref={messagesEndRef} />
      </div>
      <div className="bg-white p-3 border-t flex items-center">
        <input type="text" value={text} onChange={e => setText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendText()} placeholder="כתוב הודעה..." className="flex-1 px-4 py-2 border rounded-full" />
        <button onClick={handleSendText} className="mr-2 p-2 bg-blue-600 text-white rounded-full"><Icon name="Send" className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

function MessageBubble({ msg, isMine }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs p-3 rounded-xl ${isMine ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
        <p>{msg.text}</p>
        <span className="text-xs opacity-70 block mt-1 text-left">{msg.createdAt?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
      </div>
    </div>
  );
}

function KnowledgeBasePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const searchResults = useMemo(() => KnowledgeBase.search(searchTerm), [searchTerm]);

  if (selectedProduct) return <ProductDetailPage product={selectedProduct} onBack={() => setSelectedProduct(null)} />;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">בסיס ידע</h1>
      <input type="search" placeholder="חפש מוצר..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
      <div className="mt-4 space-y-3">
        {searchResults.map(p => (
          <div key={p.id} onClick={() => setSelectedProduct(p)} className="flex items-center p-3 bg-white rounded-lg shadow-sm cursor-pointer">
            <img src={p.image} className="w-12 h-12 rounded object-cover" />
            <div className="mr-4"><h3 className="font-semibold text-blue-600">{p.name}</h3><p className="text-xs text-gray-500">{p.sku}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductDetailPage({ product, onBack }) {
  return (
    <div className="p-4">
      <button onClick={onBack} className="mb-4 text-blue-600">חזור</button>
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="mt-2 text-gray-700">{product.description}</p>
    </div>
  );
}

function OrderHistoryPage() { return <div className="p-4"><h1 className="text-2xl font-bold">היסטוריית הזמנות</h1><p>בקרוב...</p></div>; }
function FullScreenLoader({ text }) { return <div className="flex items-center justify-center h-screen">{text}</div>; }

const Icon = ({ name, className }) => {
  const icons = {
    MessageSquare: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>`,
    BookOpen: `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>`,
    Archive: `<polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line>`,
    User: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>`,
    LogOut: `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>`,
    ArrowRight: `<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>`,
    Send: `<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>`
  };
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{ __html: icons[name] }} />;
};
