import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function SortableCategoryCard({ category, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="card card-content mb-12"
      style={{
        ...style,
        cursor: 'grab'
      }}
    >
      <div className="flex-row" style={{ flex: 1 }}>
        <span
          style={{
            background: category.bg_color || '#000000',
            color: category.text_color || '#ffffff',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            minWidth: 80,
            textAlign: 'center'
          }}
        >
          {category.name}
        </span>
        <div className="text-small text-muted">
          배경: <span style={{ color: category.bg_color || '#000000' }}>■</span>
          {' / '}
          글자: <span style={{ color: category.text_color || '#ffffff' }}>■</span>
        </div>
      </div>
      <div className="flex-row" onClick={(e) => e.stopPropagation()}>
        <button className="button-secondary button-small" onClick={onEdit}>
          수정
        </button>
        <button className="button-danger button-small" onClick={onDelete}>
          삭제
        </button>
      </div>
    </div>
  )
}

