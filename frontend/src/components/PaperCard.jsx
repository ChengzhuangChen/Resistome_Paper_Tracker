import {
  FaUser,
  FaBuilding,
  FaVial,
  FaFlask,
  FaRegLightbulb,
  FaCheckCircle,
} from 'react-icons/fa'

const QUARTILE_MAP = {
  Q1: { bar: '#22c55e', bg: '#dcfce7', text: '#166534' },
  Q2: { bar: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
  Q3: { bar: '#f97316', bg: '#ffedd5', text: '#9a3412' },
  Q4: { bar: '#6b7280', bg: '#f3f4f6', text: '#4b5563' },
}

function getQuartileStyle(q) {
  return QUARTILE_MAP[q] || { bar: '#d1d5db', bg: '#f9fafb', text: '#9ca3af' }
}

function truncate(str, maxLen) {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

function formatMethod(methods) {
  if (!methods) return ''
  const lower = methods.toLowerCase()
  if (lower.includes('metagenom') || lower.includes('宏基因组')) return '宏基因组学'
  if (lower.includes('pcr')) return 'PCR'
  return methods
}

export default function PaperCard({ paper, highlightText, onClick }) {
  const qStyle = getQuartileStyle(paper.jcr_quartile)
  const journalAbbr = paper.journal ? paper.journal[0].toUpperCase() : '?'

  const abstractPreview = paper.abstract_cn
    ? paper.abstract_cn.slice(0, 150) + (paper.abstract_cn.length > 150 ? '…' : '')
    : '暂无中文摘要'

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex flex-col md:flex-row overflow-hidden"
      style={{
        background: '#fff',
        borderColor: 'var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}
    >
      {/* Left color bar */}
      <div className="w-full md:w-1.5 shrink-0" style={{ background: qStyle.bar }} />

      {/* Main content */}
      <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col gap-2 sm:gap-2.5">
        {/* Title row */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm sm:text-[15px] font-bold leading-snug" style={{ color: 'var(--text)' }}>
                {highlightText(paper.title)}
              </span>
              {paper.is_cns && (
                <span className="text-red-500 text-sm font-bold leading-none" title="CNS 期刊">*</span>
              )}
              {paper.is_top && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: '#fef3c7', color: '#b45309' }}
                >
                  Top
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              {paper.journal && (
                <span className="font-medium" style={{ color: 'var(--muted)' }}>
                  {paper.journal}
                </span>
              )}
              {paper.if_ != null && (
                <span className="font-semibold" style={{ color: '#d97706' }}>
                  IF {paper.if_}
                </span>
              )}
              {paper.jcr_quartile && (
                <span
                  className="px-1.5 py-0.5 rounded text-[11px] font-semibold"
                  style={{ background: qStyle.bg, color: qStyle.text }}
                >
                  {paper.jcr_quartile}
                </span>
              )}
              {paper.xinrui_quartile && (
                <span
                  className="px-1.5 py-0.5 rounded text-[11px] font-semibold"
                  style={{ background: '#f0f9ff', color: '#0369a1' }}
                >
                  新锐{paper.xinrui_quartile}区
                </span>
              )}
            </div>
          </div>

          {/* Right circle (hidden on mobile) */}
          <div
            className="hidden md:flex w-12 h-12 rounded-full items-center justify-center shrink-0 text-sm font-bold"
            style={{ background: qStyle.bg, color: qStyle.text }}
            title={paper.journal || ''}
          >
            {journalAbbr}
          </div>
        </div>

        {/* Author / affiliation row */}
        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs">
          {paper.corresponding_author && (
            <span className="flex items-center gap-1 max-w-[45%] truncate" style={{ color: 'var(--muted)' }}>
              <FaUser className="w-3 h-3 shrink-0" />
              <span className="truncate">{paper.corresponding_author}</span>
            </span>
          )}
          {paper.first_affiliation && (
            <span className="flex items-center gap-1 max-w-[45%] truncate" style={{ color: 'var(--muted)' }} title={paper.first_affiliation}>
              <FaBuilding className="w-3 h-3 shrink-0" />
              <span className="truncate">{truncate(paper.first_affiliation, 24)}</span>
            </span>
          )}
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap items-center gap-2">
          {paper.subject_category && (
            <span
              className="px-2 py-0.5 rounded text-[11px] font-medium"
              style={{ background: '#eff6ff', color: '#1d4ed8' }}
            >
              {paper.subject_category}
            </span>
          )}
          {paper.article_type && (
            <span
              className="px-2 py-0.5 rounded text-[11px] font-medium"
              style={{ background: '#f3f4f6', color: '#6b7280' }}
            >
              {paper.article_type}
            </span>
          )}
          {paper.sample_source && paper.sample_source !== '未提及' && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
              style={{ background: '#f0f9ff', color: '#0369a1' }}
            >
              <FaVial className="w-3 h-3" />
              {paper.sample_source}
            </span>
          )}
          {formatMethod(paper.methods) && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
              style={{ background: '#f5f3ff', color: '#5b21b6' }}
            >
              <FaFlask className="w-3 h-3" />
              {formatMethod(paper.methods)}
            </span>
          )}
        </div>

        {/* Abstract row */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#374151' }}>
            {highlightText(abstractPreview)}
          </p>

          {(paper.highlights || paper.conclusion) && (
            <div className="flex flex-col gap-1.5">
              {paper.highlights && (
                <div className="flex items-start gap-1.5 text-xs">
                  <FaRegLightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                  <span className="italic" style={{ color: '#6b7280' }}>
                    &ldquo;{truncate(paper.highlights, 120)}&rdquo;
                  </span>
                </div>
              )}
              {paper.conclusion && (
                <div className="flex items-start gap-1.5 text-xs">
                  <FaCheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#059669' }} />
                  <span className="italic" style={{ color: '#6b7280' }}>
                    &ldquo;{truncate(paper.conclusion, 120)}&rdquo;
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
