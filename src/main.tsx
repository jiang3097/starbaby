import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { UserProvider } from './context/UserContext'
import { StatsProvider } from './context/StatsContext'
import './index.css'
import './framework/theme.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <UserProvider>
        <StatsProvider>
          <App />
        </StatsProvider>
      </UserProvider>
    </HashRouter>
  </React.StrictMode>,
)
