import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import Modal from '../../ui/Modal'

export default function ExpenseModal({ tripId, tripDays = [], expense = null, categories = [], exchangeRates = {}, onClose }) {
  const [title, setTitle] = useState('')
  const [tripDayId, setTripDayId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [currency, setCurrency] = useState('KRW')
  const [unitAmount, setUnitAmount] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [exchangeRate, setExchangeRate] = useState('')
  const [totalAmountKrw, setTotalAmountKrw] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('planned')
  const [isPrepaid, setIsPrepaid] = useState(false)
  const [memo, setMemo] = useState('')
  const [memo2, setMemo2] = useState('')
  const [expenseDate, setExpenseDate] = useState('')
  const [reservationStatus, setReservationStatus] = useState('none')
  const [isCash, setIsCash] = useState(false)
  const [isCard, setIsCard] = useState(false)

  useEffect(() => {
    if (expense) {
      setTitle(expense.title || '')
      setTripDayId(expense.trip_day_id || '')
      setCategoryId(expense.category_id || '')
      setPaymentMethod(expense.payment_method || 'cash')
      setCurrency(expense.currency || 'KRW')
      setUnitAmount(expense.unit_amount?.toString() || '')
      setQuantity(expense.quantity || 1)
      setExchangeRate(expense.exchange_rate?.toString() || '')
      setTotalAmountKrw(expense.total_amount_krw?.toString() || '')
      setPaymentStatus(expense.payment_status || 'planned')
      setIsPrepaid(expense.is_prepaid || false)
      setMemo(expense.memo || '')
      setMemo2(expense.memo2 || '')
      setExpenseDate(expense.expense_date || '')
      setReservationStatus(expense.reservation_status || 'none')
      setIsCash(expense.is_cash || false)
      setIsCard(expense.is_card || false)
    } else {
      // 기본값: 기타 날짜로 설정 (사전 결제 항목용)
      const otherDay = tripDays.find(d => d.date === '1900-01-01') || tripDays[0]
      if (otherDay) {
        setTripDayId(otherDay.id)
      }
    }
  }, [expense, tripDays])

  // 환율 적용 계산
  useEffect(() => {
    if (unitAmount && currency && exchangeRates[currency]) {
      const rate = exchangeRate || exchangeRates[currency].rate_to_krw
      const total = parseFloat(unitAmount) * quantity * rate
      setTotalAmountKrw(total.toFixed(2))
      if (!exchangeRate) {
        setExchangeRate(rate.toString())
      }
    } else if (currency === 'KRW' && unitAmount) {
      const total = parseFloat(unitAmount) * quantity
      setTotalAmountKrw(total.toFixed(2))
      setExchangeRate('1')
    }
  }, [unitAmount, quantity, currency, exchangeRates, exchangeRate])

  const save = async () => {
    if (!title || !categoryId) {
      alert('제목과 분류를 입력해주세요.')
      return
    }

    const expenseData = {
      trip_id: tripId,
      trip_day_id: tripDayId || null,
      category_id: categoryId,
      title,
      payment_method: paymentMethod,
      currency,
      unit_amount: parseFloat(unitAmount),
      quantity: quantity || 1,
      exchange_rate: parseFloat(exchangeRate) || 1,
      total_amount_krw: parseFloat(totalAmountKrw) || 0,
      payment_status: paymentStatus,
      is_prepaid: isPrepaid,
      memo: memo || null,
      memo2: memo2 || null,
      expense_date: expenseDate || null,
      reservation_status: reservationStatus,
      is_cash: isCash,
      is_card: isCard
    }

    if (expense) {
      const { error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', expense.id)
      
      if (error) {
        console.error('update error', error)
        alert('비용 수정에 실패했습니다.')
        return
      }
    } else {
      const { error } = await supabase
        .from('expenses')
        .insert(expenseData)
      
      if (error) {
        console.error('insert error', error)
        alert('비용 추가에 실패했습니다.')
        return
      }
    }

    onClose()
  }

  // 기타 날짜 선택 (사전 결제용)
  const otherDay = tripDays.find(d => d.date === '1900-01-01')
  const regularDays = tripDays.filter(d => d.date !== '1900-01-01').sort((a, b) => a.day_order - b.day_order)

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={expense ? '비용 수정' : '비용 추가'}
    >
      <div>
        <input
          className="input"
          placeholder="세부항목 (예: 돈카츠 정식) *"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <select
          className="input"
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
        >
          <option value="">분류 선택 *</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>일자</label>
          <select
            className="input"
            value={tripDayId}
            onChange={e => setTripDayId(e.target.value)}
          >
            {otherDay && (
              <option value={otherDay.id}>기타 (사전 결제)</option>
            )}
            {regularDays.map(day => (
              <option key={day.id} value={day.id}>
                Day {day.day_order} - {new Date(day.date).toLocaleDateString('ko-KR')}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="checkbox"
              checked={isCash}
              onChange={e => setIsCash(e.target.checked)}
            />
            <span>현금</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="checkbox"
              checked={isCard}
              onChange={e => setIsCard(e.target.checked)}
            />
            <span>카드</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <select
            className="input"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="KRW">KRW (원)</option>
            <option value="USD">USD (달러)</option>
            <option value="JPY">JPY (엔)</option>
            <option value="EUR">EUR (유로)</option>
            <option value="CNY">CNY (위안)</option>
          </select>
          <input
            className="input"
            type="number"
            placeholder="금액"
            value={unitAmount}
            onChange={e => setUnitAmount(e.target.value)}
            style={{ flex: 2 }}
          />
          <input
            className="input"
            type="number"
            placeholder="수량"
            value={quantity}
            onChange={e => setQuantity(parseInt(e.target.value) || 1)}
            style={{ flex: 1 }}
          />
        </div>

        {currency !== 'KRW' && (
          <div style={{ marginBottom: 12 }}>
            <input
              className="input"
              type="number"
              placeholder="환율 (자동 적용)"
              value={exchangeRate}
              onChange={e => setExchangeRate(e.target.value)}
            />
            <p style={{ fontSize: 12, color: '#666', margin: '4px 0' }}>
              총액 (원화): {parseFloat(totalAmountKrw || 0).toLocaleString()}원
            </p>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>결제 상태</label>
          <select
            className="input"
            value={paymentStatus}
            onChange={e => setPaymentStatus(e.target.value)}
          >
            <option value="planned">예정</option>
            <option value="paid">결제 완료</option>
            <option value="prepaid">사전 결제</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>예약 상태</label>
          <select
            className="input"
            value={reservationStatus}
            onChange={e => setReservationStatus(e.target.value)}
          >
            <option value="none">없음</option>
            <option value="required">필요</option>
            <option value="completed">완료</option>
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={isPrepaid}
            onChange={e => setIsPrepaid(e.target.checked)}
          />
          <span>사전 결제</span>
        </label>

        <textarea
          className="input"
          placeholder="비고"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          rows={3}
        />

        <textarea
          className="input"
          placeholder="비고2 (상세에만 표시)"
          value={memo2}
          onChange={e => setMemo2(e.target.value)}
          rows={3}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={save} style={{ flex: 1 }}>
            {expense ? '수정' : '저장'}
          </button>
          <button onClick={onClose} style={{ flex: 1, background: '#666' }}>
            취소
          </button>
        </div>
      </div>
    </Modal>
  )
}

