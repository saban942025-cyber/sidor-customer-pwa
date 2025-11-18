
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // ודא שהקובץ נקרא בדיוק App.jsx (עם A גדולה)
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
