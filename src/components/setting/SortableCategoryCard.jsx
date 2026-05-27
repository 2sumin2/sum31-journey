import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function SortableCategoryCard({ category, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 850 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className="card card-content mb-12"
      style={{
        ...style,
        cursor: 'grab'
      }}
      {...listeners}
    >
      <div className="flex-row" style={{ flex: 1 }}>
        <span
          style={{
            background: category.bg_color || '#000000',
            color: category.text_color || '#ffffff',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 14,
            minWidth: 80,
            textAlign: 'center'
          }}
        >
          {category.name}
        </span>
      </div>
      <div className="flex-row"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
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

