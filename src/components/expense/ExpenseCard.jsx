import { useState } from 'react'

export default function ExpenseCard({ expense, category, onEdit, onDelete, onClick, dragListeners, showExpenseSimple }) {
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
      <span className={`badge status-badge ${s.className}`}>
        {s.text}
      </span>
    )
  }

  return (
    <div
      className={`card`}
      {...dragListeners}
      style={{
        background: category?.bg_color || '#fff',
        color: category?.text_color || '#000'
      }}
      onClick={onClick}
    >
      <div className="card-content">
        <div className="card-body">
          <div className="card-header">
            <h4 className="card-title">{expense.title}</h4>
            {/* {expense.is_prepaid && (
              <span className="badge badge-small" style={{ background: '#ff9800', color: '#fff' }}>
                사전결제
              </span>
            )} */}
          </div>
          {!showExpenseSimple && (
            <div className="badge-box">
              {getStatusBadge(expense.payment_status)}

              {category && (
                <span className="badge category-badge">
                  {category.name}
                </span>
              )}

              {expense.is_cash && (
                <span className="badge cash-badge is-cash">현금</span>
              )}

              {expense.is_card && (
                <span className="badge cash-badge is-card">카드</span>
              )}
            </div>
          )}
          <div className="mt-8">
            <p className="expense-amount">
              {formatCurrency(expense.total_amount_krw, 'KRW')}
              <span className='currency-info'>
                {expense.currency !== 'KRW' && '(' + (formatCurrency(expense.unit_amount, expense.currency) + (expense.quantity > 1 ? ' x' + expense.quantity : '')) + ')'}
              </span>
            </p>
            {/* {!showExpenseSimple && expense.currency !== 'KRW' && (
              <p className="expense-detail">
                {formatCurrency(expense.unit_amount, expense.currency)} × {expense.quantity}
                {expense.exchange_rate && ` (환율: ${expense.exchange_rate})`}
              </p>
            )} */}
          </div>
          {!showExpenseSimple && expense.memo && (
            <p className="card-memo" style={{ color: category?.text_color || '#666' }}>
              {expense.memo}
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
