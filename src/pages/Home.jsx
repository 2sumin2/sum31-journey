import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import TripCard from '../components/TripCard'

export default function Home() {
  const [trips, setTrips] = useState([])
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const nav = useNavigate()

  const fetchTrips = async () => {
    const { data } = await supabase.from('trips').select('*').order('created_at', { ascending: false })
    setTrips(data)
  }

  useEffect(() => {
    fetchTrips()
  }, [])

  const createTrip = async () => {
    if (!title || !start || !end) return
    await supabase.from('trips').insert({
      title,
      start_date: start,
      end_date: end
    })
    setTitle('')
    setStart('')
    setEnd('')
    fetchTrips()
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>내 여행</h1>

      <div className="card">
        <input className="input" placeholder="여행 이름" value={title} onChange={e => setTitle(e.target.value)} />
        <input className="input" type="date" value={start} onChange={e => setStart(e.target.value)} />
        <input className="input" type="date" value={end} onChange={e => setEnd(e.target.value)} />
        <button onClick={createTrip}>여행 생성</button>
      </div>

      {trips?.map(t => (
        <TripCard key={t.id} trip={t} onClick={() => nav(`/trip/${t.id}`)} />
      ))}
    </div>
  )
}
