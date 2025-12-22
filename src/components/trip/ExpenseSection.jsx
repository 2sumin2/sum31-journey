import { supabase } from '../../supabase'
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import SortableExpenseCard from '../expense/SortableExpenseCard'

export default function ExpenseSection({
  tripDays,
  expenses,
  categories,
  formatDate,
  expenseViewMode,
  setExpenseViewMode,
  selectedExpenseCategory,
  setSelectedExpenseCategory,
  showExpenseSimple,
  setShowExpenseSimple,
  showExpenseCategory,
  setShowExpenseCategory,
  setEditingExpense,
  setExpenseOpen,
  setSelectedExpense,
  handleExpenseEdit,
  handleExpenseDelete,
  calculateExpenseStats,
  getDayTotal,
  getCategoryTotal,
  getFilteredExpenses,
  fetchExpenses
}) {
  const stats = calculateExpenseStats()
  const filteredExpenses = getFilteredExpenses(tripDays)
  const sensors = useSensors(
    // PC
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 살짝 움직여야 드래그
      },
    }),
    // 모바일
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 꾹 누르기
        tolerance: 5,
      },
    })
  )

  return (
    <>
      <div className="header">
        <h2 style={{ display: 'inline' }}>비용 관리</h2>
        <button className="add-button" onClick={() => { setEditingExpense(null); setExpenseOpen(true) }}>
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
              {categories.map(cat => (
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
        </div>   
        <div className="flex-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showExpenseSimple}
              onChange={(e) => setShowExpenseSimple(e.target.checked)}
            />
            <span>간단히 보기</span>
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showExpenseCategory}
              onChange={(e) => setShowExpenseCategory(e.target.checked)}
            />
            <span>카테고리만 보기</span>
          </label>   
        </div>
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
                  {!showExpenseCategory && (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={() => {
                        // 모바일 진동
                        if (navigator.vibrate) {
                          navigator.vibrate(20)
                        }
                      }}
                      onDragEnd={(event) => {
                        const { active, over } = event
                        if (!over || active.id === over.id) return

                        // 현재 expenses 배열에서 올바른 인덱스 찾기
                        const allExpenses = expenses.filter(e => e.trip_day_id === day.id)
                        const oldIndex = allExpenses.findIndex(e => e.id === active.id)
                        const newIndex = allExpenses.findIndex(e => e.id === over.id)

                        const newExpenses = arrayMove(allExpenses, oldIndex, newIndex)
                        
                        // 각 항목의 display_order 업데이트
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
                          const category = categories.find(c => c.id === expense.category_id)
                          return (
                            <SortableExpenseCard
                              key={expense.id}
                              expense={expense}
                              category={category}
                              onEdit={() => handleExpenseEdit(expense)}
                              onDelete={() => handleExpenseDelete(expense.id)}
                              onClick={() => setSelectedExpense(expense)}
                              showExpenseSimple={showExpenseSimple}
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
          {categories
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
                  {!showExpenseCategory && (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={() => {
                        // 모바일 진동
                        if (navigator.vibrate) {
                          navigator.vibrate(20)
                        }
                      }}
                      onDragEnd={(event) => {
                        const { active, over } = event
                        if (!over || active.id === over.id) return

                        // 현재 카테고리의 expenses 배열에서 올바른 인덱스 찾기
                        const allCategoryExpenses = expenses.filter(e => e.category_id === cat.id)
                        const oldIndex = allCategoryExpenses.findIndex(e => e.id === active.id)
                        const newIndex = allCategoryExpenses.findIndex(e => e.id === over.id)

                        const newExpenses = arrayMove(allCategoryExpenses, oldIndex, newIndex)
                        
                        // 각 항목의 display_order 업데이트
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
                          const category = categories.find(c => c.id === expense.category_id)
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
