import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import Modal from '../../ui/Modal'
import PlaceSearch from './PlaceSearch'

export default function ScheduleModal({ tripId, schedule = null, categories = [], onClose }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [useTimeRange, setUseTimeRange] = useState(false)
  const [timeEnd, setTimeEnd] = useState('')
  const [memo, setMemo] = useState('')
  const [memo2, setMemo2] = useState('')
  const [category, setCategory] = useState('')
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null)

  useEffect(() => {
    if (schedule) {
      setTitle(schedule.title || '')
      setDate(schedule.date || '')
      if (schedule.time) {
        if (schedule.time.includes('~')) {
          const [start, end] = schedule.time.split('~').map(t => t.trim())
          setTime(start)
          setTimeEnd(end)
          setUseTimeRange(true)
        } else {
          setTime(schedule.time)
          setUseTimeRange(false)
        }
      }
      setMemo(schedule.memo || '')
      setMemo2(schedule.memo2 || '')
      setCategory(schedule.category || '')
    }
  }, [schedule])

  const save = async () => {
    if (!title || !date) {
      alert('제목과 날짜를 입력해주세요.')
      return
    }

    let timeValue = ''
    if (time) {
      if (useTimeRange && timeEnd) {
        timeValue = `${time} ~ ${timeEnd}`
      } else {
        timeValue = time
      }
    }

    const scheduleData = {
      trip_id: tripId,
      title,
      date,
      time: timeValue || null,
      memo: memo || null,
      memo2: memo2 || null,
      category: category || null,
      order_no: schedule?.order_no || Date.now(),
      place_id: selectedPlace?.id || null,
      place_name: selectedPlace?.name || null,
      place_address: selectedPlace?.address || null
    }

    if (schedule) {
      // 수정
      const { error } = await supabase
        .from('schedules')
        .update(scheduleData)
        .eq('id', schedule.id)
      
      if (error) {
        console.error('update error', error)
        alert('일정 수정에 실패했습니다.')
        return
      }
    } else {
      // 생성
      const { error } = await supabase
        .from('schedules')
        .insert(scheduleData)
      
      if (error) {
        console.error('insert error', error)
        alert('일정 추가에 실패했습니다.')
        return
      }
    }

    onClose()
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={schedule ? '일정 수정' : '일정 추가'}
    >
      <div>
        {!showPlaceSearch && (<>
          <input
            className="input"
            placeholder="제목 *"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <input
            className="input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          
          <div className='modal-item-box'>
            <label>
              <input
                type="checkbox"
                checked={useTimeRange}
                onChange={e => setUseTimeRange(e.target.checked)}
              />
              <span>시간 범위 사용</span>
            </label>
            {useTimeRange ? (
              <div className='flex-box'>
                <input
                  className="input"
                  type="time"
                  placeholder="시작 시간"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  style={{ flex: 1 }}
                />
                <span style={{ alignSelf: 'center' }}>~</span>
                <input
                  className="input"
                  type="time"
                  placeholder="종료 시간"
                  value={timeEnd}
                  onChange={e => setTimeEnd(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            ) : (
              <input
                className="input"
                type="time"
                placeholder="시간 (선택)"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <select
              className="input"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">카테고리 선택</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <textarea
            className="input"
            placeholder="메모"
            value={memo}
            onChange={e => setMemo(e.target.value)}
            rows={4}
          />
          
          <textarea
            className="input"
            placeholder="메모2 (상세에만 표시)"
            value={memo2}
            onChange={e => setMemo2(e.target.value)}
            rows={4}
          />

          <div style={{ marginBottom: 12 }}>
            <button 
              onClick={() => setShowPlaceSearch(true)}
              style={{ padding: '8px 12px', marginBottom: 8 }}
            >
              {selectedPlace ? '장소 수정' : '장소 등록'}
            </button>

            {selectedPlace && (
              <p>
                등록된 장소: {selectedPlace.address}
              </p>
            )}
          </div>
        </>)}

        {showPlaceSearch && (<>
          <div style={{ marginBottom: 12 }}>
            <button 
              onClick={() => setShowPlaceSearch(false)}
              style={{ padding: '8px 12px', marginBottom: 8 }}
            >등록 완료</button>
          </div>
          <PlaceSearch
            tripId={tripId}
            defaultPlace={selectedPlace}
            onSuccess={(place) => {
              console.log(place)
              setSelectedPlace(place)
              setShowPlaceSearch(false)
            }}
          /></>
        )}
        
        <div className='flex-box'>
          <button className="main" onClick={save} style={{ flex: 1 }}>
            {schedule ? '수정' : '저장'}
          </button>
          <button className="sub" onClick={onClose} style={{ flex: 1 }}>
            취소
          </button>
        </div>
      </div>
    </Modal>
  )
}
