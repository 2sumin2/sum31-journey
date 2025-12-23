import Modal from '../../ui/Modal'

export default function GalleryDetailModal({ gallery, onClose }) {
  if (!gallery) return null

  const getImageUrl = (path) => {
    if (path && path.startsWith('http')) {
      return path
    }
    return path || ''
  }

  return (
    <Modal open={true} onClose={onClose} title="갤러리 상세">
      <div className="gallery-detail-content">
        {gallery.image_url && (
          <div className="gallery-detail-image-container">
            <img
              src={getImageUrl(gallery.image_url)}
              alt="갤러리"
              className="gallery-detail-image"
            />
          </div>
        )}

        {gallery.memo && (
          <div className="gallery-detail-section">
            <p className="gallery-detail-memo">{gallery.memo}</p>
          </div>
        )}

        {gallery.created_at && (
          <div className="gallery-detail-date">
            {new Date(gallery.created_at).toLocaleDateString('ko-KR')}
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
