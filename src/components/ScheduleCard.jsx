import { useState } from 'react'

export default function ScheduleCard({ schedule, showMemo = true, onClick, onEdit, onDelete, categories = [] }) {
  const [showMenu, setShowMenu] = useState(false)
  const category = categories.find(c => c.name === schedule.category)
  const bgColor = category?.bg_color || '#ffffff'
  const textColor = category?.text_color || '#000000'

  const formatTime = (time) => {
    if (!time) return ''
    if (time.includes('~')) {
      return time
    }
    return time.slice(0, 5)
  }

  return (
    <div
      className="card card-clickable"
      onClick={onClick}
      style={{
        background: bgColor,
        color: textColor
      }}
    >
      <div className="card-content">
        <div className="card-body">
          <div className="card-header">
            {schedule.time && (
              <span className="text-time">
                {formatTime(schedule.time)}
              </span>
            )}
            <h4 className="card-title">{schedule.title}</h4>
          </div>
          {schedule.category && (
            <span className="category-tag">
              {schedule.category}
            </span>
          )}
          {showMemo && schedule.memo && (
            <p className="card-memo" style={{ color: category?.text_color || '#fff' }}>
              {schedule.memo}
            </p>
          )}
        </div>
        <div 
          className="dropdown-container"
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
        >
          <button className="dropdown-button">
            ⋮
          </button>
          {showMenu && (
            <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
              <button
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                  onEdit?.()
                }}
              >
                수정
              </button>
              <button
                className="dropdown-item danger"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                  onDelete?.()
                }}
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
      {showMenu && (
        <div className="dropdown-overlay" onClick={() => setShowMenu(false)} />
      )}
    </div>
  )
}
