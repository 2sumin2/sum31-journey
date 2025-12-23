import { useState } from 'react'

export default function GalleryCard({ gallery, onEdit, onDelete, onClick, showMenu: initialShowMenu = false }) {
  const [showMenu, setShowMenu] = useState(initialShowMenu)

  const getImageUrl = (path) => {
    // Supabase 스토리지 URL 형식
    if (path && path.startsWith('http')) {
      return path
    }
    return path || ''
  }

  return (
    <div className="gallery-item">
      <div
        className="gallery-image-container"
        onClick={(e) => {
          e.stopPropagation()
          onClick && onClick(gallery)
        }}
      >
        {gallery.image_url ? (
          <img
            src={getImageUrl(gallery.image_url)}
            alt={gallery.memo || '갤러리'}
            className="gallery-image"
          />
        ) : (
          <div className="gallery-image-placeholder">
            <span>📷</span>
          </div>
        )}
      </div>

      <div className="gallery-info">
        {gallery.memo && (
          <p className="gallery-memo">{gallery.memo}</p>
        )}
      </div>

      <div
        className="gallery-menu-button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          setShowMenu(!showMenu)
        }}
      >
        ⋮
      </div>

      {showMenu && (
        <div
          className="gallery-dropdown-menu"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="gallery-dropdown-item"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              onEdit && onEdit(gallery)
              setShowMenu(false)
            }}
          >
            수정
          </button>
          <button
            className="gallery-dropdown-item danger"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              onDelete && onDelete(gallery.id)
              setShowMenu(false)
            }}
          >
            삭제
          </button>
        </div>
      )}

      {showMenu && (
        <div className="gallery-dropdown-overlay" onClick={() => setShowMenu(false)} />
      )}
    </div>
  )
}
