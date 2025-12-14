import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import SortableWordItem from './SortableWordItem'
import Modal from '../../ui/Modal'

export default function WordSection({ tripId, categories, wordsOpen, editingWords, wordCategoriesOpen, editingWordCategories, onClose, words: propWords }) {
  const [words, setWords] = useState([])
  const [filteredWords, setFilteredWords] = useState([])
  const [language, setLanguage] = useState('')
  const [korean, setKorean] = useState('')
  const [memo, setMemo] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [searchField, setSearchField] = useState('language')
  const [searchText, setSearchText] = useState('')

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
    if (tripId) fetchWords()
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

  // 단어 추가
  const addWord = async () => {
    if (!language.trim() || !korean.trim()) return alert('외국어와 한국어는 필수입니다.')

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

    // 입력 초기화
    setLanguage('')
    setKorean('')
    setMemo('')
    setCategoryId('')

    // 단어 저장 후 모달 닫기
    onClose()

    fetchWords()
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

  // 단어 수정
  const updateWord = async (wordId, updatedData) => {
    const { error } = await supabase.from('words').update(updatedData).eq('id', wordId)
    if (error) {
      console.error('update word error', error)
      return alert('단어 수정 실패')
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

  return (
    <>
      {/* 단어 추가/수정 모달 */}
      {wordsOpen && (
        <Modal
          open={true}
          onClose={onClose}
          title={editingWords ? '단어장 수정' : '단어장 추가'}
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
            {/* <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">카테고리 선택</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select> */}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={addWord} style={{ flex: 1 }}>
                저장
              </button>
              <button onClick={onClose} style={{ flex: 1, background: '#666' }}>
                취소
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 검색 폼 */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={searchField} onChange={e => setSearchField(e.target.value)} style={{width:'max-content'}}>
          <option value="language">외국어</option>
          <option value="korean">한국어</option>
          <option value="memo">메모</option>
          {/* <option value="category_id">카테고리</option> */}
        </select>
        {searchField === 'category_id' ? (
          <select value={searchText} onChange={e => setSearchText(e.target.value)}>
            <option value="">전체</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
              categories={categories}
              onDelete={() => deleteWord(word.id)}
              onUpdate={(updatedData) => updateWord(word.id, updatedData)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </>
  )
}
