export default function Card({ children, glow }) {
    return (
      <div
        className="slide-up"
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: 20,
          boxShadow: glow
            ? '0 20px 40px rgba(124,124,255,0.25)'
            : '0 10px 30px rgba(0,0,0,0.08)',
          marginBottom: 16,
        }}
      >
        {children}
      </div>
    )
  }
  