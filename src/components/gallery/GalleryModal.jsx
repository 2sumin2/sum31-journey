import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import Modal from '../../ui/Modal'

export default function GalleryModal({ tripId, userId, gallery = null, onClose }) {
  const [memo, setMemo] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (gallery) {
      setMemo(gallery.memo || '')
      setImagePreview(gallery.image_url)
    }
  }, [gallery])

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file) => {
    const timestamp = Date.now()
    const fileName = `${tripId}/${timestamp}-${file.name}`

    const { data, error } = await supabase.storage
      .from('gallery')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Image upload error:', error)
      throw new Error('사진 업로드 실패')
    }

    // 공개 URL 생성
    const { data: publicData } = supabase.storage
      .from('gallery')
      .getPublicUrl(fileName)

    return publicData?.publicUrl
  }

  const deleteImage = async (imageUrl) => {
    if (!imageUrl) return

    try {
      // URL에서 파일 경로 추출
      const urlParts = imageUrl.split('/gallery/')
      if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage
          .from('gallery')
          .remove([filePath])
      }
    } catch (error) {
      console.error('Image delete error:', error)
    }
  }

  const handleSave = async () => {
    if (!memo.trim()) {
      alert('메모를 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      let imageUrl = gallery?.image_url

      // 새로운 이미지가 선택된 경우
      if (imageFile) {
        // 기존 이미지 삭제
        if (gallery?.image_url) {
          await deleteImage(gallery.image_url)
        }
        // 새 이미지 업로드
        imageUrl = await uploadImage(imageFile)
      }

      if (gallery?.id) {
        // 수정
        const { error } = await supabase
          .from('gallery')
          .update({
            memo: memo.trim(),
            image_url: imageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', gallery.id)

        if (error) throw error
      } else {
        // 추가
        const { error } = await supabase
          .from('gallery')
          .insert({
            trip_id: tripId,
            user_id: userId,
            memo: memo.trim(),
            image_url: imageUrl
          })

        if (error) throw error
      }

      onClose && onClose()
    } catch (error) {
      alert(error.message || '저장 실패')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={gallery?.id ? '갤러리 수정' : '갤러리 추가'}
    >
      <div className="gallery-modal-content">
        {/* 사진 미리보기 */}
        <div className="gallery-preview-container">
          {imagePreview ? (
            <img src={imagePreview} alt="미리보기" className="gallery-preview-image" />
          ) : (
            <div className="gallery-preview-placeholder">
              <span>📷</span>
              <p>사진을 선택해주세요</p>
            </div>
          )}
        </div>

        {/* 사진 선택 버튼 */}
        <div className="gallery-file-input-wrapper">
          <input
            type="file"
            id="gallery-file-input"
            accept="image/*"
            onChange={handleImageSelect}
            disabled={isLoading}
          />
          <label htmlFor="gallery-file-input" className="gallery-file-label">
            사진 선택
          </label>
        </div>

        {/* 메모 입력 */}
        <textarea
          className="input gallery-memo-input"
          placeholder="메모를 입력해주세요"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          disabled={isLoading}
          rows="4"
        />

        {/* 버튼 */}
        <div className="flex-box">
          <button
            className="main"
            onClick={handleSave}
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            {isLoading ? '저장중...' : '저장'}
          </button>
          <button
            className="sub"
            onClick={onClose}
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            취소
          </button>
        </div>
      </div>
    </Modal>
  )
}
