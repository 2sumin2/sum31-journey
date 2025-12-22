import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { useTripData } from '../hooks/useTripData'
import { useSchedule } from '../hooks/useSchedule'
import { useExpense } from '../hooks/useExpense'
import ScheduleModal from '../components/schedule/ScheduleModal'
import ExpenseModal from '../components/expense/ExpenseModal'
import PackingList from '../components/packing/PackingList'
import WordSection from '../components/words/WordSection'
import Sidebar from '../components/Sidebar'
import Modal from '../ui/Modal'
import ScheduleSection from '../components/trip/ScheduleSection'
import ExpenseSection from '../components/trip/ExpenseSection'

export default function Trip() {
  const { userId } = useUser()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // 커스텀 훅으로 데이터 관리
  const {
    trip,
    tripDays,
    schedules,
    expenses,
    categories,
    exchangeRates,
    words,
    packingCategories,
    formatDate,
    fetchTrip,
    fetchSchedules,
    fetchExpenses,
    fetchCategories,
    fetchPackingCategories
  } = useTripData(id, userId)

  // 일정 관리 훅
  const {
    open,
    setOpen,
    editingSchedule,
    setEditingSchedule,
    selectedDate,
    setSelectedDate,
    showAllMemos,
    setShowAllMemos,
    selectedSchedule,
    setSelectedSchedule,
    editingHighlight,
    setEditingHighlight,
    highlightValue,
    setHighlightValue,
    handleDelete,
    handleEdit,
    updateHighlight,
    startEditHighlight,
    getGoogleMapLink
  } = useSchedule(fetchTrip, fetchSchedules)

  // 경비 관리 훅
  const {
    expenseOpen,
    setExpenseOpen,
    editingExpense,
    setEditingExpense,
    expenseViewMode,
    setExpenseViewMode,
    selectedExpenseCategory,
    setSelectedExpenseCategory,
    showExpenseSimple,
    setShowExpenseSimple,
    showExpenseCategory,
    setShowExpenseCategory,
    selectedExpense,
    setSelectedExpense,
    handleExpenseDelete,
    handleExpenseEdit,
    calculateExpenseStats,
    getDayTotal,
    getCategoryTotal,
    getFilteredExpenses
  } = useExpense(expenses, fetchExpenses)

  // 단어장 상태
  const [wordsOpen, setWordsOpen] = useState(false)
  const [editingWords, setEditingWords] = useState(null)
  const [wordCategoriesOpen, setWordCategoriesOpen] = useState(false)
  const [editingWordCategories, setEditingWordCategories] = useState(null)

  // 현재 탭 결정 (라우팅 기반)
  const getCurrentTab = () => {
    if (location.pathname.includes('/expense')) return 'expense'
    if (location.pathname.includes('/packing')) return 'packing'
    if (location.pathname.includes('/words')) return 'words'
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
            <img
              onClick={() => navigate('/')} 
              src='/images/home.png' 
              alt="home"
            />
            <h2 style={{ display: 'inline' }}>{trip?.title || '여행 일정'}</h2>
          </div>
        </div>

        {/* 탭 내용 */}
        {currentTab === 'schedule' && (
          <ScheduleSection
            tripDays={tripDays}
            schedules={schedules}
            categories={categories}
            formatDate={formatDate}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            showAllMemos={showAllMemos}
            setShowAllMemos={setShowAllMemos}
            setEditingSchedule={setEditingSchedule}
            setOpen={setOpen}
            setSelectedSchedule={setSelectedSchedule}
            handleDelete={handleDelete}
            handleEdit={handleEdit}
            startEditHighlight={startEditHighlight}
          />
        )}
        
        {currentTab === 'expense' && (
          <ExpenseSection
            tripDays={tripDays}
            expenses={expenses}
            categories={categories}
            formatDate={formatDate}
            expenseViewMode={expenseViewMode}
            setExpenseViewMode={setExpenseViewMode}
            selectedExpenseCategory={selectedExpenseCategory}
            setSelectedExpenseCategory={setSelectedExpenseCategory}
            showExpenseSimple={showExpenseSimple}
            setShowExpenseSimple={setShowExpenseSimple}
            showExpenseCategory={showExpenseCategory}
            setShowExpenseCategory={setShowExpenseCategory}
            setEditingExpense={setEditingExpense}
            setExpenseOpen={setExpenseOpen}
            setSelectedExpense={setSelectedExpense}
            handleExpenseEdit={handleExpenseEdit}
            handleExpenseDelete={handleExpenseDelete}
            calculateExpenseStats={calculateExpenseStats}
            getDayTotal={getDayTotal}
            getCategoryTotal={getCategoryTotal}
            getFilteredExpenses={getFilteredExpenses}
            fetchExpenses={fetchExpenses}
          />
        )}
        
        {currentTab === 'packing' && <PackingList tripId={id} packingCategories={packingCategories} fetchPackingCategories={fetchPackingCategories} />}
        
        {currentTab === 'words' && (
          <div>
            <div className="header">
              <h2 style={{ display: 'inline' }}>단어장</h2>
              <button className="add-button" onClick={() => { setEditingWords(null); setWordsOpen(true) }}>
                + 단어장
              </button>
              <button className="add-button second" onClick={() => setWordCategoriesOpen(true)}>
                카테고리
              </button>
            </div>
            <WordSection 
              tripId={id} 
              categories={categories} 
              wordsOpen={wordsOpen}
              editingWords={editingWords}
              wordCategoriesOpen={wordCategoriesOpen}
              editingWordCategories={editingWordCategories}
              onClose={() => {
                setWordsOpen(false)
                setEditingWords(null)
              }}
              onEditWord={() => setWordsOpen(true)}
              onCategoryModalClose={() => setWordCategoriesOpen(false)}
              words={words}
            />
          </div>
        )}

        {/* 일정 추가/수정 모달 */}
        {open && (
          <ScheduleModal
            tripId={id}
            schedule={editingSchedule}
            categories={categories}
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
            categories={categories}
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
              {selectedSchedule.place_address && (
                <div>
                  <strong>장소:</strong>
                  <a
                    href={getGoogleMapLink(selectedSchedule.place_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', marginTop: 4, color: 'black', textDecoration: 'underline' }}
                  >
                    {selectedSchedule.place_name}
                  </a>
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
                placeholder="하이라이트"
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
                <p><strong>카테고리:</strong> {categories.find(c => c.id === selectedExpense.category_id)?.name}</p>
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
