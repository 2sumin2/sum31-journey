import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Sidebar from '../components/Sidebar'
import Modal from '../ui/Modal'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import SortableCategoryCard from '../components/SortableCategoryCard'

export default function Settings() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [editingCategory, setEditingCategory] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [bgColor, setBgColor] = useState('#000000')
  const [textColor, setTextColor] = useState('#ffffff')

  // 카테고리 가져오기 (expense_categories 사용)
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('display_order', { ascending: true, nullsFirst: true })
      .order('name', { ascending: true })
  
    if (error) {
      console.error('categories fetch error', error)
      setCategories([])
      return
    }
  
    setCategories(data || [])
  }

  useEffect(() => {
    if (id) {
      fetchCategories()
    }
  }, [id])

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex(c => c.id === active.id)
    const newIndex = categories.findIndex(c => c.id === over.id)

    const newCategories = arrayMove(categories, oldIndex, newIndex)
    setCategories(newCategories)

    // DB 업데이트
    newCategories.forEach(async (cat, index) => {
      await supabase
        .from('expense_categories')
        .update({ display_order: index })
        .eq('id', cat.id)
    })
  }

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      alert('카테고리 이름을 입력해주세요.')
      return
    }

    const categoryData = {
      name: categoryName.trim(),
      bg_color: bgColor,
      text_color: textColor
    }

    if (editingCategory) {
      // 수정
      const { error } = await supabase
        .from('expense_categories')
        .update(categoryData)
        .eq('id', editingCategory.id)
      
      if (error) {
        console.error('update category error', error)
        alert('카테고리 수정에 실패했습니다.')
        return
      }
    } else {
      // 생성
      const { error } = await supabase
        .from('expense_categories')
        .insert(categoryData)
      
      if (error) {
        console.error('create category error', error)
        alert('카테고리 생성에 실패했습니다.')
        return
      }
    }

    setCategoryName('')
    setBgColor('#000000')
    setTextColor('#ffffff')
    setEditingCategory(null)
    setShowCategoryModal(false)
    fetchCategories()
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setBgColor(category.bg_color || '#000000')
    setTextColor(category.text_color || '#ffffff')
    setShowCategoryModal(true)
  }

  const handleDelete = async (categoryId) => {
    if (!confirm('카테고리를 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('delete category error', error)
      alert('카테고리 삭제에 실패했습니다.')
      return
    }

    fetchCategories()
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar tripId={id} />
      <div style={{ flex: 1, padding: 24 }}>
        <div className="header">
          <div>
            <button className="button-secondary" onClick={() => navigate('/')} style={{ marginRight: 12 }}>
              ← 뒤로
            </button>
            <h2 style={{ display: 'inline' }}>앱 설정</h2>
          </div>
          <button onClick={() => {
            setEditingCategory(null)
            setCategoryName('')
            setBgColor('#000000')
            setTextColor('#ffffff')
            setShowCategoryModal(true)
          }}>
            + 카테고리
          </button>
        </div>

      <div style={{ marginTop: 24 }}>
        <h3>카테고리 관리</h3>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
          일정과 비용에서 공통으로 사용되는 카테고리입니다.
        </p>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {categories.map(category => (
              <SortableCategoryCard
                key={category.id}
                category={category}
                onEdit={() => handleEdit(category)}
                onDelete={() => handleDelete(category.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {categories.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', padding: 24 }}>
            카테고리를 추가해주세요.
          </p>
        )}
      </div>

      {/* 카테고리 추가/수정 모달 */}
      {showCategoryModal && (
        <Modal
          open={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false)
            setEditingCategory(null)
            setCategoryName('')
            setBgColor('#000000')
            setTextColor('#ffffff')
          }}
          title={editingCategory ? '카테고리 수정' : '카테고리 추가'}
        >
          <div>
            <input
              className="input"
              placeholder="카테고리 이름 *"
              value={categoryName}
              onChange={e => setCategoryName(e.target.value)}
            />

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>배경색</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  style={{ width: 60, height: 40, border: '2px solid #000', borderRadius: 8 }}
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="input"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>글자색</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={textColor}
                  onChange={e => setTextColor(e.target.value)}
                  style={{ width: 60, height: 40, border: '2px solid #000', borderRadius: 8 }}
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={e => setTextColor(e.target.value)}
                  className="input"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div style={{ 
              padding: 12, 
              background: bgColor, 
              color: textColor, 
              borderRadius: 8, 
              textAlign: 'center',
              marginBottom: 16
            }}>
              미리보기: {categoryName || '카테고리 이름'}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSaveCategory} style={{ flex: 1 }}>
                {editingCategory ? '수정' : '저장'}
              </button>
              <button
                onClick={() => {
                  setShowCategoryModal(false)
                  setEditingCategory(null)
                  setCategoryName('')
                  setBgColor('#000000')
                  setTextColor('#ffffff')
                }}
                className="button-secondary"
                style={{ flex: 1 }}
              >
                취소
              </button>
            </div>
          </div>
        </Modal>
      )}
      </div>
    </div>
  )
}

