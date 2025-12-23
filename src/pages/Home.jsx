import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import TripCard from '../components/TripCard'
import { useUser } from '../contexts/UserContext';

export default function Home() {
  const { userId } = useUser()
  const [trips, setTrips] = useState([])
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const nav = useNavigate()

  const fetchTrips = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setTrips(data)
  };

  useEffect(() => {
    if (!userId) return;

    fetchTrips();
  }, [userId]);

  const createTrip = async () => {
    if (!userId) {
      alert('오류가 발생했습니다. 잠시후 다시 시도해주세요.')
      return
    };

    if (!title || !start || !end) return
    await supabase.from('trips').insert({
      user_id: userId,
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
