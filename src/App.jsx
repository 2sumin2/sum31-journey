import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Trip from './pages/Trip'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trip/:id" element={<Trip />} />
        <Route path="/trip/:id/expense" element={<Trip />} />
        <Route path="/trip/:id/packing" element={<Trip />} />
        <Route path="/trip/:id/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}
