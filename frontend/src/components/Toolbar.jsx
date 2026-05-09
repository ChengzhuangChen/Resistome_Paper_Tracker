import { useState } from 'react'
import {
  FaSearch,
  FaLayerGroup,
  FaCalendarAlt,
  FaSortAmountDown,
  FaRedo,
  FaSlidersH,
  FaChevronDown,
  FaChevronUp,
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
const QUARTILES = ['Q1', 'Q2', 'Q3', 'Q4', 'NA']

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
  total,
  onExport,
}) {
  const [showFilters, setShowFilters] = useState(false)

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

  const inputBaseStyle = {
    borderColor: 'var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-3">
      <div
        className="rounded-xl py-2 px-3"
        style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}
      >
        {/* Single row: Search + Filters + Stats/Views */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative" style={{ width: 150 }}>
            <FaSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: '#9ca3af' }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="搜索题目、摘要、期刊……"
              className="w-full h-9 pl-9 pr-8 text-sm rounded-lg border outline-none transition-colors"
              style={inputBaseStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
            {query && (
              <button
                onClick={() => onQueryChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <FaTimes className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
              </button>
            )}
          </div>

          {/* Quartile */}
          <div className="relative">
            <FaLayerGroup
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: '#9ca3af' }}
            />
            <select
              value={filters.jcr_quartile}
              onChange={(e) => onFiltersChange({ ...filters, jcr_quartile: e.target.value })}
              className="h-9 pl-9 pr-8 text-sm rounded-lg border outline-none cursor-pointer appearance-none"
              style={inputBaseStyle}
            >
              <option value="">全部分区</option>
              {QUARTILES.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
            <FaChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
              style={{ color: '#9ca3af' }}
            />
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5">
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
                style={{ ...inputBaseStyle, width: 115 }}
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
                style={{ ...inputBaseStyle, width: 115 }}
              />
            </div>
          </div>

          {/* Sort */}
          <div className="relative">
            <FaSortAmountDown
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: '#9ca3af' }}
            />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="h-9 pl-9 pr-8 text-sm rounded-lg border outline-none cursor-pointer appearance-none"
              style={inputBaseStyle}
            >
              <option value="-publication_date">日期 ↓</option>
              <option value="publication_date">日期 ↑</option>
              <option value="-jcr_quartile">JCR ↓</option>
              <option value="jcr_quartile">JCR ↑</option>
              <option value="-xinrui_quartile">新锐分区 ↓</option>
              <option value="xinrui_quartile">新锐分区 ↑</option>
              <option value="-if_">IF ↓</option>
              <option value="if_">IF ↑</option>
              <option value="-article_type">文献类型 ↓</option>
              <option value="article_type">文献类型 ↑</option>
              <option value="title">标题 A-Z</option>
            </select>
            <FaChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
              style={{ color: '#9ca3af' }}
            />
          </div>

          {/* Advanced filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 h-9 px-2 text-sm rounded-lg border outline-none cursor-pointer transition-colors"
            style={{
              borderColor: 'var(--border)',
              background: showFilters ? 'var(--accent-l)' : 'var(--surface)',
              color: showFilters ? 'var(--accent)' : 'var(--text)',
            }}
          >
            <FaSlidersH className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">高级筛选</span>
            {showFilters ? (
              <FaChevronUp className="w-3 h-3" />
            ) : (
              <FaChevronDown className="w-3 h-3" />
            )}
          </button>

          {/* Reset */}
          <button
            onClick={clearAll}
            disabled={!hasActive}
            className="flex items-center gap-1.5 h-9 px-2 text-sm rounded-lg border outline-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--muted)',
            }}
          >
            <FaRedo className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">重置</span>
          </button>

          {/* Right: Stats + Views + Export */}
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>
              共 {total} 篇
            </span>

            {/* View toggle */}
            <div
              className="flex rounded-lg overflow-hidden border"
              style={{ borderColor: 'var(--border)' }}
            >
              <button
                onClick={() => onViewChange('section')}
                title="分区视图"
                className="h-9 px-2 flex items-center gap-1.5 text-sm transition-colors"
                style={{
                  background: view === 'section' ? 'var(--accent)' : 'var(--surface)',
                  color: view === 'section' ? '#fff' : 'var(--muted)',
                }}
              >
                <FaStream className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">分区</span>
              </button>
              <button
                onClick={() => onViewChange('table')}
                title="表格视图"
                className="h-9 px-2 flex items-center gap-1.5 text-sm transition-colors"
                style={{
                  background: view === 'table' ? 'var(--accent)' : 'var(--surface)',
                  color: view === 'table' ? '#fff' : 'var(--muted)',
                }}
              >
                <FaTable className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">表格</span>
              </button>
              <button
                onClick={() => onViewChange('card')}
                title="卡片视图"
                className="h-9 px-2 flex items-center gap-1.5 text-sm transition-colors"
                style={{
                  background: view === 'card' ? 'var(--accent)' : 'var(--surface)',
                  color: view === 'card' ? '#fff' : 'var(--muted)',
                }}
              >
                <FaThLarge className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">卡片</span>
              </button>
            </div>

            {/* Export CSV */}
            <button
              onClick={onExport}
              disabled={!onExport}
              title="导出CSV"
              className="flex items-center gap-1.5 h-9 px-2 text-sm rounded-lg border outline-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--surface)',
                color: 'var(--muted)',
              }}
            >
              <FaDownload className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">导出CSV</span>
            </button>
          </div>
        </div>

        {/* Advanced filter panel */}
        {showFilters && (
          <div
            className="mt-3 rounded-xl border p-4 space-y-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {/* Article type multi-select */}
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

            {/* Subject category multi-select */}
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
