import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import SortablePackingItem from './SortablePackingItem'
import Modal from '../../ui/Modal'

export default function PackingList({ tripId }) {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [memo, setMemo] = useState('')
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)

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

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)

    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems)

    // DB 업데이트
    newItems.forEach(async (item, index) => {
      await supabase
        .from('packing_items')
        .update({ display_order: index })
        .eq('id', item.id)
    })
  }

  useEffect(() => {
    if (tripId) {
      fetchItems()
    }
  }, [tripId])

  const addItem = async () => {
    if (!name.trim()) return

    if (editingItemId) {
      // 수정
      const { error } = await supabase
        .from('packing_items')
        .update({
          name: name.trim(),
          memo: memo.trim() || null
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
    setEditingItemId(null)
    setItemModalOpen(false)
    fetchItems()
  }

  // 준비물 수정 시작
  const startEditItem = (item) => {
    setEditingItemId(item.id)
    setName(item.name)
    setMemo(item.memo || '')
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
            setItemModalOpen(true)
          }}
        >
          + 준비물
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
            <div className="modal-form-row">
              <button onClick={addItem}>
                {editingItemId ? '수정' : '저장'}
              </button>
              <button 
                onClick={() => {
                  setItemModalOpen(false)
                  setName('')
                  setMemo('')
                  setEditingItemId(null)
                }}
              >
                취소
              </button>
            </div>
          </div>
        </Modal>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <SortablePackingItem
              key={item.id}
              item={item}
              onToggle={toggleDone}
              onDelete={deleteItem}
              onEdit={startEditItem}
            />
          ))}
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <p className="empty-state">
          준비물을 추가해주세요.
        </p>
      )}
    </div>
  )
}

