import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import SortablePackingItem from './SortablePackingItem'
import Modal from '../../ui/Modal'

export default function PackingList({ tripId, packingCategories = [], fetchPackingCategories }) {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [memo, setMemo] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false)

  const sensors = useSensors(
    // PC
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    // 모바일
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('packing_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('display_order', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: false })
  
    if (error) {
      console.error('packing items fetch error', error)
      setItems([])
      return
    }
  
    setItems(data ?? [])
  }

  // 필터링된 아이템
  const getFilteredItems = () => {
    let filtered = items

    // 카테고리 필터
    if (selectedCategory !== '전체') {
      filtered = filtered.filter(item => item.category_id === selectedCategory)
    }

    // 미완료 필터
    if (showIncompleteOnly) {
      filtered = filtered.filter(item => !item.is_done)
    }

    return filtered
  }

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const filteredItems = getFilteredItems()
    const oldIndex = filteredItems.findIndex(i => i.id === active.id)
    const newIndex = filteredItems.findIndex(i => i.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newItems = arrayMove(filteredItems, oldIndex, newIndex)
    
    // 모든 업데이트를 병렬로 실행하고 완료 대기
    const updatePromises = newItems.map((item, index) =>
      supabase
        .from('packing_items')
        .update({ display_order: index })
        .eq('id', item.id)
    )
    
    // 모든 업데이트가 완료된 후에만 데이터 새로고침
    await Promise.all(updatePromises)
    fetchItems()
  }

  useEffect(() => {
    if (tripId) {
      fetchItems()
    }
  }, [tripId])

  // 준비물 추가/수정
  const addItem = async () => {
    if (!name.trim()) return

    if (editingItemId) {
      // 수정
      const { error } = await supabase
        .from('packing_items')
        .update({
          name: name.trim(),
          memo: memo.trim() || null,
          category_id: categoryId || null
        })
        .eq('id', editingItemId)

      if (error) {
        console.error('update item error', error)
        alert('준비물 수정에 실패했습니다.')
        return
      }
    } else {
      // 추가
      const { error } = await supabase
        .from('packing_items')
        .insert({
          trip_id: tripId,
          name: name.trim(),
          memo: memo.trim() || null,
          category_id: categoryId || null,
          is_done: false
        })

      if (error) {
        console.error('add item error', error)
        alert('준비물 추가에 실패했습니다.')
        return
      }
    }

    setName('')
    setMemo('')
    setCategoryId('')
    setEditingItemId(null)
    setItemModalOpen(false)
    fetchItems()
  }

  // 준비물 수정 시작
  const startEditItem = (item) => {
    setEditingItemId(item.id)
    setName(item.name)
    setMemo(item.memo || '')
    setCategoryId(item.category_id || '')
    setItemModalOpen(true)
  }

  const toggleDone = async (itemId, currentStatus) => {
    const { error } = await supabase
      .from('packing_items')
      .update({ is_done: !currentStatus })
      .eq('id', itemId)

    if (error) {
      console.error('toggle done error', error)
      return
    }

    fetchItems()
  }

  const deleteItem = async (itemId) => {
    if (!confirm('준비물을 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('packing_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('delete item error', error)
      return
    }

    fetchItems()
  }

  // 카테고리 추가/수정
  const saveCategory = async () => {
    if (!categoryName.trim()) return alert('카테고리 이름을 입력해주세요.')

    if (editingCategory && editingCategory.id) {
      // 수정
      const { error } = await supabase
        .from('packing_categories')
        .update({ name: categoryName.trim() })
        .eq('id', editingCategory.id)
      
      if (error) {
        console.error('update category error', error)
        return alert('카테고리 수정 실패')
      }
    } else {
      // 추가
      const { error } = await supabase
        .from('packing_categories')
        .insert({
          trip_id: tripId,
          name: categoryName.trim()
        })
      
      if (error) {
        console.error('add category error', error)
        return alert('카테고리 추가 실패')
      }
    }

    setCategoryName('')
    setEditingCategory(null)
    fetchPackingCategories()
  }

  // 카테고리 삭제
  const deleteCategory = async (categoryId) => {
    if (!confirm('카테고리를 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('packing_categories')
      .delete()
      .eq('id', categoryId)
    
    if (error) {
      console.error('delete category error', error)
      return alert('카테고리 삭제 실패')
    }

    fetchPackingCategories()
  }

  // 카테고리 수정 시작
  const startEditCategory = (category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
  }

  const filteredItems = getFilteredItems()

  return (
    <div>
      <div className="header">
        <h2 style={{ display: 'inline' }}>준비물</h2>
        <button
          className="add-button"
          onClick={() => {
            setEditingItemId(null)
            setName('')
            setMemo('')
            setCategoryId('')
            setItemModalOpen(true)
          }}
        >
          + 준비물
        </button>
        <button
          className="add-button second"
          onClick={() => setCategoryModalOpen(true)}
        >
          카테고리
        </button>
      </div>

      {/* 준비물 추가/수정 모달 */}
      {itemModalOpen && (
        <Modal
          open={true}
          onClose={() => {
            setItemModalOpen(false)
            setName('')
            setMemo('')
            setCategoryId('')
            setEditingItemId(null)
          }}
          title={editingItemId ? '준비물 수정' : '준비물 추가'}
        >
          <div>
            <input
              className="input"
              placeholder="준비물 이름"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addItem()}
            />
            <input
              className="input"
              placeholder="메모 (선택)"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addItem()}
            />
            <select 
              className="input" 
              value={categoryId} 
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">카테고리 선택 (선택사항)</option>
              {packingCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className='flex-box'>
              <button className="main" onClick={addItem} style={{ flex: 1 }}>
                {editingItemId ? '수정' : '저장'}
              </button>
              <button className="sub"
                onClick={() => {
                  setItemModalOpen(false)
                  setName('')
                  setMemo('')
                  setCategoryId('')
                  setEditingItemId(null)
                }}
                style={{ flex: 1 }}
              >
                취소
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 카테고리 관리 모달 */}
      {categoryModalOpen && (
        <Modal
          open={true}
          onClose={() => {
            setCategoryModalOpen(false)
            setCategoryName('')
            setEditingCategory(null)
          }}
          title={editingCategory ? '카테고리 수정' : '카테고리 관리'}
        >
          <div>
            {!editingCategory ? (
              <>
                {/* 카테고리 목록 */}
                <div style={{ marginBottom: 16 }}>
                  {packingCategories.length === 0 ? (
                    <p className="category-empty-msg">
                      등록된 카테고리가 없습니다.
                    </p>
                  ) : (
                    <div className="category-list">
                      {packingCategories.map(cat => (
                        <div key={cat.id} className="category-item">
                          <span>{cat.name}</span>
                          <button
                            className="category-edit-btn"
                            onClick={() => startEditCategory(cat)}
                          >
                            ✎
                          </button>
                          <button
                            className="category-delete-btn"
                            onClick={() => deleteCategory(cat.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditingCategory({})
                    setCategoryName('')
                  }}
                  style={{ width: '100%' }}
                >
                  + 새 카테고리
                </button>
              </>
            ) : (
              <>
                <input
                  className="input"
                  placeholder="카테고리 이름"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && saveCategory()}
                />
                <div className='flex-box'>
                  <button className="main" onClick={saveCategory} style={{ flex: 1 }}>
                    저장
                  </button>
                  <button className="sub" style={{ flex: 1 }}
                    onClick={() => {
                      setEditingCategory(null)
                      setCategoryName('')
                    }}
                  >
                    취소
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* 필터 옵션 */}
      <div className="filter-group">
        <div className="flex-row">
          <button
            className={`filter-button ${selectedCategory === '전체' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('전체')}
          >
            전체
          </button>
          {packingCategories.map(cat => (
            <button
              key={cat.id}
              className={`filter-button ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="flex-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showIncompleteOnly}
              onChange={(e) => setShowIncompleteOnly(e.target.checked)}
            />
            <span>미완료만 보기</span>
          </label>
        </div>
      </div>

      {/* 준비물 리스트 */}
      <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => {
            if (navigator.vibrate) {
              navigator.vibrate(20)
            }
          }}
          onDragEnd={handleDragEnd}>
        <SortableContext items={filteredItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {filteredItems.map(item => {
            const category = packingCategories.find(c => c.id === item.category_id)
            return (
              <SortablePackingItem
                key={item.id}
                item={item}
                category={category}
                onToggle={toggleDone}
                onDelete={deleteItem}
                onEdit={startEditItem}
              />
            )
          })}
        </SortableContext>
      </DndContext>

      {filteredItems.length === 0 && (
        <p className="empty-state">
          {showIncompleteOnly ? '완료된 준비물만 남았어요!' : '준비물을 추가해주세요.'}
        </p>
      )}
    </div>
  )
}

