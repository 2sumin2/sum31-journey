import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import Sidebar from '../components/Sidebar'
import Modal from '../ui/Modal'
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import SortableCategoryCard from '../components/setting/SortableCategoryCard'
import { useUser } from '../contexts/UserContext';

export default function Settings() {
  const { userId } = useUser()
  const { id } = useParams()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [editingCategory, setEditingCategory] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [bgColor, setBgColor] = useState('#000000')
  const [textColor, setTextColor] = useState('#ffffff')

  const CURRENCIES = [
    { code: 'USD', label: 'USD (달러)' },
    { code: 'JPY', label: 'JPY (엔)' },
    { code: 'EUR', label: 'EUR (유로)' },
    { code: 'CNY', label: 'CNY (위안)' },
  ]
  const [rateInputs, setRateInputs] = useState({ USD: '', JPY: '', EUR: '', CNY: '' })

  const sensors = useSensors(
    // PC
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 살짝 움직여야 드래그
      },
    }),
    // 모바일
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 꾹 누르기
        tolerance: 5,
      },
    })
  )

  // 카테고리 가져오기 (categories 사용)
  useEffect(() => {
    if (!userId) return;
  
    const fetchCategories = async () => {
      if (!userId) return;
  
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true, nullsFirst: true })
        .order('name', { ascending: true })
    
      if (error) {
        console.error('categories fetch error', error)
        setCategories([])
        return
      }
    
      setCategories(data || [])
    }
  
    if (id) {
      fetchCategories()
    }
  }, [userId, id]);

  // 환율 가져오기
  const fetchExchangeRates = async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('user_id', userId)
    if (error) { console.error('exchange rates fetch error', error); return }
    if (data && data.length > 0) {
      const inputs = { USD: '', JPY: '', EUR: '', CNY: '' }
      data.forEach(r => {
        if (Object.prototype.hasOwnProperty.call(inputs, r.currency)) {
          inputs[r.currency] = r.rate_to_krw.toString()
        }
      })
      setRateInputs(inputs)
    }
  }

  useEffect(() => {
    if (userId) fetchExchangeRates()
  }, [userId])

  const saveExchangeRates = async () => {
    if (!userId) return
    const currencies = CURRENCIES.filter(c => rateInputs[c.code] !== '' && !isNaN(parseFloat(rateInputs[c.code])))
    if (currencies.length === 0) { alert('저장할 환율이 없습니다.'); return }

    for (const { code } of currencies) {
      const rate = parseFloat(rateInputs[code])
      const { data } = await supabase
        .from('exchange_rates')
        .select('id')
        .eq('user_id', userId)
        .eq('currency', code)
        .maybeSingle()
      if (data) {
        await supabase.from('exchange_rates').update({ rate_to_krw: rate }).eq('id', data.id)
      } else {
        await supabase.from('exchange_rates').insert({ user_id: userId, currency: code, rate_to_krw: rate })
      }
    }
    alert('환율이 저장되었습니다.')
  }

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex(c => c.id === active.id)
    const newIndex = categories.findIndex(c => c.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newCategories = arrayMove(categories, oldIndex, newIndex)
    setCategories(newCategories)

    // 모든 업데이트를 병렬로 실행하고 완료 대기
    const updatePromises = newCategories.map((cat, index) =>
      supabase
        .from('categories')
        .update({ display_order: index })
        .eq('id', cat.id)
    )
    
    // 모든 업데이트가 완료된 후에만 완료
    await Promise.all(updatePromises)
  }

  const handleSaveCategory = async () => {
    if (!userId) {
      alert('오류가 발생했습니다. 잠시후 다시 시도해주세요.')
      return
    };

    if (!categoryName.trim()) {
      alert('카테고리 이름을 입력해주세요.')
      return
    }

    const categoryData = {
      user_id: userId,
      name: categoryName.trim(),
      bg_color: bgColor,
      text_color: textColor
    }

    if (editingCategory) {
      // 수정
      const { error } = await supabase
        .from('categories')
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
        .from('categories')
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
      .from('categories')
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
            <img
              onClick={() => navigate('/')} 
              src='/images/home.png' />
            <h2 style={{ display: 'inline' }}>앱 설정</h2>
          </div>
          <button 
           className="add-button"
           onClick={() => {
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

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => {
            // 모바일 진동
            if (navigator.vibrate) {
              navigator.vibrate(20)
            }
          }}
          onDragEnd={handleDragEnd}>
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

      {/* 환율 설정 */}
      <div style={{ marginTop: 32 }}>
        <h3>환율 설정</h3>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
          비용 추가 시 자동으로 적용되는 환율입니다. (1 외화 = ? 원)
        </p>
        {CURRENCIES.map(({ code, label }) => (
          <div key={code} className="card card-content mb-12" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 500, minWidth: 110 }}>{label}</span>
            <input
              className="input"
              type="number"
              placeholder="원화 환율"
              value={rateInputs[code]}
              onChange={e => setRateInputs(prev => ({ ...prev, [code]: e.target.value }))}
              style={{ flex: 1, marginBottom: 0 }}
            />
            <span style={{ fontSize: 14, color: '#666', whiteSpace: 'nowrap' }}>원</span>
          </div>
        ))}
        <button className="main" onClick={saveExchangeRates} style={{ width: '100%', marginTop: 8 }}>
          환율 저장
        </button>
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

            <div className='flex-box'>
              <button className="main" onClick={handleSaveCategory} style={{ flex: 1 }}>
                {editingCategory ? '수정' : '저장'}
              </button>
              <button className="sub" style={{ flex: 1 }}
                onClick={() => {
                  setShowCategoryModal(false)
                  setEditingCategory(null)
                  setCategoryName('')
                  setBgColor('#000000')
                  setTextColor('#ffffff')
                }}>
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

