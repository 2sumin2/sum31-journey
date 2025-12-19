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
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1000 : 'auto',
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
      {...listeners}
    >
      <div className="flex-row">
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
            <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
              <button
                className="dropdown-item"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  onEdit(item)
                  setShowMenu(false)
                }}
              >
                수정
              </button>
              <button
                className="dropdown-item danger"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  onDelete(item.id)
                  setShowMenu(false)
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

