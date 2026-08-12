import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Experience from './pages/Experience.tsx'
import Uses from './pages/Uses.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/uses" element={<Uses />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
