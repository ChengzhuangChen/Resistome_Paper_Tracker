import { Calendar, ExternalLink, FlaskConical, Target, Lightbulb, CheckCircle, ChevronRight } from 'lucide-react'

const QUARTILE_ORDER = ['CNS', 'Q1', 'Q2', 'Q3', 'Q4', 'NA']

const SECTION_META = {
  CNS: {
    label: 'CNS 期刊文献',
    subtitle: 'Nature / Science / Cell 及其子刊',
    accent: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    badge: 'bg-red-50 text-red-700 border-red-200',
  },
  Q1: {
    label: 'Q1 区 · 高影响力期刊',
    subtitle: 'JCR Q1 分区高影响力期刊',
    accent: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Q2: {
    label: 'Q2 区 · 优秀期刊',
    subtitle: '高质量专业领域期刊',
    accent: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  Q3: {
    label: 'Q3 区 · 良好期刊',
    subtitle: '具有一定学术影响力的期刊',
    accent: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  Q4: {
    label: 'Q4 区 · 普通期刊',
    subtitle: '基础学术期刊',
    accent: '#6b7280',
    bg: '#f9fafb',
    border: '#e5e7eb',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  NA: {
    label: 'NA · 待评估',
    subtitle: '暂无 JCR 分区数据',
    accent: '#9ca3af',
    bg: '#fafafa',
    border: '#e5e7eb',
    badge: 'bg-gray-50 text-gray-500 border-gray-200',
  },
}

function SectionCard({ paper, highlightText, onClick }) {
  const abstractPreview = paper.abstract_cn
    ? paper.abstract_cn.slice(0, 140) + (paper.abstract_cn.length > 140 ? '...' : '')
    : '暂无中文摘要'

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <h4
          className="text-sm font-semibold leading-snug transition-colors group-hover:text-blue-600"
          style={{ color: 'var(--text)' }}
        >
          {highlightText(paper.title)}
        </h4>
        <ChevronRight
          className="w-4 h-4 shrink-0 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
          style={{ color: 'var(--muted)' }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="font-medium" style={{ color: 'var(--muted)' }}>
          {paper.journal || 'Unknown'}
        </span>
        {paper.article_type && (
          <span
            className="px-1.5 py-0.5 rounded font-medium"
            style={{ background: '#f3f4f6', color: '#6b7280' }}
          >
            {paper.article_type}
          </span>
        )}
        {paper.publication_date && (
          <span className="flex items-center gap-1" style={{ color: 'var(--muted)' }}>
            <Calendar className="w-3 h-3" />
            {paper.publication_date}
          </span>
        )}
        {paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-0.5 hover:underline"
            style={{ color: 'var(--accent)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            DOI
          </a>
        )}
      </div>

      <p className="mt-2.5 text-xs leading-relaxed line-clamp-2" style={{ color: '#4b5563' }}>
        {highlightText(abstractPreview)}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
        {paper.methods && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border"
            style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#374151' }}
          >
            <FlaskConical className="w-3 h-3" style={{ color: 'var(--accent)' }} />
            {highlightText(paper.methods)}
          </span>
        )}
        {paper.research_subject && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border"
            style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#374151' }}
          >
            <Target className="w-3 h-3" style={{ color: 'var(--green)' }} />
            {highlightText(paper.research_subject)}
          </span>
        )}
        {paper.highlights && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border"
            style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#374151' }}
          >
            <Lightbulb className="w-3 h-3" style={{ color: '#d97706' }} />
            创新点
          </span>
        )}
        {paper.conclusion && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border"
            style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#374151' }}
          >
            <CheckCircle className="w-3 h-3" style={{ color: 'var(--green)' }} />
            结论
          </span>
        )}
      </div>
    </div>
  )
}

export default function SectionView({ papers, loading, highlightText, onPaperClick }) {
  const grouped = {}
  for (const q of QUARTILE_ORDER) grouped[q] = []
  for (const p of papers) {
    if (p.is_cns) {
      grouped['CNS'].push(p)
    } else {
      const q = p.jcr_quartile || 'NA'
      if (grouped[q]) grouped[q].push(p)
      else grouped['NA'].push(p)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {QUARTILE_ORDER.map((q) => (
          <div key={q}>
            <div className="h-6 w-32 rounded mb-4 skeleton-pulse" style={{ background: '#e5e7eb' }} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border p-4"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="h-4 rounded w-3/4 mb-3 skeleton-pulse" style={{ background: '#e5e7eb' }} />
                  <div className="h-3 rounded w-1/2 mb-2 skeleton-pulse" style={{ background: '#e5e7eb' }} />
                  <div className="h-3 rounded w-full mb-2 skeleton-pulse" style={{ background: '#e5e7eb' }} />
                  <div className="h-3 rounded w-2/3 skeleton-pulse" style={{ background: '#e5e7eb' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (papers.length === 0) {
    return (
      <div className="text-center py-20 text-sm" style={{ color: 'var(--muted)' }}>
        暂无文献，请尝试调整筛选条件或触发更新
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {QUARTILE_ORDER.map((q) => {
        const list = grouped[q]
        if (list.length === 0) return null
        const meta = SECTION_META[q]

        return (
          <section key={q}>
            {/* Section Header */}
            <div
              className="flex items-center justify-between rounded-t-lg border px-5 py-3"
              style={{ background: meta.bg, borderColor: meta.border }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-8 rounded-full"
                  style={{ background: meta.accent }}
                />
                <div>
                  <h3 className="text-sm font-bold" style={{ color: meta.accent }}>
                    {meta.label}
                  </h3>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                    {meta.subtitle} · 共 {list.length} 篇
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded border ${meta.badge}`}
              >
                {list.length}
              </span>
            </div>

            {/* Cards Grid */}
            <div
              className="rounded-b-lg border border-t-0 p-4 grid grid-cols-1 md:grid-cols-2 gap-3"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {list.map((paper) => (
                <SectionCard
                  key={paper.id}
                  paper={paper}
                  highlightText={highlightText}
                  onClick={() => onPaperClick(paper)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
