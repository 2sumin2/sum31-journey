import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function SortableWordItem({ word, onDelete }) {
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
          <h4 className="card-title">{word.language}</h4>
          <span style={{ fontSize: 14, color: '#555' }}>{word.korean}</span>
          {word.memo && (
            <p className="text-small text-muted" style={{ margin: '4px 0 0 0' }}>
              {word.memo}
            </p>
          )}
          {word.category && (
            <p className="text-small text-muted" style={{ margin: '4px 0 0 0' }}>
              {word.category}
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
