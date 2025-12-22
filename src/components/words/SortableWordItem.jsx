import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'

export default function SortableWordItem({ word, categories = [], onDelete, onUpdate, onEdit, wordsOpen, editingWords }) {
  const [showMenu, setShowMenu] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: word.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 850 : 'auto',
  }

  // 카테고리 찾기
  const category = categories.find(c => c.id === word.category_id)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className="card"
      style={{
        ...style,
        cursor: 'grab',
      }}
      {...listeners}
    >
      <div className="card-content">
        <div className="card-body">
          <div className="card-header">
            <h4 className="card-title">{word.language}</h4>
          </div>
          <div className="badge-box">
            {category && (
              <span className="badge category-badge">
                {category.name}
              </span>
            )}
          </div>
          <span style={{ fontSize: 14, color: '#555', marginTop: 4, display: 'block' }}>{word.korean}</span>
          <div className="memo-box">
            {word.memo && (
              <p className="text-small text-muted" style={{ margin: '4px 0 0 0' }}>
                {word.memo}
              </p>
            )}
          </div>
        </div>
        <div 
          className="dropdown-container"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
        >
          <button className="dropdown-button">
            ⋮
          </button>
          {showMenu && (
            <div
              className="dropdown-menu"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="dropdown-item"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  onEdit(word)
                  setShowMenu(false)
                }}
              >
                수정
              </button>
              <button
                className="dropdown-item danger"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  onDelete(word.id)
                  setShowMenu(false)
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
