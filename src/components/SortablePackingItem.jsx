import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function SortablePackingItem({ item, onToggle, onDelete }) {
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
      {...listeners}
      className="card"
      style={{
        ...style,
        opacity: item.is_done ? 0.6 : 1,
        textDecoration: item.is_done ? 'line-through' : 'none',
        cursor: 'grab'
      }}
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
        <button
          className="button-danger button-small"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(item.id)
          }}
        >
          삭제
        </button>
      </div>
    </div>
  )
}

