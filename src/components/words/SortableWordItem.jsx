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
  } = useSortable({ id: word.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
    >
      <div className="flex-row" style={{ alignItems: 'center' }}>
        <button
          style={{
            background: '#fff',
            color: '#000',
            border: 0,
            padding: 0,
            marginRight: 8,
          }}
          {...listeners}
        >
          ☰
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4 className="card-title" style={{ margin: 0 }}>{word.language}</h4>
            {category && (
              <span style={{ 
                fontSize: 12, 
                padding: '2px 8px', 
                background: '#e0e0e0', 
                borderRadius: 4,
                color: '#555'
              }}>
                {category.name}
              </span>
            )}
          </div>
          <span style={{ fontSize: 14, color: '#555', marginTop: 4, display: 'block' }}>{word.korean}</span>
          {word.memo && (
            <p className="text-small text-muted" style={{ margin: '4px 0 0 0' }}>
              {word.memo}
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
                  onEdit(word)
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
                  onDelete(word.id)
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
