import {
  X, Calendar, BookOpen, FlaskConical, Target, Lightbulb, CheckCircle,
  ExternalLink, FileText, User, Building2, TestTube, Star, Award, Tag,
} from 'lucide-react'

const QUARTILE_STYLES = {
  Q1: { bg: '#d1fae5', text: '#065f46', label: 'Q1' },
  Q2: { bg: '#dbeafe', text: '#1e40af', label: 'Q2' },
  Q3: { bg: '#ffedd5', text: '#9a3412', label: 'Q3' },
  Q4: { bg: '#f3f4f6', text: '#4b5563', label: 'Q4' },
}

function Badge({ children, bg, text, border }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold border"
      style={{ background: bg, color: text, borderColor: border || bg }}
    >
      {children}
    </span>
  )
}

function Section({ label, value, icon: Icon }) {
  if (!value) return null
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
        {label}
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#374151' }}>
        {value}
      </div>
    </div>
  )
}

export default function PaperModal({ paper, onClose }) {
  const qStyle = QUARTILE_STYLES[paper.jcr_quartile] || { bg: '#f3f4f6', text: '#9ca3af', label: paper.jcr_quartile || 'NA' }
  const subjectStyle = {
    '临床医学': { bg: '#fee2e2', text: '#991b1b' },
    '环境科学': { bg: '#d1fae5', text: '#065f46' },
    '动物健康': { bg: '#ffedd5', text: '#9a3412' },
    '食品与公共卫生': { bg: '#fef3c7', text: '#92400e' },
    '分子机制与遗传学': { bg: '#e0e7ff', text: '#3730a3' },
    '生物信息学与监测': { bg: '#dbeafe', text: '#1e40af' },
    '植物与农业': { bg: '#dcfce7', text: '#166534' },
    '其他': { bg: '#f3f4f6', text: '#4b5563' },
  }[paper.subject_category] || { bg: '#f3f4f6', text: '#4b5563' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto"
        style={{ background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-4 px-6 py-5"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-snug pr-4" style={{ color: 'var(--text)' }}>{paper.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {paper.journal && (
                <span className="font-medium" style={{ color: 'var(--muted)' }}>{paper.journal}</span>
              )}
              <Badge bg={qStyle.bg} text={qStyle.text}>
                JCR {qStyle.label}
              </Badge>
              {paper.xinrui_quartile && (
                <Badge bg="#f0f9ff" text="#0369a1" border="#bae6fd">
                  新锐{paper.xinrui_quartile}区
                </Badge>
              )}
              {paper.if_ && (
                <Badge bg="#fef3c7" text="#b45309" border="#fde68a">
                  IF {paper.if_}
                </Badge>
              )}
              {paper.is_top && (
                <Badge bg="#fef3c7" text="#b45309" border="#fde68a">
                  <Award className="w-3 h-3 mr-0.5" /> Top
                </Badge>
              )}
              {paper.is_cns && (
                <Badge bg="#fee2e2" text="#991b1b" border="#fecaca">
                  <Star className="w-3 h-3 mr-0.5" /> CNS
                </Badge>
              )}
              {paper.article_type && (
                <Badge bg="#f3f4f6" text="#4b5563" border="#e5e7eb">
                  {paper.article_type}
                </Badge>
              )}
              {paper.subject_category && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium"
                  style={{ background: subjectStyle.bg, color: subjectStyle.text }}
                >
                  {paper.subject_category}
                </span>
              )}
              {paper.publication_date && (
                <span className="flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                  <Calendar className="w-3 h-3" />
                  {paper.publication_date}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md shrink-0 transition-colors"
            style={{ color: '#9ca3af' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meta info row */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {paper.corresponding_author && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                <span style={{ color: 'var(--muted)' }}>通讯作者：</span>
                <span style={{ color: 'var(--text)' }}>{paper.corresponding_author}</span>
              </div>
            )}
            {paper.first_affiliation && (
              <div className="flex items-start gap-1.5">
                <Building2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <span style={{ color: 'var(--muted)' }}>第一单位：</span>
                <span className="break-all" style={{ color: 'var(--text)' }}>{paper.first_affiliation}</span>
              </div>
            )}
            {paper.sample_source && paper.sample_source !== '未提及' && (
              <div className="flex items-center gap-1.5">
                <TestTube className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                <span style={{ color: 'var(--muted)' }}>样本来源：</span>
                <span style={{ color: 'var(--text)' }}>{paper.sample_source}</span>
              </div>
            )}
            {paper.methods && (
              <div className="flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                <span style={{ color: 'var(--muted)' }}>研究方法：</span>
                <span style={{ color: 'var(--text)' }}>{paper.methods}</span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {paper.abstract_en && (
            <Section label="英文摘要（原文）" value={paper.abstract_en} icon={FileText} />
          )}
          <Section label="中文摘要" value={paper.abstract_cn} icon={BookOpen} />
          <Section label="研究方法" value={paper.methods} icon={FlaskConical} />
          <Section label="研究对象" value={paper.research_subject} icon={Target} />
          <Section label="主要创新点" value={paper.highlights} icon={Lightbulb} />
          <Section label="结论" value={paper.conclusion} icon={CheckCircle} />

          <div className="pt-2 flex flex-wrap gap-3">
            {paper.doi && (
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                <ExternalLink className="w-4 h-4" />
                查看原文 (DOI)
              </a>
            )}
            {paper.pmid && (
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                <ExternalLink className="w-4 h-4" />
                PubMed
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
