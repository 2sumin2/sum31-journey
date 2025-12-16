import ScheduleCard from '../schedule/ScheduleCard'

export default function ScheduleSection({
  tripDays,
  schedules,
  categories,
  formatDate,
  selectedDate,
  setSelectedDate,
  showAllMemos,
  setShowAllMemos,
  setEditingSchedule,
  setOpen,
  setSelectedSchedule,
  handleDelete,
  handleEdit,
  startEditHighlight
}) {
  return (
    <>
      <div className="header">
        <h2 style={{ display: 'inline' }}>여행 일정</h2>
        <button className="add-button" onClick={() => { setEditingSchedule(null); setOpen(true) }}>
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
          const allDates = new Set()
          tripDays.forEach(d => {
            if (d.date !== '1900-01-01') allDates.add(d.date)
          })
          schedules.forEach(s => allDates.add(s.date))
          
          const sortedDates = Array.from(allDates).sort()
          
          return sortedDates.map(date => {
            const day = tripDays.find(d => d.date === date)
            const daySchedules = schedules.filter(s => s.date === date)
            
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
                    categories={categories}
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
                      categories={categories}
                    />
                  ))}
                </div>
              )
            })}
        </div>
      )}
    </>
  )
}
