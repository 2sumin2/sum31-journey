import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import SortablePackingItem from '../components/SortablePackingItem'

export default function PackingList({ tripId }) {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [memo, setMemo] = useState('')

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

    setName('')
    setMemo('')
    fetchItems()
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
      <h3>준비물 리스트</h3>
      
      <div className="card" style={{ marginBottom: 16 }}>
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
        <button onClick={addItem}>추가</button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <SortablePackingItem
              key={item.id}
              item={item}
              onToggle={toggleDone}
              onDelete={deleteItem}
            />
          ))}
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', padding: 24 }}>
          준비물을 추가해주세요.
        </p>
      )}
    </div>
  )
}

