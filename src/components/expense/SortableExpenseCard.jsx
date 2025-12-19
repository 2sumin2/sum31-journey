import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ExpenseCard from './ExpenseCard'

export default function SortableExpenseCard({ expense, category, onEdit, onDelete, onClick, showExpenseSimple }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: expense.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ExpenseCard
        expense={expense}
        category={category}
        onEdit={onEdit}
        onDelete={onDelete}
        onClick={onClick}
        listeners={listeners}
        showExpenseSimple={showExpenseSimple}
        dragListeners={listeners}
      />
    </div>
  )
}

