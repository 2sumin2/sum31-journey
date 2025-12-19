import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import SortableWordItem from './SortableWordItem'
import Modal from '../../ui/Modal'

export default function WordSection({ tripId, categories, wordsOpen, editingWords, wordCategoriesOpen, editingWordCategories, onClose, onEditWord, onCategoryModalClose, words: propWords }) {
  const [words, setWords] = useState([])
  const [filteredWords, setFilteredWords] = useState([])
  const [wordCategories, setWordCategories] = useState([])
  const [language, setLanguage] = useState('')
  const [korean, setKorean] = useState('')
  const [memo, setMemo] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [searchField, setSearchField] = useState('language')
  const [searchText, setSearchText] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingWordId, setEditingWordId] = useState(null)

  // 단어 카테고리 가져오기
  const fetchWordCategories = async () => {
    const { data, error } = await supabase
      .from('word_categories')
      .select('*')
      .eq('trip_id', tripId)
      .order('display_order', { ascending: true, nullsFirst: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('fetch word categories error', error)
      setWordCategories([])
      return
    }

    setWordCategories(data ?? [])
  }

  // 단어 가져오기
  const fetchWords = async () => {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('trip_id', tripId)
      .order('display_order', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('fetch words error', error)
      setWords([])
      setFilteredWords([])
      return
    }

    setWords(data ?? [])
    setFilteredWords(data ?? [])
  }

  useEffect(() => {
    if (tripId) {
      fetchWords()
      fetchWordCategories()
    }
  }, [tripId])

  // DnD 정렬 처리
  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = words.findIndex(w => w.id === active.id)
    const newIndex = words.findIndex(w => w.id === over.id)
    const newWords = arrayMove(words, oldIndex, newIndex)
    setWords(newWords)
    setFilteredWords(newWords)

    newWords.forEach(async (w, index) => {
      await supabase.from('words').update({ display_order: index }).eq('id', w.id)
    })
  }

  // 단어 추가/수정
  const saveWord = async () => {
    if (!language.trim() || !korean.trim()) return alert('외국어와 한국어는 필수입니다.')

    if (editingWordId) {
      // 수정
      const { error } = await supabase.from('words').update({
        language: language.trim(),
        korean: korean.trim(),
        memo: memo.trim() || null,
        category_id: categoryId || null
      }).eq('id', editingWordId)

      if (error) {
        console.error('update word error', error)
        return alert('단어 수정 실패')
      }
    } else {
      // 추가
      const { error } = await supabase.from('words').insert({
        trip_id: tripId,
        language: language.trim(),
        korean: korean.trim(),
        memo: memo.trim() || null,
        category_id: categoryId || null
      })

      if (error) {
        console.error('add word error', error)
        return alert('단어 추가 실패')
      }
    }

    // 입력 초기화
    setLanguage('')
    setKorean('')
    setMemo('')
    setCategoryId('')
    setEditingWordId(null)

    // 단어 저장 후 모달 닫기
    onClose()

    fetchWords()
  }

  // 단어 수정 시작
  const startEditWord = (word) => {
    setEditingWordId(word.id)
    setLanguage(word.language)
    setKorean(word.korean)
    setMemo(word.memo || '')
    setCategoryId(word.category_id || '')
  }

  // 단어 삭제
  const deleteWord = async (wordId) => {
    if (!confirm('단어를 삭제하시겠습니까?')) return

    const { error } = await supabase.from('words').delete().eq('id', wordId)
    if (error) {
      console.error('delete word error', error)
      return
    }
    fetchWords()
  }

  // 검색
  const handleSearch = () => {
    if (!searchText.trim() && searchField !== 'category_id') {
      setFilteredWords(words)
      return
    }

    const filtered = words.filter(word => {
      if (searchField === 'category_id') {
        if (!searchText) return true
        return word.category_id === searchText
      }
      const fieldValue = word[searchField] || ''
      return fieldValue.toLowerCase().includes(searchText.toLowerCase())
    })

    setFilteredWords(filtered)
  }

  // 카테고리 추가/수정
  const saveCategory = async () => {
    if (!categoryName.trim()) return alert('카테고리 이름을 입력해주세요.')

    if (editingCategory) {
      // 수정
      const { error } = await supabase
        .from('word_categories')
        .update({ name: categoryName.trim() })
        .eq('id', editingCategory.id)
      
      if (error) {
        console.error('update category error', error)
        return alert('카테고리 수정 실패')
      }
    } else {
      // 추가
      const { error } = await supabase
        .from('word_categories')
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
    fetchWordCategories()
  }

  // 카테고리 삭제
  const deleteCategory = async (categoryId) => {
    if (!confirm('카테고리를 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('word_categories')
      .delete()
      .eq('id', categoryId)
    
    if (error) {
      console.error('delete category error', error)
      return alert('카테고리 삭제 실패')
    }

    fetchWordCategories()
  }

  // 카테고리 수정 시작
  const startEditCategory = (category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
  }

  return (
    <>
      {/* 단어 추가/수정 모달 */}
      {wordsOpen && (
        <Modal
          open={true}
          onClose={() => {
            onClose()
            setLanguage('')
            setKorean('')
            setMemo('')
            setCategoryId('')
            setEditingWordId(null)
          }}
          title={editingWordId ? '단어장 수정' : '단어장 추가'}
        >
          <div>
            <input
              className="input"
              placeholder="외국어"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            />
            <input
              className="input"
              placeholder="한국어"
              value={korean}
              onChange={e => setKorean(e.target.value)}
            />
            <input
              className="input"
              placeholder="메모"
              value={memo}
              onChange={e => setMemo(e.target.value)}
            />
            <select 
              className="input" 
              value={categoryId} 
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">카테고리 선택 (선택사항)</option>
              {wordCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={saveWord} style={{ flex: 1 }}>
                {editingWordId ? '수정' : '저장'}
              </button>
              <button 
                onClick={() => {
                  onClose()
                  setLanguage('')
                  setKorean('')
                  setMemo('')
                  setCategoryId('')
                  setEditingWordId(null)
                }} 
                style={{ flex: 1, background: '#666' }}
              >
                취소
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 카테고리 관리 모달 */}
      {wordCategoriesOpen && (
        <Modal
          open={true}
          onClose={() => {
            onCategoryModalClose()
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
                  {wordCategories.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#999', margin: 0, marginBottom: 12 }}>
                      등록된 카테고리가 없습니다.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      {wordCategories.map(cat => (
                        <div
                          key={cat.id}
                          style={{
                            padding: '8px 12px',
                            background: '#f0f0f0',
                            borderRadius: 8,
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            fontSize: 12
                          }}
                        >
                          <span>{cat.name}</span>
                          <button
                            onClick={() => startEditCategory(cat)}
                            style={{ padding: '0px 4px', fontSize: 11, height: 'auto', background: 'transparent', color: '#666', border: 'none', cursor: 'pointer' }}
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => deleteCategory(cat.id)}
                            style={{ padding: '0px 4px', fontSize: 11, height: 'auto', background: 'transparent', color: '#d32f2f', border: 'none', cursor: 'pointer' }}
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
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={saveCategory} style={{ flex: 1 }}>
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategory(null)
                      setCategoryName('')
                    }}
                    style={{ flex: 1, background: '#666' }}
                  >
                    취소
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* 검색 폼 */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={searchField} onChange={e => setSearchField(e.target.value)} style={{width:'max-content'}}>
          <option value="korean">한국어</option>
          <option value="language">외국어</option>
          <option value="memo">메모</option>
          <option value="category_id">카테고리</option>
        </select>
        {searchField === 'category_id' ? (
          <select 
            className="input"
            value={searchText} 
            onChange={e => setSearchText(e.target.value)}
          >
            <option value="">전체</option>
            {wordCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <input
            className='input'
            type="text"
            placeholder="검색..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
          />
        )}
        <button style={{textWrapMode: 'nowrap', height: '43px'}} onClick={handleSearch}>검색</button>
      </div>

      {/* 단어 리스트 */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredWords.map(w => w.id)} strategy={verticalListSortingStrategy}>
          {filteredWords.map(word => (
            <SortableWordItem
              key={word.id}
              word={word}
              categories={wordCategories}
              onDelete={() => deleteWord(word.id)}
              onEdit={(word) => {
                startEditWord(word)
                onEditWord && onEditWord()
              }}
              wordsOpen={wordsOpen}
              editingWords={editingWords}
            />
          ))}
        </SortableContext>
      </DndContext>

      {filteredWords.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', padding: 24 }}>
          단어를 추가해주세요.
        </p>
      )}
    </>
  )
}
