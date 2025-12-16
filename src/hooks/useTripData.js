import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useTripData(tripId, userId) {
  const [trip, setTrip] = useState(null)
  const [tripDays, setTripDays] = useState([])
  const [schedules, setSchedules] = useState([])
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [exchangeRates, setExchangeRates] = useState({})
  const [words, setWords] = useState([])

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdays[date.getDay()]
    return `${month}/${day} (${weekday})`
  }

  // trip_days 확인 및 생성
  const ensureTripDays = async (tripData) => {
    const { data: existingDays } = await supabase
      .from('trip_days')
      .select('*')
      .eq('trip_id', tripId)
      .order('day_order', { ascending: true })

    if (existingDays && existingDays.length > 0) {
      // 기타 날짜가 없으면 추가 (사전 결제용)
      const otherDay = existingDays.find(d => d.date === '1900-01-01')
      if (!otherDay) {
        const { data } = await supabase
          .from('trip_days')
          .insert({
            trip_id: tripId,
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
      trip_id: tripId,
      date: '1900-01-01',
      day_order: 0,
      highlight: '기타 (사전 결제)'
    }]
    let currentDate = new Date(startDate)
    let dayOrder = 1

    while (currentDate <= endDate) {
      days.push({
        trip_id: tripId,
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

  // 여행 정보 가져오기
  const fetchTrip = async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()
    
    if (error) {
      console.error('trip fetch error', error)
      return
    }
    
    setTrip(data)
    
    if (data) {
      await ensureTripDays(data)
    }
  }

  // 일정 가져오기
  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('trip_id', tripId)
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
      const timeA = a.time || ''
      const timeB = b.time || ''
      if (timeA && timeB) {
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

  // 카테고리 가져오기
  const fetchCategories = async () => {
    if (!userId) return
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
  
    if (error) {
      console.error('expense categories fetch error', error)
      setCategories([])
      return
    }
  
    if (!data || data.length === 0) {
      // 기본 카테고리 생성
      const defaultCategories = ['숙소', '관광', '액티비티', '식비', '교통', '쇼핑', '기타']
      const categoriesToInsert = defaultCategories.map(name => ({ name, user_id: userId }))
      const { data: inserted, error: insertError } = await supabase
        .from('categories')
        .insert(categoriesToInsert)
        .select()
      
      if (insertError) {
        console.error('create default categories error', insertError)
        setCategories([])
        return
      }
      
      setCategories(inserted || [])
      return
    }
  
    setCategories(data)
  }

  // 비용 가져오기
  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: true })
      .order('display_order', { ascending: true })
  
    if (error) {
      console.error('expenses fetch error', error)
      setExpenses([])
      return
    }
  
    setExpenses(data ?? [])
  }

  // 환율 가져오기
  const fetchExchangeRates = async () => {
    if (!userId) return

    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('user_id', userId)
  
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
      // 기본 환율 설정
      ratesMap.USD = { currency: 'USD', rate_to_krw: 1300 }
      ratesMap.JPY = { currency: 'JPY', rate_to_krw: 9 }
      ratesMap.EUR = { currency: 'EUR', rate_to_krw: 1400 }
      ratesMap.CNY = { currency: 'CNY', rate_to_krw: 180 }
    }
    
    setExchangeRates(ratesMap)
  }

  // 단어장 가져오기
  const fetchWords = async () => {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('trip_id', tripId)
      .order('display_order', { ascending: true })
  
    if (error) {
      console.error('words fetch error', error)
      setWords([])
      return
    }
  
    setWords(data ?? [])
  }

  useEffect(() => {
    if (tripId) {
      fetchTrip()
      fetchSchedules()
      fetchExpenses()
      fetchWords()
    }
  }, [tripId])

  useEffect(() => {
    if (tripId && userId) {
      fetchCategories()
      fetchExchangeRates()
    }
  }, [tripId, userId])

  return {
    trip,
    tripDays,
    schedules,
    expenses,
    categories,
    exchangeRates,
    words,
    formatDate,
    fetchTrip,
    fetchSchedules,
    fetchExpenses,
    fetchCategories,
    fetchWords
  }
}
