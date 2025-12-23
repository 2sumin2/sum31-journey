import Modal from '../../ui/Modal'

export default function WordModal({ word, onClose }) {
  if (!word) return null

  return (
    <Modal open={true} onClose={onClose} title="단어 상세">
      <div className="word-detail-content">
        <div className="word-detail-section">
          <h3 className="word-detail-label">외국어</h3>
          <p className="word-detail-value">{word.language}</p>
        </div>

        <div className="word-detail-section">
          <h3 className="word-detail-label">한국어</h3>
          <p className="word-detail-value">{word.korean}</p>
        </div>

        {word.memo && (
          <div className="word-detail-section">
            <h3 className="word-detail-label">메모</h3>
            <p className="word-detail-value word-memo">{word.memo}</p>
          </div>
        )}

        <div className="flex-box">
          <button className="sub" onClick={onClose} style={{ flex: 1 }}>
            닫기
          </button>
        </div>
      </div>
    </Modal>
  )
}
