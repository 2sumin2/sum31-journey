export default function Button({ children, onClick }) {
    return (
      <button
        onClick={onClick}
        style={{
          width: '100%',
          padding: 14,
          borderRadius: 999,
          background: 'linear-gradient(90deg,#7c7cff,#9f9fff)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {children}
      </button>
    )
  }
  