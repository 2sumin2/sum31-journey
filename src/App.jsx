import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Trip from './pages/Trip'
import Settings from './pages/Settings'
import SignIn from './pages/SignIn'
import RequireAuth from './components/RequireAuth'
import { UserProvider } from './contexts/UserContext';

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/trip/:id" element={<RequireAuth><Trip /></RequireAuth>} />
          <Route path="/trip/:id/expense" element={<RequireAuth><Trip /></RequireAuth>} />
          <Route path="/trip/:id/packing" element={<RequireAuth><Trip /></RequireAuth>} />
          <Route path="/trip/:id/words" element={<RequireAuth><Trip /></RequireAuth>} />
          <Route path="/trip/:id/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}