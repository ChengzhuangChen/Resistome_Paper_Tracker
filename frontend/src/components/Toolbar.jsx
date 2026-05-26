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
  { id: 'high_if', label: 'IF（>10）' },
  { id: 'cns', label: 'CNS期刊' },
  { id: 'recent30', label: '近30天' },
]

function ToggleChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all duration-200"
      style={{
        background: active ? 'var(--accent)' : '#fff',
        color: active ? '#fff' : '#64748b',
        borderColor: active ? 'var(--accent)' : '#e2e8f0',
        boxShadow: active ? '0 1px 4px rgba(37,99,235,0.2)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = '#cbd5e1'
          e.currentTarget.style.background = '#f8fafc'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = '#e2e8f0'
          e.currentTarget.style.background = '#fff'
        }
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
    background: '#fafbfc',
    color: 'var(--text)',
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || '排序'

  const actionBtnClass =
    'flex items-center gap-1 h-8 px-2.5 text-xs rounded-lg border outline-none cursor-pointer transition-all duration-200 whitespace-nowrap'

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-2">
      <div
        className="rounded-2xl border"
        style={{ background: '#fff', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
      >
        {/* Single horizontal bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Search */}
          <div className="relative shrink-0 w-[108px] sm:w-[260px]">
            <FaSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: '#9ca3af' }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="搜索标题、摘要、期刊…"
              className="w-full h-9 pl-9 pr-7 text-sm rounded-xl border outline-none transition-all duration-200"
              style={inputBaseStyle}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)'
                e.target.style.background = '#fff'
                e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)'
                e.target.style.background = '#fafbfc'
                e.target.style.boxShadow = 'none'
              }}
            />
            {query && (
              <button
                onClick={() => onQueryChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors hover:bg-gray-100"
              >
                <FaTimes className="w-3 h-3" style={{ color: 'var(--muted)' }} />
              </button>
            )}
          </div>

          {/* Quick filters */}
          <div className="flex items-center gap-1.5 shrink-0">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => applyQuickFilter(f.id)}
                className="px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-200 whitespace-nowrap"
                style={{
                  background: activeQuickFilter === f.id ? 'var(--accent)' : '#f1f5f9',
                  color: activeQuickFilter === f.id ? '#fff' : '#475569',
                  borderColor: activeQuickFilter === f.id ? 'var(--accent)' : '#e2e8f0',
                  boxShadow: activeQuickFilter === f.id ? '0 1px 4px rgba(37,99,235,0.2)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (activeQuickFilter !== f.id) {
                    e.currentTarget.style.background = '#e2e8f0'
                    e.currentTarget.style.borderColor = '#cbd5e1'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeQuickFilter !== f.id) {
                    e.currentTarget.style.background = '#f1f5f9'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                  }
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 shrink-0" style={{ background: 'var(--border)' }} />

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sort dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className={actionBtnClass}
                style={{
                  borderColor: 'var(--border)',
                  background: '#fafbfc',
                  color: '#475569',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.background = '#f1f5f9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = '#fafbfc'
                }}
              >
                <FaSortAmountDown className="w-3 h-3" />
                <span className="hidden sm:inline">{currentSortLabel}</span>
              </button>
              {showSortMenu && (
                <div
                  className="absolute right-0 mt-1.5 w-36 rounded-xl border shadow-lg z-20 overflow-hidden"
                  style={{ background: '#fff', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => {
                        onSortChange(o.value)
                        setShowSortMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm transition-colors duration-150 hover:bg-slate-50"
                      style={{
                        color: sortBy === o.value ? 'var(--accent)' : '#374151',
                        background: sortBy === o.value ? '#f0f7ff' : undefined,
                        fontWeight: sortBy === o.value ? 600 : 400,
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
              className="hidden sm:flex rounded-lg overflow-hidden border shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              {[
                { key: 'section', icon: FaStream, label: '分区' },
                { key: 'table', icon: FaTable, label: '表格' },
                { key: 'card', icon: FaThLarge, label: '卡片' },
              ].map((v) => (
                <button
                  key={v.key}
                  onClick={() => onViewChange(v.key)}
                  title={`${v.label}视图`}
                  className="h-8 px-2.5 flex items-center gap-1 text-xs transition-all duration-200"
                  style={{
                    background: view === v.key ? 'var(--accent)' : '#fafbfc',
                    color: view === v.key ? '#fff' : '#64748b',
                  }}
                  onMouseEnter={(e) => {
                    if (view !== v.key) {
                      e.currentTarget.style.background = '#f1f5f9'
                      e.currentTarget.style.color = '#475569'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (view !== v.key) {
                      e.currentTarget.style.background = '#fafbfc'
                      e.currentTarget.style.color = '#64748b'
                    }
                  }}
                >
                  <v.icon className="w-3 h-3" />
                  <span>{v.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className={actionBtnClass}
              style={{
                borderColor: showFilters ? 'var(--accent)' : 'var(--border)',
                background: showFilters ? '#f0f7ff' : '#fafbfc',
                color: showFilters ? 'var(--accent)' : '#475569',
              }}
              onMouseEnter={(e) => {
                if (!showFilters) {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.background = '#f1f5f9'
                }
              }}
              onMouseLeave={(e) => {
                if (!showFilters) {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = '#fafbfc'
                }
              }}
            >
              <FaFilter className="w-3 h-3" />
              <span className="hidden sm:inline">高级筛选</span>
            </button>

            <button
              onClick={clearAll}
              disabled={!hasActive}
              className={`${actionBtnClass} disabled:opacity-40 disabled:cursor-not-allowed`}
              style={{
                borderColor: 'var(--border)',
                background: '#fafbfc',
                color: '#64748b',
              }}
              onMouseEnter={(e) => {
                if (hasActive) {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.background = '#f1f5f9'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = '#fafbfc'
              }}
            >
              <FaRedo className="w-3 h-3" />
              <span className="hidden sm:inline">重置</span>
            </button>

            <button
              onClick={onExport}
              disabled={!onExport}
              title="导出CSV"
              className={`${actionBtnClass} disabled:opacity-40 disabled:cursor-not-allowed`}
              style={{
                borderColor: 'var(--border)',
                background: '#fafbfc',
                color: '#64748b',
              }}
              onMouseEnter={(e) => {
                if (onExport) {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.background = '#f1f5f9'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = '#fafbfc'
              }}
            >
              <FaDownload className="w-3 h-3" />
              <span className="hidden sm:inline">导出</span>
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActive && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 border-t" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[11px] font-medium mr-0.5" style={{ color: '#9ca3af' }}>已选</span>
            {query && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border font-medium" style={{ background: '#f0f7ff', color: 'var(--accent)', borderColor: '#dbeafe' }}>
                搜索：{query}
                <button onClick={() => onQueryChange('')} className="hover:opacity-70 p-0.5 rounded-full hover:bg-blue-100 transition-colors"><FaTimes className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filters.article_type?.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border font-medium" style={{ background: '#f0f7ff', color: 'var(--accent)', borderColor: '#dbeafe' }}>
                {t}
                <button onClick={() => toggleArrayFilter('article_type', t)} className="hover:opacity-70 p-0.5 rounded-full hover:bg-blue-100 transition-colors"><FaTimes className="w-2.5 h-2.5" /></button>
              </span>
            ))}
            {filters.subject_category?.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border font-medium" style={{ background: '#f0f7ff', color: 'var(--accent)', borderColor: '#dbeafe' }}>
                {s}
                <button onClick={() => toggleArrayFilter('subject_category', s)} className="hover:opacity-70 p-0.5 rounded-full hover:bg-blue-100 transition-colors"><FaTimes className="w-2.5 h-2.5" /></button>
              </span>
            ))}
            {filters.jcr_quartile && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border font-medium" style={{ background: '#f0f7ff', color: 'var(--accent)', borderColor: '#dbeafe' }}>
                JCR：{filters.jcr_quartile}
                <button onClick={() => onFiltersChange({ ...filters, jcr_quartile: '' })} className="hover:opacity-70 p-0.5 rounded-full hover:bg-blue-100 transition-colors"><FaTimes className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filters.is_top && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border font-medium" style={{ background: '#f0f7ff', color: 'var(--accent)', borderColor: '#dbeafe' }}>
                Top期刊
                <button onClick={() => onFiltersChange({ ...filters, is_top: false })} className="hover:opacity-70 p-0.5 rounded-full hover:bg-blue-100 transition-colors"><FaTimes className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filters.is_cns && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border font-medium" style={{ background: '#f0f7ff', color: 'var(--accent)', borderColor: '#dbeafe' }}>
                CNS期刊
                <button onClick={() => onFiltersChange({ ...filters, is_cns: false })} className="hover:opacity-70 p-0.5 rounded-full hover:bg-blue-100 transition-colors"><FaTimes className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filters.if_min && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border font-medium" style={{ background: '#f0f7ff', color: 'var(--accent)', borderColor: '#dbeafe' }}>
                IF ≥ {filters.if_min}
                <button onClick={() => onFiltersChange({ ...filters, if_min: '' })} className="hover:opacity-70 p-0.5 rounded-full hover:bg-blue-100 transition-colors"><FaTimes className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filters.date_from && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border font-medium" style={{ background: '#f0f7ff', color: 'var(--accent)', borderColor: '#dbeafe' }}>
                {filters.date_from}{filters.date_to ? ` 至 ${filters.date_to}` : ' 起'}
                <button onClick={() => onFiltersChange({ ...filters, date_from: '', date_to: '' })} className="hover:opacity-70 p-0.5 rounded-full hover:bg-blue-100 transition-colors"><FaTimes className="w-2.5 h-2.5" /></button>
              </span>
            )}
          </div>
        )}

        {/* Advanced filter panel */}
        {showFilters && (
          <div
            className="border-t px-3 py-3 sm:px-4 sm:py-4 space-y-4"
            style={{ background: '#fafbfc', borderColor: 'var(--border)' }}
          >
            {/* JCR Quartile */}
            <div>
              <div className="text-xs font-bold mb-2 tracking-wide" style={{ color: '#475569' }}>
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
              <div className="text-xs font-bold mb-2 tracking-wide" style={{ color: '#475569' }}>
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
              <div className="text-xs font-bold mb-2 tracking-wide" style={{ color: '#475569' }}>
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
              <div className="text-xs font-bold mb-2 tracking-wide" style={{ color: '#475569' }}>
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
                    className="h-9 pl-9 pr-2 text-sm rounded-xl border outline-none appearance-none transition-all duration-200"
                    style={inputBaseStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent)'
                      e.target.style.background = '#fff'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border)'
                      e.target.style.background = '#fafbfc'
                    }}
                  />
                </div>
                <span className="text-sm" style={{ color: '#9ca3af' }}>—</span>
                <div className="relative">
                  <FaCalendarAlt
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                    style={{ color: '#9ca3af' }}
                  />
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => onFiltersChange({ ...filters, date_to: e.target.value })}
                    className="h-9 pl-9 pr-2 text-sm rounded-xl border outline-none appearance-none transition-all duration-200"
                    style={inputBaseStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent)'
                      e.target.style.background = '#fff'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border)'
                      e.target.style.background = '#fafbfc'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Switches + IF input */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.is_top}
                  onChange={(e) => onFiltersChange({ ...filters, is_top: e.target.checked })}
                  className="w-4 h-4 rounded border accent-blue-600 cursor-pointer"
                />
                <span className="text-xs" style={{ color: '#475569' }}>仅显示 Top 期刊</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.is_cns}
                  onChange={(e) => onFiltersChange({ ...filters, is_cns: e.target.checked })}
                  className="w-4 h-4 rounded border accent-blue-600 cursor-pointer"
                />
                <span className="text-xs" style={{ color: '#475569' }}>仅显示 CNS 期刊</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: '#6b7280' }}>IF ≥</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={filters.if_min}
                  onChange={(e) => onFiltersChange({ ...filters, if_min: e.target.value })}
                  className="w-20 h-8 px-2 text-sm rounded-lg border outline-none transition-all duration-200"
                  style={inputBaseStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent)'
                    e.target.style.background = '#fff'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)'
                    e.target.style.background = '#fafbfc'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
