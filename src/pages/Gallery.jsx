import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useUser } from '../contexts/UserContext'
import { useTripData } from '../hooks/useTripData'
import GalleryCard from '../components/gallery/GalleryCard'
import GalleryModal from '../components/gallery/GalleryModal'
import GalleryDetailModal from '../components/gallery/GalleryDetailModal'
import Sidebar from '../components/Sidebar'

export default function GalleryPage() {
  const { id: tripId } = useParams()
  const { userId } = useUser()
  const navigate = useNavigate()
  const [galleryItems, setGalleryItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGallery, setEditingGallery] = useState(null)
  const [selectedGallery, setSelectedGallery] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Trip 데이터 가져오기
  const { trip } = useTripData(tripId, userId)

  // 갤러리 데이터 가져오기
  const fetchGallery = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('fetch gallery error:', error)
        setGalleryItems([])
        setFilteredItems([])
        return
      }

      setGalleryItems(data || [])
      setFilteredItems(data || [])
    } catch (error) {
      console.error('Gallery fetch error:', error)
      alert('갤러리를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (tripId) {
      fetchGallery()
    }
  }, [tripId])

  // 검색 처리
  const handleSearch = () => {
    if (!searchText.trim()) {
      setFilteredItems(galleryItems)
      return
    }

    const filtered = galleryItems.filter(item =>
      item.memo?.toLowerCase().includes(searchText.toLowerCase())
    )
    setFilteredItems(filtered)
  }

  // 검색 입력 변경 시 실시간 검색
  useEffect(() => {
    handleSearch()
  }, [searchText, galleryItems])

  // 갤러리 삭제
  const handleDelete = async (galleryId) => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return

    try {
      // 삭제할 항목 찾기
      const itemToDelete = galleryItems.find(item => item.id === galleryId)
      if (itemToDelete?.image_url) {
        // 이미지 삭제
        const urlParts = itemToDelete.image_url.split('/gallery/')
        if (urlParts.length > 1) {
          await supabase.storage
            .from('gallery')
            .remove([urlParts[1]])
        }
      }

      // 데이터베이스에서 삭제
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', galleryId)

      if (error) throw error

      fetchGallery()
    } catch (error) {
      alert('삭제 실패: ' + error.message)
    }
  }

  // 수정 시작
  const handleEdit = (gallery) => {
    setEditingGallery(gallery)
    setIsModalOpen(true)
  }

  // 모달 닫기
  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingGallery(null)
    fetchGallery()
  }

  // 추가 버튼 클릭
  const handleAddClick = () => {
    setEditingGallery(null)
    setIsModalOpen(true)
  }

  return (
    <>
      <Sidebar tripId={tripId} />
      <div style={{ flex: 1, padding: '24px' }}>
        {/* 상단 헤더 */}
        <div className="header">
          <div>
            <img
              onClick={() => navigate('/')}
              src="/images/home.png"
              alt="home"
              style={{ cursor: 'pointer', marginRight: '8px' }}
            />
            <h2 style={{ display: 'inline' }}>{trip?.title || '여행'}</h2>
          </div>
        </div>

        {/* 갤러리 헤더 */}
        <div className="header">
          <h2 style={{ display: 'inline' }}>갤러리</h2>
          <button
            className="add-button"
            onClick={() => {
              setEditingGallery(null)
              setIsModalOpen(true)
            }}
          >
            + 사진
          </button>
        </div>

        {/* 검색 폼 */}
        <div className="search-form">
          <input
            className="input"
            type="text"
            placeholder="메모 검색..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>검색</button>
        </div>

        {/* 갤러리 그리드 */}
        {isLoading ? (
          <div className="gallery-loading">로딩 중...</div>
        ) : filteredItems.length === 0 ? (
          <div className="gallery-empty">
            <p>갤러리가 비어있습니다.</p>
            <p>사진을 추가해주세요.</p>
          </div>
        ) : (
          <div className="gallery-grid">
            {filteredItems.map((item) => (
              <GalleryCard
                key={item.id}
                gallery={item}
                onClick={() => setSelectedGallery(item)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* 갤러리 추가/수정 모달 */}
        {isModalOpen && (
          <GalleryModal
            tripId={tripId}
            userId={userId}
            gallery={editingGallery}
            onClose={handleModalClose}
          />
        )}

        {/* 갤러리 상세 모달 */}
        {selectedGallery && (
          <GalleryDetailModal
            gallery={selectedGallery}
            onClose={() => setSelectedGallery(null)}
          />
        )}
      </div>
    </>
  )
}
