import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import ScheduleCard from '../components/ScheduleCard'
import ScheduleModal from '../components/ScheduleModal'
import ExpenseCard from '../components/ExpenseCard'
import ExpenseModal from '../components/ExpenseModal'
import SortableExpenseCard from '../components/SortableExpenseCard'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import PackingList from '../components/PackingList'
import Sidebar from '../components/Sidebar'
import Modal from '../ui/Modal'

export default function Trip() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('schedule')
  const [trip, setTrip] = useState(null)
  const [tripDays, setTripDays] = useState([])
  const [schedules, setSchedules] = useState([])
  const [scheduleCategories, setScheduleCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [expenseCategories, setExpenseCategories] = useState([])
  const [exchangeRates, setExchangeRates] = useState({})
  const [open, setOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [selectedDate, setSelectedDate] = useState('전체')
  const [showAllMemos, setShowAllMemos] = useState(true)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [editingHighlight, setEditingHighlight] = useState(null)
  const [highlightValue, setHighlightValue] = useState('')
  const [expenseViewMode, setExpenseViewMode] = useState('day') // 'day' or 'category'
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState('전체')
  const [showExpenseSimple, setShowExpenseSimple] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const location = useLocation()

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdays[date.getDay()]
    return `${month}/${day} (${weekday})`
  }

  // 여행 정보 가져오기
  const fetchTrip = async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('trip fetch error', error)
      return
    }
    
    setTrip(data)
    
    // trip_days 생성 (없으면)
    if (data) {
      await ensureTripDays(data)
    }
  }

  // trip_days 확인 및 생성
  const ensureTripDays = async (tripData) => {
    const { data: existingDays } = await supabase
      .from('trip_days')
      .select('*')
      .eq('trip_id', id)
      .order('day_order', { ascending: true })

    if (existingDays && existingDays.length > 0) {
      // 기타 날짜가 없으면 추가 (사전 결제용)
      const otherDay = existingDays.find(d => d.date === '1900-01-01')
      if (!otherDay) {
        const { data } = await supabase
          .from('trip_days')
          .insert({
            trip_id: id,
            date: '1900-01-01',
            day_order: 0,
            highlight: '기타 (사전 결제)'
          })
          .select()
        if (data) {
          setTripDays([data[0], ...existingDays])
          return
        }
      }
      setTripDays(existingDays)
      return
    }

    // trip_days 생성
    const startDate = new Date(tripData.start_date)
    const endDate = new Date(tripData.end_date)
    const days = [{
      trip_id: id,
      date: '1900-01-01',
      day_order: 0,
      highlight: '기타 (사전 결제)'
    }]
    let currentDate = new Date(startDate)
    let dayOrder = 1

    while (currentDate <= endDate) {
      days.push({
        trip_id: id,
        date: currentDate.toISOString().split('T')[0],
        day_order: dayOrder,
        highlight: null
      })
      currentDate.setDate(currentDate.getDate() + 1)
      dayOrder++
    }

    const { data, error } = await supabase
      .from('trip_days')
      .insert(days)
      .select()

    if (error) {
      console.error('trip_days create error', error)
      return
    }

    setTripDays(data || [])
  }

  // 일정 가져오기
  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('trip_id', id)
      .order('date', { ascending: true })
      .order('order_no', { ascending: true })
  
    if (error) {
      console.error('schedules fetch error', error)
      setSchedules([])
      return
    }
  
    // 시간 순으로 정렬
    const sorted = (data ?? []).sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
      // 같은 날짜면 시간으로 정렬
      const timeA = a.time || ''
      const timeB = b.time || ''
      if (timeA && timeB) {
        // 시간 범위인 경우 시작 시간 추출
        const startA = timeA.includes('~') ? timeA.split('~')[0].trim() : timeA
        const startB = timeB.includes('~') ? timeB.split('~')[0].trim() : timeB
        return startA.localeCompare(startB)
      }
      if (timeA) return -1
      if (timeB) return 1
      return 0
    })
  
    setSchedules(sorted)
  }

  // 카테고리 가져오기 (expense_categories 사용)
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name', { ascending: true })
  
    if (error) {
      console.error('categories fetch error', error)
      setScheduleCategories([])
      return
    }
  
    setScheduleCategories(data ?? [])
  }

  // 비용 가져오기
  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', id)
      .order('expense_date', { ascending: true })
      .order('display_order', { ascending: true })
  
    if (error) {
      console.error('expenses fetch error', error)
      setExpenses([])
      return
    }
  
    setExpenses(data ?? [])
  }

  // 비용 카테고리 가져오기
  const fetchExpenseCategories = async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
  
    if (error) {
      console.error('expense categories fetch error', error)
      setExpenseCategories([])
      return
    }
  
    if (!data || data.length === 0) {
      // 기본 카테고리 생성
      const defaultCategories = ['숙소', '관광', '액티비티', '식비', '교통', '쇼핑', '기타']
      const categoriesToInsert = defaultCategories.map(name => ({ name }))
      const { data: inserted, error: insertError } = await supabase
        .from('expense_categories')
        .insert(categoriesToInsert)
        .select()
      
      if (insertError) {
        console.error('create default categories error', insertError)
        setExpenseCategories([])
        return
      }
      
      setExpenseCategories(inserted || [])
      return
    }
  
    setExpenseCategories(data)
  }

  // 환율 가져오기
  const fetchExchangeRates = async () => {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
  
    if (error) {
      console.error('exchange rates fetch error', error)
    }
  
    const ratesMap = {
      KRW: { currency: 'KRW', rate_to_krw: 1 }
    }
    
    if (data && data.length > 0) {
      data.forEach(rate => {
        ratesMap[rate.currency] = rate
      })
    } else {
      // 기본 환율 설정 (DB에 없을 때)
      ratesMap.USD = { currency: 'USD', rate_to_krw: 1300 }
      ratesMap.JPY = { currency: 'JPY', rate_to_krw: 9 }
      ratesMap.EUR = { currency: 'EUR', rate_to_krw: 1400 }
      ratesMap.CNY = { currency: 'CNY', rate_to_krw: 180 }
    }
    
    setExchangeRates(ratesMap)
  }

  useEffect(() => {
    if (id) {
      fetchTrip()
      fetchSchedules()
      fetchCategories()
      fetchExpenses()
      fetchExpenseCategories()
      fetchExchangeRates()
    }
  }, [id])

  // 일정 삭제
  const handleDelete = async (scheduleId) => {
    if (!confirm('일정을 삭제하시겠습니까?')) return
    
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId)
    
    if (error) {
      console.error('delete error', error)
      return
    }
    
    fetchSchedules()
  }

  // 일정 수정
  const handleEdit = (schedule) => {
    setEditingSchedule(schedule)
    setOpen(true)
  }

  // 비용 삭제
  const handleExpenseDelete = async (expenseId) => {
    if (!confirm('비용을 삭제하시겠습니까?')) return
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
    
    if (error) {
      console.error('delete expense error', error)
      return
    }
    
    fetchExpenses()
  }

  // 비용 수정
  const handleExpenseEdit = (expense) => {
    setEditingExpense(expense)
    setExpenseOpen(true)
  }

  // 하이라이트 업데이트
  const updateHighlight = async (dayId, highlight) => {
    const { error } = await supabase
      .from('trip_days')
      .update({ highlight })
      .eq('id', dayId)
    
    if (error) {
      console.error('highlight update error', error)
      return
    }
    
    fetchTrip()
    setEditingHighlight(null)
    setHighlightValue('')
  }

  // 하이라이트 수정 시작
  const startEditHighlight = (day) => {
    setEditingHighlight(day.id)
    setHighlightValue(day.highlight || '')
  }

  // 비용 통계 계산
  const calculateExpenseStats = () => {
    const total = expenses.reduce((sum, e) => sum + (parseFloat(e.total_amount_krw) || 0), 0)
    const prepaid = expenses
      .filter(e => e.is_prepaid || e.payment_status === 'prepaid')
      .reduce((sum, e) => sum + (parseFloat(e.total_amount_krw) || 0), 0)
    const paid = expenses
      .filter(e => e.payment_status === 'paid')
      .reduce((sum, e) => sum + (parseFloat(e.total_amount_krw) || 0), 0)
    const planned = total - prepaid - paid

    return { total, prepaid, paid, planned }
  }

  const stats = calculateExpenseStats()

  // 일정 섹션 렌더링
  const renderScheduleSection = () => (
    <>
      <div className="header">
        <h2 style={{ display: 'inline' }}>여행 일정</h2>
        <button onClick={() => { setEditingSchedule(null); setOpen(true) }}>
          + 일정
        </button>
      </div>

      {/* 필터 및 메모 토글 */}
      <div className="filter-group">
        <div className="flex-row">
          <button
            className={`filter-button ${selectedDate === '전체' ? 'active' : ''}`}
            onClick={() => setSelectedDate('전체')}
          >
            전체
          </button>
          {tripDays.filter(d => d.date !== '1900-01-01').map(day => (
            <button
              key={day.id}
              className={`filter-button ${selectedDate === day.date ? 'active' : ''}`}
              onClick={() => setSelectedDate(day.date)}
            >
              {formatDate(day.date)}
            </button>
          ))}
        </div>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showAllMemos}
            onChange={(e) => setShowAllMemos(e.target.checked)}
          />
          <span>간단히 보기</span>
        </label>
      </div>

      {/* 일자별 표시 */}
      {selectedDate === '전체' ? (
        (() => {
          // trip_days와 schedules의 모든 날짜를 합쳐서 표시
          const allDates = new Set()
          tripDays.forEach(d => {
            if (d.date !== '1900-01-01') allDates.add(d.date)
          })
          schedules.forEach(s => allDates.add(s.date))
          
          const sortedDates = Array.from(allDates).sort()
          
          return sortedDates.map(date => {
            const day = tripDays.find(d => d.date === date)
            const daySchedules = schedules.filter(s => s.date === date)
            
            // day가 없으면 (여행 기간 외 날짜) 임시 day 객체 생성
            const displayDay = day || {
              id: `temp-${date}`,
              date,
              day_order: null,
              highlight: null
            }
            
            if (daySchedules.length === 0 && !displayDay.highlight) return null

            return (
              <div key={displayDay.id || date} className="mb-24">
                <div className="flex-row mb-12">
                  <h3 
                    style={{ margin: 0, cursor: 'pointer' }}
                    onClick={() => startEditHighlight(displayDay)}
                  >
                    {displayDay.day_order ? `Day ${displayDay.day_order} - ${formatDate(date)}` : formatDate(date)}
                  </h3>
                  {displayDay.highlight && (
                    <span className="highlight-badge">
                      {displayDay.highlight}
                    </span>
                  )}
                </div>
                {daySchedules.map(schedule => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    showMemo={showAllMemos}
                    onClick={() => setSelectedSchedule(schedule)}
                    onEdit={() => handleEdit(schedule)}
                    onDelete={() => handleDelete(schedule.id)}
                    categories={scheduleCategories}
                  />
                ))}
              </div>
            )
          })
        })()
      ) : (
        <div>
          {tripDays
            .filter(day => day.date === selectedDate && day.date !== '1900-01-01')
            .map(day => {
              const daySchedules = schedules.filter(s => s.date === day.date)
              return (
                <div key={day.id} className="mb-24">
                  <div className="flex-row mb-12">
                    <h3 
                      style={{ margin: 0, cursor: 'pointer' }}
                      onClick={() => startEditHighlight(day)}
                    >
                      Day {day.day_order} - {formatDate(day.date)}
                    </h3>
                    {day.highlight && (
                      <span className="highlight-badge">
                        {day.highlight}
                      </span>
                    )}
                  </div>
                  {daySchedules.map(schedule => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      showMemo={showAllMemos}
                      onClick={() => setSelectedSchedule(schedule)}
                      onEdit={() => handleEdit(schedule)}
                      onDelete={() => handleDelete(schedule.id)}
                      categories={scheduleCategories}
                    />
                  ))}
                </div>
              )
            })}
        </div>
      )}
    </>
  )

  // 비용 섹션 렌더링
  const renderExpenseSection = () => {
    // 일자별 총액 계산
    const getDayTotal = (dayId) => {
      return expenses
        .filter(e => e.trip_day_id === dayId)
        .reduce((sum, e) => sum + (parseFloat(e.total_amount_krw) || 0), 0)
    }

    // 카테고리별 총액 계산
    const getCategoryTotal = (categoryId) => {
      return expenses
        .filter(e => e.category_id === categoryId)
        .reduce((sum, e) => sum + (parseFloat(e.total_amount_krw) || 0), 0)
    }

    // 필터링된 비용 가져오기
    const getFilteredExpenses = () => {
      if (expenseViewMode === 'day') {
        if (selectedExpenseCategory === '전체') {
          return expenses
        }
        return expenses.filter(e => {
          const day = tripDays.find(d => d.id === e.trip_day_id)
          return day && day.date === selectedExpenseCategory
        })
      } else {
        if (selectedExpenseCategory === '전체') {
          return expenses
        }
        return expenses.filter(e => e.category_id === selectedExpenseCategory)
      }
    }

    const filteredExpenses = getFilteredExpenses()

    return (
      <>
        <div className="header">
          <h2 style={{ display: 'inline' }}>비용 관리</h2>
          <button onClick={() => { setEditingExpense(null); setExpenseOpen(true) }}>
            + 비용
          </button>
        </div>

        {/* 비용 통계 */}
        <div className="card mb-16">
          <h3 style={{ marginTop: 0 }}>비용 요약</h3>
          <div className="stats-grid">
            <div>
              <p className="stats-item-label">총액</p>
              <p className="stats-item-value">
                {stats.total.toLocaleString()}원
              </p>
            </div>
            <div>
              <p className="stats-item-label">사전 결제액</p>
              <p className="stats-item-value orange">
                {stats.prepaid.toLocaleString()}원
              </p>
            </div>
            <div>
              <p className="stats-item-label">결제 완료</p>
              <p className="stats-item-value green">
                {stats.paid.toLocaleString()}원
              </p>
            </div>
            <div>
              <p className="stats-item-label">결제 예정</p>
              <p className="stats-item-value gray">
                {stats.planned.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>

        {/* 필터 및 간단히 보기 */}
        <div className="filter-group">
          <div className="flex-row">
            <button
              className={`filter-button ${expenseViewMode === 'day' ? 'active' : ''}`}
              onClick={() => setExpenseViewMode('day')}
            >
              일자별
            </button>
            <button
              className={`filter-button ${expenseViewMode === 'category' ? 'active' : ''}`}
              onClick={() => setExpenseViewMode('category')}
            >
              카테고리별
            </button>
          </div>
          {expenseViewMode === 'day' ? (
            <div className="flex-row">
              <button
                className={`filter-button ${selectedExpenseCategory === '전체' ? 'active' : ''}`}
                onClick={() => setSelectedExpenseCategory('전체')}
              >
                전체
              </button>
              {tripDays.filter(d => d.date !== '1900-01-01').map(day => (
                <button
                  key={day.id}
                  className={`filter-button ${selectedExpenseCategory === day.date ? 'active' : ''}`}
                  onClick={() => setSelectedExpenseCategory(day.date)}
                >
                  {formatDate(day.date)}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-row">
              <button
                className={`filter-button ${selectedExpenseCategory === '전체' ? 'active' : ''}`}
                onClick={() => setSelectedExpenseCategory('전체')}
              >
                전체
              </button>
              {expenseCategories.map(cat => (
                <button
                  key={cat.id}
                  className={`filter-button ${selectedExpenseCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedExpenseCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showExpenseSimple}
              onChange={(e) => setShowExpenseSimple(e.target.checked)}
            />
            <span>간단히 보기</span>
          </label>
        </div>        

        {/* 일자별 비용 */}
        {expenseViewMode === 'day' && (
          <>
            {tripDays
              .filter(day => {
                if (selectedExpenseCategory === '전체') return true
                return day.date === selectedExpenseCategory
              })
              .map(day => {
                const dayExpenses = filteredExpenses.filter(e => e.trip_day_id === day.id)
                if (dayExpenses.length === 0) return null
                const dayTotal = getDayTotal(day.id)

                return (
                  <div key={day.id} className="mb-24">
                    <h3>
                      {day.date === '1900-01-01' 
                        ? `기타 (사전 결제) - ${dayTotal.toLocaleString()}원`
                        : `Day ${day.day_order} - ${formatDate(day.date)} - ${dayTotal.toLocaleString()}원`}
                    </h3>
                    {!showExpenseSimple && (
                      <DndContext
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => {
                          const { active, over } = event
                          if (!over || active.id === over.id) return

                          const oldIndex = dayExpenses.findIndex(e => e.id === active.id)
                          const newIndex = dayExpenses.findIndex(e => e.id === over.id)

                          const newExpenses = arrayMove(dayExpenses, oldIndex, newIndex)
                          
                          // DB 업데이트
                          newExpenses.forEach(async (exp, index) => {
                            await supabase
                              .from('expenses')
                              .update({ display_order: index })
                              .eq('id', exp.id)
                          })
                          
                          fetchExpenses()
                        }}
                      >
                        <SortableContext items={dayExpenses.map(e => e.id)} strategy={verticalListSortingStrategy}>
                          {dayExpenses.map(expense => {
                            const category = expenseCategories.find(c => c.id === expense.category_id)
                            return (
                              <SortableExpenseCard
                                key={expense.id}
                                expense={expense}
                                category={category}
                                onEdit={() => handleExpenseEdit(expense)}
                                onDelete={() => handleExpenseDelete(expense.id)}
                                onClick={() => setSelectedExpense(expense)}
                              />
                            )
                          })}
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                )
              })}
          </>
        )}

        {/* 카테고리별 비용 */}
        {expenseViewMode === 'category' && (
          <>
            {expenseCategories
              .filter(cat => {
                if (selectedExpenseCategory === '전체') return true
                return cat.id === selectedExpenseCategory
              })
              .map(cat => {
                const categoryExpenses = filteredExpenses.filter(e => e.category_id === cat.id)
                if (categoryExpenses.length === 0) return null
                const categoryTotal = getCategoryTotal(cat.id)

                return (
                  <div key={cat.id} className="mb-24">
                    <h3>
                      {cat.name} - {categoryTotal.toLocaleString()}원
                    </h3>
                    {!showExpenseSimple && (
                      <DndContext
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => {
                          const { active, over } = event
                          if (!over || active.id === over.id) return

                          const oldIndex = categoryExpenses.findIndex(e => e.id === active.id)
                          const newIndex = categoryExpenses.findIndex(e => e.id === over.id)

                          const newExpenses = arrayMove(categoryExpenses, oldIndex, newIndex)
                          
                          // DB 업데이트
                          newExpenses.forEach(async (exp, index) => {
                            await supabase
                              .from('expenses')
                              .update({ display_order: index })
                              .eq('id', exp.id)
                          })
                          
                          fetchExpenses()
                        }}
                      >
                        <SortableContext items={categoryExpenses.map(e => e.id)} strategy={verticalListSortingStrategy}>
                          {categoryExpenses.map(expense => {
                            const category = expenseCategories.find(c => c.id === expense.category_id)
                            return (
                              <SortableExpenseCard
                                key={expense.id}
                                expense={expense}
                                category={category}
                                onEdit={() => handleExpenseEdit(expense)}
                                onDelete={() => handleExpenseDelete(expense.id)}
                                onClick={() => setSelectedExpense(expense)}
                              />
                            )
                          })}
        </SortableContext>
      </DndContext>
                    )}
                  </div>
                )
              })}
          </>
        )}

        {filteredExpenses.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', padding: 24 }}>
            비용을 추가해주세요.
          </p>
        )}
      </>
    )
  }

  // 현재 탭 결정 (라우팅 기반)
  const getCurrentTab = () => {
    if (location.pathname.includes('/expense')) return 'expense'
    if (location.pathname.includes('/packing')) return 'packing'
    if (location.pathname.includes('/settings')) return 'settings'
    return 'schedule'
  }

  const currentTab = getCurrentTab()

  return (
    <div>
      <Sidebar tripId={id} />
      <div style={{ flex: 1, padding: 24 }}>
        <div className="header">
          <div>
            <button className="button-secondary" onClick={() => navigate('/')} style={{ marginRight: 12 }}>
              ← 뒤로
            </button>
            <h2 style={{ display: 'inline' }}>{trip?.title || '여행 일정'}</h2>
          </div>
        </div>

        {/* 탭 내용 */}
        {currentTab === 'schedule' && renderScheduleSection()}
        {currentTab === 'expense' && renderExpenseSection()}
        {currentTab === 'packing' && <PackingList tripId={id} />}

      {/* 일정 추가/수정 모달 */}
      {open && (
        <ScheduleModal
          tripId={id}
          schedule={editingSchedule}
          categories={scheduleCategories}
          onClose={() => {
            setOpen(false)
            setEditingSchedule(null)
            fetchSchedules()
            fetchCategories()
          }}
        />
      )}

      {/* 비용 추가/수정 모달 */}
      {expenseOpen && (
        <ExpenseModal
          tripId={id}
          tripDays={tripDays}
          expense={editingExpense}
          categories={expenseCategories}
          exchangeRates={exchangeRates}
          onClose={() => {
            setExpenseOpen(false)
            setEditingExpense(null)
            fetchExpenses()
          }}
        />
      )}

      {/* 일정 상세 모달 */}
      {selectedSchedule && (
        <Modal
          open={!!selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          title={selectedSchedule.title}
        >
          <div>
            <p><strong>날짜:</strong> {formatDate(selectedSchedule.date)}</p>
            {selectedSchedule.category && (
              <p><strong>카테고리:</strong> {selectedSchedule.category}</p>
            )}
            {selectedSchedule.memo && (
              <div>
                <strong>메모:</strong>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{selectedSchedule.memo}</p>
              </div>
            )}
            {selectedSchedule.memo2 && (
              <div>
                <strong>메모2:</strong>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{selectedSchedule.memo2}</p>
              </div>
            )}
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button onClick={() => { setSelectedSchedule(null); handleEdit(selectedSchedule) }}>
                수정
              </button>
              <button className="button-danger" onClick={() => { setSelectedSchedule(null); handleDelete(selectedSchedule.id) }}>
                삭제
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 하이라이트 수정 모달 */}
      {editingHighlight && (
        <Modal
          open={!!editingHighlight}
          onClose={() => {
            setEditingHighlight(null)
            setHighlightValue('')
          }}
          title="하이라이트 수정"
        >
          <div>
            <input
              className="input"
              placeholder="하이라이트 (예: 다카야마)"
              value={highlightValue}
              onChange={e => setHighlightValue(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => {
                  const day = tripDays.find(d => d.id === editingHighlight)
                  if (day) {
                    updateHighlight(day.id, highlightValue || null)
                  }
                }}
                style={{ flex: 1 }}
              >
                저장
              </button>
              <button
                onClick={() => {
                  setEditingHighlight(null)
                  setHighlightValue('')
                }}
                className="button-secondary"
                style={{ flex: 1 }}
              >
                취소
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 비용 상세 모달 */}
      {selectedExpense && (
        <Modal
          open={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
          title={selectedExpense.title}
        >
          <div>
            <p><strong>금액:</strong> {parseFloat(selectedExpense.total_amount_krw || 0).toLocaleString()}원</p>
            {selectedExpense.category_id && (
              <p><strong>카테고리:</strong> {expenseCategories.find(c => c.id === selectedExpense.category_id)?.name}</p>
            )}
            {selectedExpense.memo && (
              <div>
                <strong>비고:</strong>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{selectedExpense.memo}</p>
              </div>
            )}
            {selectedExpense.memo2 && (
              <div>
                <strong>비고2:</strong>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{selectedExpense.memo2}</p>
              </div>
            )}
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button onClick={() => { setSelectedExpense(null); handleExpenseEdit(selectedExpense) }}>
                수정
              </button>
              <button className="button-danger" onClick={() => { setSelectedExpense(null); handleExpenseDelete(selectedExpense.id) }}>
                삭제
              </button>
            </div>
          </div>
        </Modal>
      )}
      </div>
    </div>
  )
}
