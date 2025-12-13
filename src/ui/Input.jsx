export default function Input(props) {
    return (
      <input
        {...props}
        className="input"
        style={{
          width: '100%',
          padding: 14,
          borderRadius: 14,
          border: 'none',
          background: '#f1f3ff',
          marginBottom: 12,
          fontSize: 15,
        }}
      />
    )
  }
  