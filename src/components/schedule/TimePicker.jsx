import { useState, useEffect } from 'react'

export default function TimePicker({ value, onChange, placeholder = '시간 선택' }) {
  const [hour, setHour] = useState('00')
  const [minute, setMinute] = useState('00')
  const [isOpen, setIsOpen] = useState(false)
  const [minuteStep, setMinuteStep] = useState(1) // 1분 또는 15분

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      setHour(h || '00')
      setMinute(m || '00')
    }
  }, [value])

  const handleChange = (newHour, newMinute) => {
    const formattedHour = String(newHour).padStart(2, '0')
    const formattedMinute = String(newMinute).padStart(2, '0')
    const timeString = `${formattedHour}:${formattedMinute}`
    onChange(timeString)
  }

  const handleHourChange = (e) => {
    const newHour = e.target.value
    setHour(newHour)
    handleChange(newHour, minute)
  }

  const handleMinuteChange = (e) => {
    const newMinute = e.target.value
    setMinute(newMinute)
    handleChange(hour, newMinute)
  }

  const increaseHour = () => {
    const newHour = (parseInt(hour) + 1) % 24
    const newHourStr = String(newHour).padStart(2, '0')
    setHour(newHourStr)
    handleChange(newHourStr, minute)
  }

  const decreaseHour = () => {
    const newHour = (parseInt(hour) - 1 + 24) % 24
    const newHourStr = String(newHour).padStart(2, '0')
    setHour(newHourStr)
    handleChange(newHourStr, minute)
  }

  const increaseMinute = () => {
    const newMinute = (parseInt(minute) + minuteStep) % 60
    const newMinuteStr = String(newMinute).padStart(2, '0')
    setMinute(newMinuteStr)
    handleChange(hour, newMinuteStr)
  }

  const decreaseMinute = () => {
    const newMinute = (parseInt(minute) - minuteStep + 60) % 60
    const newMinuteStr = String(newMinute).padStart(2, '0')
    setMinute(newMinuteStr)
    handleChange(hour, newMinuteStr)
  }

  const toggleMinuteStep = () => {
    setMinuteStep(minuteStep === 1 ? 15 : 1)
  }

  return (
    <div className="time-picker-container">
      <button
        type="button"
        className="input time-picker-input-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {hour}:{minute}
      </button>

      {isOpen && (
        <div className="time-picker-dropdown">
          <div style={{ display: 'flex', gap: '1px', justifyContent: 'center', marginBottom: '12px' }}>
            {/* 시간 선택 */}
            <div style={{ textAlign: 'center' }}>
              <button
                className="time-picker-pick-button"
                type="button"
                onClick={increaseHour}
              >
                ▲
              </button>
              <select
                className="time-picker-select"
                value={hour}
                onChange={handleHourChange}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, '0')}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <button
                className="time-picker-pick-button"
                type="button"
                onClick={decreaseHour}
              >
                ▼
              </button>
            </div>

            {/* 구분선 */}
            <div style={{ fontSize: '24px', fontWeight: 'bold', alignSelf: 'center' }}>:</div>

            {/* 분 선택 */}
            <div style={{ textAlign: 'center' }}>
              <button
                className="time-picker-pick-button"
                type="button"
                onClick={increaseMinute}
              >
                ▲
              </button>
              <select
                className="time-picker-select"
                value={minute}
                onChange={handleMinuteChange}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, '0')}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <button
                className="time-picker-pick-button"
                type="button"
                onClick={decreaseMinute}
              >
                ▼
              </button>
            </div>
          </div>

          {/* 분 단위 토글 및 완료 버튼 */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              className="time-picker-button"
              type="button"
              onClick={toggleMinuteStep}
            >
              {minuteStep === 1 ? '1분' : '15분'}
            </button>
            <button
              className="time-picker-button save"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              완료
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
