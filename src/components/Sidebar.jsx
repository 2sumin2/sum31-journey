import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from "../supabase"
import { useUser } from '../contexts/UserContext';

export default function Sidebar({ tripId }) {
  const { userName } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (path) => {
    return location.pathname === path
  }

  const menuItems = [
    { path: `/trip/${tripId}`, label: '일정' },
    { path: `/trip/${tripId}/expense`, label: '비용' },
    { path: `/trip/${tripId}/packing`, label: '준비물' },
    { path: `/trip/${tripId}/settings`, label: '설정' }
  ]

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/signin', { replace: true });
  }

  return (
    <>
      {/* 토글 버튼 (항상 표시) */}
      <button
        className="sidebar-toggle"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        style={{
          left: isOpen ? 166 : 0
        }}
      >
        {isOpen ? '←' : '☰'}
      </button>

      {/* 사이드바 */}
      <div
        className="sidebar"
        onClick={(e) => e.stopPropagation()}
        style={{
          left: isOpen ? 0 : -166,
          width: 134,
          boxShadow: isOpen ? '2px 0 8px rgba(0,0,0,0.1)' : 'none'
        }}
      >
        {userName && 
          <div className="sidebar-header">
            <h2>🍀{userName}</h2>
            <button className="logout-tag" onClick={handleLogout}>
              logout
            </button>
          </div>}
        <div className="sidebar-header">
          <h3>메뉴</h3>
        </div>

        <div className="sidebar-menu">
          {menuItems.map(item => (
            <button
              key={item.path}
              className={`sidebar-menu-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 외부 클릭 시 사이드바 닫기 */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
