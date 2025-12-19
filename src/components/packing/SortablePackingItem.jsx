import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'

export default function SortablePackingItem({ item, onToggle, onDelete, onEdit }) {
  const [showMenu, setShowMenu] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className="card"
      style={{
        ...style,
        opacity: item.is_done ? 0.6 : 1,
        textDecoration: item.is_done ? 'line-through' : 'none',
        cursor: 'grab'
      }}
    >
      <div className="flex-row">
        <button
          style={{
            background: '#fff',
            color: '#000',
            border: 0,
            padding: 0,
          }}
          {...listeners}
          >☰</button>
        <input
          type="checkbox"
          checked={item.is_done}
          onChange={() => onToggle(item.id, item.is_done)}
          onClick={(e) => e.stopPropagation()}
        />
        <div style={{ flex: 1 }}>
          <h4 className="card-title">{item.name}</h4>
          {item.memo && (
            <p className="text-small text-muted" style={{ margin: '4px 0 0 0' }}>
              {item.memo}
            </p>
          )}
        </div>
        <div 
          style={{ position: 'relative' }}
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
        >
          <button
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              padding: '4px 8px',
              color: '#666'
            }}
          >
            ⋮
          </button>
          {showMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 100,
                minWidth: 100
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  onEdit(item)
                  setShowMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                수정
              </button>
              <button
                onClick={() => {
                  onDelete(item.id)
                  setShowMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#d32f2f'
                }}
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

