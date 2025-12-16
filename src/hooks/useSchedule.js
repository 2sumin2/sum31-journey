import { useState } from 'react'
import { supabase } from '../supabase'

export function useSchedule(fetchTrip, fetchSchedules) {
  const [open, setOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [selectedDate, setSelectedDate] = useState('전체')
  const [showAllMemos, setShowAllMemos] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [editingHighlight, setEditingHighlight] = useState(null)
  const [highlightValue, setHighlightValue] = useState('')

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

  const getGoogleMapLink = (place) => {
    if (!place) return '#'
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`
  }

  return {
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
  }
}
