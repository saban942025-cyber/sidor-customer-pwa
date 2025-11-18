מדריך פריסה סופי (Deploy): Sidor v8

אחי, הגענו לישורת האחרונה. כדי שהמערכת תעבוד ב-Cloudflare, אנחנו חייבים לפצל את הקבצים ל-3 פרויקטים נפרדים. אל תנסה להעלות את הכל במכה אחת.

עקוב אחר ההוראות האלו במדויק:

פרויקט 1: אפליקציית הלקוח (Customer App PWA)

המטרה: האפליקציה הראשית ללקוחות (React).
כתובת יעד: app.sidor.co.il

צור מאגר GitHub חדש בשם sidor-customer-app.

העלה אליו אך ורק את הקבצים הבאים (מתוך התיקייה הנוכחית שלך):

package.json

vite.config.js

tailwind.config.js

postcss.config.js

index.html (הקובץ הראשי שנמצא בחוץ)

src/ (כל תיקיית ה-src עם main.jsx, App.jsx, index.css)

אל תעלה את התיקיות sidor-admin-panel, sidor-reports, או functions.

ב-Cloudflare, צור פרויקט חדש > Connect to Git > בחר את sidor-customer-app.

Build command: npm run build

Output directory: dist

פרויקט 2: ממשק הניהול (Admin Panel)

המטרה: הממשק שלך לניהול הזמנות וצ'אט.
כתובת יעד: admin.sidor.co.il

צור מאגר GitHub חדש בשם sidor-admin.

קח את הקובץ sidor-admin-panel/index.html מהתיקייה הנוכחית.

שים אותו בתיקייה הראשית של המאגר החדש (שיהיה סתם index.html).

ב-Cloudflare, צור פרויקט חדש > Connect to Git > בחר את sidor-admin.

Framework preset: None (זה אתר סטטי).

פרויקט 3: דוחות (Reports)

המטרה: דף ה-KPI המוגן בסיסמה.
כתובת יעד: reports.sidor.co.il

צור מאגר GitHub חדש בשם sidor-reports.

קח את הקובץ sidor-reports/reports.html.

שנה את שמו ל-index.html.

שים אותו בתיקייה הראשית של המאגר החדש.

ב-Cloudflare, צור פרויקט חדש > Connect to Git > בחר את sidor-reports.

Framework preset: None.

פרויקט 4: הבוט (Cloud Functions)

המטרה: המוח של המערכת (לא עולה ל-Cloudflare).

השאר את תיקיית functions אצלך במחשב.

השתמש ב-firebase-tools (שורת הפקודה) כדי להעלות אותה ל-Firebase:
firebase deploy --only functions

סיכום

במקום תיקייה אחת גדולה ומבולגנת, יהיו לך 3 מאגרים נקיים ב-GitHub, ו-3 אתרים נפרדים ומהירים ב-Cloudflare.

בהצלחה!אפליקציית📱 לקוחות ח.סבן חומרי בנין
