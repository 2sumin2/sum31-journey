import { useState } from 'react'
import { supabase } from '../supabase'

export function useExpense(expenses, fetchExpenses) {
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [expenseViewMode, setExpenseViewMode] = useState('day')
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState('전체')
  const [showExpenseSimple, setShowExpenseSimple] = useState(false)
  const [showExpenseCategory, setShowExpenseCategory] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)

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
  const getFilteredExpenses = (tripDays) => {
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

  return {
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
  }
}
