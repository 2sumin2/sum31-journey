export default function TripCard({ trip, onClick }) {
    return (
      <div className="card" onClick={onClick}>
        <h3>{trip.title}</h3>
        <p>{trip.start_date} ~ {trip.end_date}</p>
      </div>
    )
  }
  