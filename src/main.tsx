import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { UserProvider } from './context/UserContext'
import { AppProvider } from './context/AppContext'
import TimeLimitModal from './components/TimeLimitModal'
import './index.css'
import './framework/theme.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <UserProvider>
        <AppProvider>
          <App />
          <TimeLimitModal />
        </AppProvider>
      </UserProvider>
    </HashRouter>
  </React.StrictMode>,
)
