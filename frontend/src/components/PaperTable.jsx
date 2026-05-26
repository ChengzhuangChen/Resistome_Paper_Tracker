import { ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'

const JCR_COLORS = {
  Q1: { bg: '#d1fae5', text: '#065f46', label: 'Q1' },
  Q2: { bg: '#dbeafe', text: '#1e40af', label: 'Q2' },
  Q3: { bg: '#ffedd5', text: '#9a3412', label: 'Q3' },
  Q4: { bg: '#f3f4f6', text: '#4b5563', label: 'Q4' },
}

const SORT_MAP = {
  '-publication_date': { col: 'date', dir: 'desc' },
  'publication_date': { col: 'date', dir: 'asc' },
  '-jcr_quartile': { col: 'jcr', dir: 'desc' },
  'jcr_quartile': { col: 'jcr', dir: 'asc' },
  'title': { col: 'title', dir: 'asc' },
  '-title': { col: 'title', dir: 'desc' },
  '-article_type': { col: 'type', dir: 'desc' },
  'article_type': { col: 'type', dir: 'asc' },
  '-if_': { col: 'if', dir: 'desc' },
  'if_': { col: 'if', dir: 'asc' },
  '-xinrui_quartile': { col: 'xinrui', dir: 'desc' },
  'xinrui_quartile': { col: 'xinrui', dir: 'asc' },
}

export default function PaperTable({ papers, loading, sortBy, onSortChange, highlightText, onRowClick }) {
  const columns = [
    { key: 'date', label: '发表日期', width: 88 },
    { key: 'type', label: '文献类型', width: 88 },
    { key: 'title', label: '题目', width: 140 },
    { key: 'journal', label: '期刊名', width: 90 },
    { key: 'corr_author', label: '通讯作者', width: 75 },
    { key: 'if', label: 'IF', width: 42 },
    { key: 'jcr', label: 'JCR', width: 48 },
    { key: 'xinrui', label: '新锐分区', width: 70 },
    { key: 'top', label: 'Top', width: 42 },
    { key: 'abstract', label: '中文摘要', width: 110 },
    { key: 'methods', label: '研究方法', width: 75 },
    { key: 'highlights', label: '主要创新点', width: 95 },
    { key: 'conclusion', label: '主要结论', width: 95 },
    { key: 'sample', label: '样本来源', width: 75 },
    { key: 'category', label: '学科分类', width: 68 },
  ]

  const getSortIcon = (colKey) => {
    const current = SORT_MAP[sortBy]
    if (!current || current.col !== colKey) return <ArrowUpDown className="w-3 h-3 opacity-40" />
    return current.dir === 'desc'
      ? <ArrowDown className="w-3 h-3" style={{ color: 'var(--accent)' }} />
      : <ArrowUp className="w-3 h-3" style={{ color: 'var(--accent)' }} />
  }

  const handleSort = (colKey) => {
    const map = {
      date: { '': '-publication_date', '-publication_date': 'publication_date', 'publication_date': '-publication_date' },
      jcr: { '': '-jcr_quartile', '-jcr_quartile': 'jcr_quartile', 'jcr_quartile': '-jcr_quartile' },
      title: { '': 'title', title: '-title', '-title': 'title' },
      type: { '': '-article_type', '-article_type': 'article_type', 'article_type': '-article_type' },
      if: { '': '-if_', '-if_': 'if_', 'if_': '-if_' },
      xinrui: { '': '-xinrui_quartile', '-xinrui_quartile': 'xinrui_quartile', 'xinrui_quartile': '-xinrui_quartile' },
    }
    const current = SORT_MAP[sortBy]?.col === colKey ? sortBy : ''
    onSortChange(map[colKey]?.[current] || map[colKey]?.[''])
  }

  const renderQuartile = (q) => {
    const style = JCR_COLORS[q] || { bg: '#f3f4f6', text: '#9ca3af', label: q || 'NA' }
    return (
      <span className="inline-block px-1.5 py-0.5 rounded-md text-[11px] font-semibold" style={{ background: style.bg, color: style.text }}>
        {style.label}
      </span>
    )
  }

  const truncate = (str, max) => {
    if (!str) return '—'
    return str.length > max ? str.slice(0, max) + '…' : str
  }

  const formatMethod = (methods) => {
    if (!methods) return '—'
    return truncate(methods, 22)
  }

  if (loading) {
    return (
      <div className="mt-2 overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}>
        <table className="w-full table-fixed" style={{ background: 'var(--surface)' }}>
          <thead className="sticky top-0 z-10">
            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid var(--border)' }}>
              {columns.map((c) => (
                <th key={c.key} className="px-2 py-2.5 text-left text-[11px] font-semibold tracking-wide uppercase" style={{ color: '#1f2937', width: c.width }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                {columns.map((c, j) => (
                  <td key={j} className="px-2 py-2.5">
                    <div className="h-2.5 rounded-md" style={{ background: j % 2 === 0 ? '#e2e8f0' : '#f1f5f9', width: j === 1 ? '80%' : j === 5 ? '90%' : '60%', animation: 'skeleton-pulse 1.6s infinite' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="mt-2 overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}>
      <table className="w-full table-fixed" style={{ background: 'var(--surface)' }}>
        <thead className="sticky top-0 z-10">
          <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid var(--border)' }}>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-2 py-2.5 ${c.key === 'title' ? 'text-center' : 'text-left'} text-[11px] font-semibold tracking-wide uppercase cursor-pointer select-none whitespace-nowrap transition-colors duration-150 hover:text-blue-600`}
                style={{ color: '#1f2937', width: c.width }}
                onClick={() => ['date', 'type', 'title', 'if', 'jcr', 'xinrui'].includes(c.key) && handleSort(c.key)}
              >
                <span className={`flex items-center gap-1 ${c.key === 'title' ? 'justify-center' : ''}`}>
                  {c.label}
                  {['date', 'type', 'title', 'if', 'jcr', 'xinrui'].includes(c.key) && getSortIcon(c.key)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {papers.map((p, idx) => {
            const hq = ['Q1', 'Q2'].includes(p.jcr_quartile)
            const cls = hq ? 'tr-high-quality' : idx % 2 === 0 ? 'tr-odd' : 'tr-even'
            return (
              <tr
                key={p.id}
                className={`${cls} cursor-pointer transition-colors duration-150 hover:bg-blue-50/60`}
                style={{ borderBottom: '1px solid var(--border)' }}
                onClick={() => onRowClick(p)}
              >
                <td className="px-2 py-2 text-[11px] whitespace-nowrap" style={{ color: '#1e3a8a' }}>
                  {p.publication_date || '—'}
                </td>
                <td className="px-2 py-2 text-[11px]" style={{ color: '#1e3a8a' }}>
                  {p.article_type || '—'}
                </td>
                <td className="px-2 py-2 text-[13px] font-semibold leading-snug text-center" style={{ color: 'var(--text)', wordBreak: 'break-word' }}>
                  {highlightText(p.title)}
                  {p.is_cns && <span className="text-red-500 font-bold ml-1">*</span>}
                </td>
                <td className="px-2 py-2 text-[11px]" style={{ color: '#1e3a8a' }}>
                  {p.journal || '—'}
                  {p.is_cns && (
                    <span
                      className="text-red-500 font-bold ml-0.5"
                      style={{ fontSize: '9px', verticalAlign: 'super' }}
                    >
                      CNS期刊
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-[11px]" style={{ color: '#1e3a8a' }}>
                  {p.corresponding_author || '—'}
                </td>
                <td className="px-2 py-2 text-[11px] font-semibold" style={{ color: '#d97706' }}>
                  {p.if_ ?? '—'}
                </td>
                <td className="px-2 py-2">
                  {renderQuartile(p.jcr_quartile)}
                </td>
                <td className="px-2 py-2 text-[11px]">
                  {p.xinrui_quartile ? (
                    <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: '#f0f9ff', color: '#0369a1' }}>
                      {p.xinrui_quartile}区
                    </span>
                  ) : '—'}
                </td>
                <td className="px-2 py-2 text-[11px]">
                  {p.is_top ? (
                    <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold" style={{ background: '#fef3c7', color: '#b45309' }}>
                      Top
                    </span>
                  ) : '—'}
                </td>
                <td className="px-2 py-2 text-[11px] leading-relaxed relative" style={{ color: '#374151' }}>
                  <div className="group relative">
                    {p.abstract_cn ? (
                      <>
                        <div className="line-clamp-5">
                          {highlightText(p.abstract_cn)}
                        </div>
                        <div
                          className="hidden group-hover:block absolute z-50 left-1/2 -translate-x-1/2 top-full mt-1.5 text-xs rounded-xl shadow-2xl pointer-events-none"
                          style={{
                            maxWidth: 450,
                            minWidth: 320,
                            maxHeight: 200,
                            overflowY: 'auto',
                            padding: '8px 12px',
                            writingMode: 'horizontal-tb',
                            background: '#fff',
                            color: '#374151',
                            border: '1px solid #e5e7eb',
                            lineHeight: 1.6,
                            textAlign: 'left',
                          }}
                        >
                          <div
                            style={{
                              whiteSpace: 'normal',
                              wordBreak: 'keep-all',
                              overflowWrap: 'break-word',
                            }}
                          >
                            {p.abstract_cn.length > 150 ? p.abstract_cn.slice(0, 150) + '…' : p.abstract_cn}
                          </div>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent" style={{ borderBottomColor: '#fff' }} />
                        </div>
                      </>
                    ) : '—'}
                  </div>
                </td>
                <td className="px-2 py-2 text-[11px]" style={{ color: '#9ca3af' }}>
                  {formatMethod(p.methods)}
                </td>
                <td className="px-2 py-2 text-[11px] leading-relaxed" style={{ color: '#374151', wordBreak: 'break-word' }}>
                  {highlightText(p.highlights) || '—'}
                </td>
                <td className="px-2 py-2 text-[11px] leading-relaxed" style={{ color: '#374151', wordBreak: 'break-word' }}>
                  {highlightText(p.conclusion) || '—'}
                </td>
                <td className="px-2 py-2 text-[11px] leading-relaxed" style={{ color: '#9ca3af', wordBreak: 'break-word' }}>
                  {p.sample_source || '—'}
                </td>
                <td className="px-2 py-2 text-[11px]">
                  {p.subject_category ? (
                    <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-medium" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                      {p.subject_category}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            )
          })}
          {papers.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-2 py-16 text-center text-sm" style={{ color: '#9ca3af' }}>
                暂无文献，请尝试调整筛选条件或触发更新
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
