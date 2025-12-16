import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function SortableWordItem({ word, categories = [], onDelete }) {
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
        <button
          className="button-danger button-small"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(word.id)
          }}
        >
          삭제
        </button>
      </div>
    </div>
  )
}
