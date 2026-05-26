import { useState, useEffect, useRef } from 'react'
import {
  FaSearch,
  FaCalendarAlt,
  FaSortAmountDown,
  FaRedo,
  FaFilter,
  FaStream,
  FaTable,
  FaThLarge,
  FaDownload,
  FaTimes,
} from 'react-icons/fa'

const ARTICLE_TYPES = ['研究论文', '综述', 'Meta分析', '临床实验', 'Benchmark']
const SUBJECT_CATEGORIES = [
  '临床医学', '环境科学', '动物健康', '食品与公共卫生',
  '分子机制与遗传学', '生物信息学与监测', '植物与农业', '其他',
]
const JCR_OPTIONS = ['Q1', 'Q2', 'Q3', 'Q4', '未知']

const SORT_OPTIONS = [
  { value: '-publication_date', label: '日期 ↓' },
  { value: 'publication_date', label: '日期 ↑' },
  { value: '-jcr_quartile', label: 'JCR ↓' },
  { value: 'jcr_quartile', label: 'JCR ↑' },
  { value: '-xinrui_quartile', label: '新锐分区 ↓' },
  { value: 'xinrui_quartile', label: '新锐分区 ↑' },
  { value: '-if_', label: 'IF ↓' },
  { value: 'if_', label: 'IF ↑' },
  { value: '-article_type', label: '文献类型 ↓' },
  { value: 'article_type', label: '文献类型 ↑' },
  { value: 'title', label: '标题 A-Z' },
]

const QUICK_FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'high_if', label: '高IF(＞10)' },
  { id: 'cns', label: 'CNS期刊' },
  { id: 'recent30', label: '近30天' },
]

function ToggleChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 rounded text-[11px] font-medium border transition-colors"
      style={{
        background: active ? 'var(--accent)' : '#fff',
        color: active ? '#fff' : 'var(--muted)',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
      }}
    >
      {label}
    </button>
  )
}

export default function Toolbar({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  view,
  onViewChange,
  onExport,
}) {
  const [showFilters, setShowFilters] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const sortRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSortMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggleArrayFilter = (key, value) => {
    const current = filters[key] || []
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    onFiltersChange({ ...filters, [key]: next })
  }

  const clearAll = () => {
    onQueryChange('')
    onFiltersChange({
      article_type: [],
      jcr_quartile: '',
      subject_category: [],
      is_top: false,
      is_cns: false,
      if_min: '',
      date_from: '',
      date_to: '',
    })
  }

  const hasActive =
    query ||
    filters.article_type?.length > 0 ||
    filters.jcr_quartile ||
    filters.subject_category?.length > 0 ||
    filters.is_top ||
    filters.is_cns ||
    filters.if_min ||
    filters.date_from ||
    filters.date_to

  const getActiveQuickFilter = () => {
    if (
      !query &&
      !filters.jcr_quartile &&
      filters.article_type?.length === 0 &&
      filters.subject_category?.length === 0 &&
      !filters.is_top &&
      !filters.is_cns &&
      !filters.if_min &&
      !filters.date_from &&
      !filters.date_to
    ) {
      return 'all'
    }
    if (
      filters.if_min === 10 &&
      !filters.is_cns &&
      !filters.date_from &&
      !filters.jcr_quartile &&
      filters.article_type?.length === 0 &&
      filters.subject_category?.length === 0 &&
      !filters.is_top
    ) {
      return 'high_if'
    }
    if (
      filters.is_cns &&
      !filters.if_min &&
      !filters.date_from &&
      !filters.jcr_quartile &&
      filters.article_type?.length === 0 &&
      filters.subject_category?.length === 0 &&
      !filters.is_top
    ) {
      return 'cns'
    }
    if (filters.date_from) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const df = new Date(filters.date_from)
      if (
        Math.abs(df - thirtyDaysAgo) < 86400000 &&
        !filters.if_min &&
        !filters.is_cns &&
        !filters.jcr_quartile &&
        filters.article_type?.length === 0 &&
        filters.subject_category?.length === 0 &&
        !filters.is_top
      ) {
        return 'recent30'
      }
    }
    return null
  }

  const applyQuickFilter = (id) => {
    if (id === 'all') {
      clearAll()
    } else if (id === 'high_if') {
      onFiltersChange({
        ...filters,
        if_min: 10,
        is_cns: false,
        date_from: '',
        date_to: '',
      })
    } else if (id === 'cns') {
      onFiltersChange({
        ...filters,
        is_cns: true,
        if_min: '',
        date_from: '',
        date_to: '',
      })
    } else if (id === 'recent30') {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      const dateStr = d.toISOString().split('T')[0]
      onFiltersChange({
        ...filters,
        date_from: dateStr,
        date_to: '',
        if_min: '',
        is_cns: false,
      })
    }
  }

  const activeQuickFilter = getActiveQuickFilter()

  const inputBaseStyle = {
    borderColor: 'var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || '排序'

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3">
      <div
        className="rounded-xl p-4"
        style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}
      >
        {/* 1. Global search */}
        <div className="relative w-full mb-4">
          <FaSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
            style={{ color: '#9ca3af' }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="搜索标题、摘要、期刊……"
            className="w-full h-12 pl-12 pr-10 text-base rounded-lg border outline-none transition-colors"
            style={inputBaseStyle}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
          {query && (
            <button
              onClick={() => onQueryChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <FaTimes className="w-4 h-4" style={{ color: 'var(--muted)' }} />
            </button>
          )}
        </div>

        {/* 2. Quick filters + action buttons */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Quick filter tags */}
          <div
            className="flex items-center gap-2 overflow-x-auto w-full md:w-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => applyQuickFilter(f.id)}
                className="px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap"
                style={{
                  background: activeQuickFilter === f.id ? 'var(--accent)' : '#fff',
                  color: activeQuickFilter === f.id ? '#fff' : 'var(--muted)',
                  borderColor: activeQuickFilter === f.id ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div
            className="flex items-center gap-2 shrink-0 overflow-x-auto w-full md:w-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Sort dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="flex items-center gap-1.5 h-9 px-3 text-sm rounded-lg border outline-none cursor-pointer transition-colors whitespace-nowrap"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                }}
              >
                <FaSortAmountDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{currentSortLabel}</span>
              </button>
              {showSortMenu && (
                <div
                  className="absolute right-0 mt-1 w-36 rounded-lg border shadow-lg z-20 overflow-hidden"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => {
                        onSortChange(o.value)
                        setShowSortMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                      style={{
                        color: sortBy === o.value ? 'var(--accent)' : 'var(--text)',
                        background: sortBy === o.value ? 'var(--accent-l)' : undefined,
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div
              className="flex rounded-lg overflow-hidden border shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <button
                onClick={() => onViewChange('section')}
                title="分区视图"
                className="h-9 px-2.5 flex items-center justify-center text-sm transition-colors"
                style={{
                  background: view === 'section' ? 'var(--accent)' : 'var(--surface)',
                  color: view === 'section' ? '#fff' : 'var(--muted)',
                }}
              >
                <FaStream className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onViewChange('table')}
                title="表格视图"
                className="h-9 px-2.5 flex items-center justify-center text-sm transition-colors"
                style={{
                  background: view === 'table' ? 'var(--accent)' : 'var(--surface)',
                  color: view === 'table' ? '#fff' : 'var(--muted)',
                }}
              >
                <FaTable className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onViewChange('card')}
                title="卡片视图"
                className="h-9 px-2.5 flex items-center justify-center text-sm transition-colors"
                style={{
                  background: view === 'card' ? 'var(--accent)' : 'var(--surface)',
                  color: view === 'card' ? '#fff' : 'var(--muted)',
                }}
              >
                <FaThLarge className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Advanced filter */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-1.5 h-9 px-3 text-sm rounded-lg border outline-none cursor-pointer transition-colors whitespace-nowrap"
              style={{
                borderColor: 'var(--border)',
                background: showFilters ? 'var(--accent-l)' : 'var(--surface)',
                color: showFilters ? 'var(--accent)' : 'var(--text)',
              }}
            >
              <FaFilter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">高级筛选</span>
            </button>

            {/* Reset */}
            <button
              onClick={clearAll}
              disabled={!hasActive}
              className="flex items-center gap-1.5 h-9 px-3 text-sm rounded-lg border outline-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--surface)',
                color: 'var(--muted)',
              }}
            >
              <FaRedo className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">重置</span>
            </button>

            {/* Export */}
            <button
              onClick={onExport}
              disabled={!onExport}
              title="导出CSV"
              className="flex items-center gap-1.5 h-9 px-3 text-sm rounded-lg border outline-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--surface)',
                color: 'var(--muted)',
              }}
            >
              <FaDownload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">导出</span>
            </button>
          </div>
        </div>

        {/* 3. Advanced filter panel */}
        {showFilters && (
          <div
            className="mt-4 rounded-xl border p-3 sm:p-4 space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {/* JCR Quartile */}
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                JCR 分区
              </div>
              <div className="flex flex-wrap gap-2">
                {JCR_OPTIONS.map((q) => (
                  <ToggleChip
                    key={q}
                    label={q}
                    active={filters.jcr_quartile === q}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        jcr_quartile: filters.jcr_quartile === q ? '' : q,
                      })
                    }
                  />
                ))}
              </div>
            </div>

            {/* Article type */}
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                文献类型
              </div>
              <div className="flex flex-wrap gap-2">
                {ARTICLE_TYPES.map((t) => (
                  <ToggleChip
                    key={t}
                    label={t}
                    active={filters.article_type?.includes(t)}
                    onClick={() => toggleArrayFilter('article_type', t)}
                  />
                ))}
              </div>
            </div>

            {/* Subject category */}
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                学科分类
              </div>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_CATEGORIES.map((s) => (
                  <ToggleChip
                    key={s}
                    label={s}
                    active={filters.subject_category?.includes(s)}
                    onClick={() => toggleArrayFilter('subject_category', s)}
                  />
                ))}
              </div>
            </div>

            {/* Date range */}
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
                发表时间
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <FaCalendarAlt
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                    style={{ color: '#9ca3af' }}
                  />
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => onFiltersChange({ ...filters, date_from: e.target.value })}
                    className="h-9 pl-9 pr-2 text-sm rounded-lg border outline-none appearance-none"
                    style={inputBaseStyle}
                  />
                </div>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>—</span>
                <div className="relative">
                  <FaCalendarAlt
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                    style={{ color: '#9ca3af' }}
                  />
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => onFiltersChange({ ...filters, date_to: e.target.value })}
                    className="h-9 pl-9 pr-2 text-sm rounded-lg border outline-none appearance-none"
                    style={inputBaseStyle}
                  />
                </div>
              </div>
            </div>

            {/* Switches + IF input */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.is_top}
                  onChange={(e) => onFiltersChange({ ...filters, is_top: e.target.checked })}
                  className="w-4 h-4 rounded border accent-blue-600"
                />
                <span className="text-xs" style={{ color: 'var(--text)' }}>仅显示 Top 期刊</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.is_cns}
                  onChange={(e) => onFiltersChange({ ...filters, is_cns: e.target.checked })}
                  className="w-4 h-4 rounded border accent-blue-600"
                />
                <span className="text-xs" style={{ color: 'var(--text)' }}>仅显示 CNS 子刊</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--muted)' }}>IF ≥</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={filters.if_min}
                  onChange={(e) => onFiltersChange({ ...filters, if_min: e.target.value })}
                  className="w-20 h-8 px-2 text-sm rounded-md border outline-none"
                  style={inputBaseStyle}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
