import { useState } from 'react'

export default function ExpenseCard({ expense, category, onEdit, onDelete, onClick }) {
  const [showMenu, setShowMenu] = useState(false)

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + (currency === 'KRW' ? '원' : ` ${currency}`)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      planned: { text: '예정', className: 'planned' },
      paid: { text: '결제 완료', className: 'paid' },
      prepaid: { text: '사전 결제', className: 'prepaid' }
    }
    const s = statusMap[status] || statusMap.planned
    return (
      <span className={`status-badge ${s.className}`}>
        {s.text}
      </span>
    )
  }

  return (
    <div
      className={`card ${onClick ? 'card-clickable' : ''}`}
      onClick={onClick}
      style={{
        background: category?.bg_color || '#fff',
        color: category?.text_color || '#000'
      }}
    >
      <div className="card-content">
        <div className="card-body">
          <div className="card-header">
            <h4 className="card-title">{expense.title}</h4>
            {getStatusBadge(expense.payment_status)}
            {expense.is_prepaid && (
              <span className="badge badge-small" style={{ background: '#ff9800', color: '#fff' }}>
                사전결제
              </span>
            )}
          </div>
          {category && (
            <span className="category-tag">
              {category.name}
            </span>
          )}
          <div className="mt-8">
            <p className="expense-amount">
              {formatCurrency(expense.total_amount_krw, 'KRW')}
            </p>
            {expense.currency !== 'KRW' && (
              <p className="expense-detail">
                {formatCurrency(expense.unit_amount, expense.currency)} × {expense.quantity}
                {expense.exchange_rate && ` (환율: ${expense.exchange_rate})`}
              </p>
            )}
          </div>
          {(expense.is_cash || expense.is_card) && (
            <p className="text-small text-muted">
              {expense.is_cash && '현금 '}
              {expense.is_card && '카드'}
            </p>
          )}
          {expense.memo && (
            <p className="card-memo" style={{ color: category?.text_color || '#666' }}>
              {expense.memo}
            </p>
          )}
        </div>
        <div 
          className="dropdown-container"
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
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                  onEdit?.()
                }}
              >
                수정
              </button>
              <button
                className="dropdown-item danger"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                  onDelete?.()
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
