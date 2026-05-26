import { useState, useEffect, useCallback, useMemo } from 'react'
import Header from './components/Header'
import Toolbar from './components/Toolbar'
import PaperTable from './components/PaperTable'
import PaperCard from './components/PaperCard'
import SectionView from './components/SectionView'
import PaperModal from './components/PaperModal'
import VisitorMap from './components/VisitorMap'
import UpdateLogPanel from './components/UpdateLogPanel'
import UpdateFaqPanel from './components/UpdateFaqPanel'
import StatCards from './components/StatCards'
import ChartsSection from './components/ChartsSection'
import GlobalVisitorMap from './components/GlobalVisitorMap'
import GuestbookSection from './components/GuestbookSection'
import DonateCard from './components/DonateCard'
import { fetchPapers, fetchStats, visitorPing, buildExportUrl } from './api'

function App() {
  const [papers, setPapers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [stats, setStats] = useState(null)
  const [view, setView] = useState('table') // 'table' | 'card' | 'section'

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    article_type: [],
    jcr_quartile: '',
    subject_category: [],
    is_top: false,
    is_cns: false,
    if_min: '',
    date_from: '',
    date_to: '',
  })
  const [sortBy, setSortBy] = useState('-publication_date')

  const [showVisitorMap, setShowVisitorMap] = useState(false)
  const [showLogPanel, setShowLogPanel] = useState(false)
  const [showUpdateFaq, setShowUpdateFaq] = useState(false)

  // Section view needs all papers to show true quartile distribution
  const pageSize = view === 'section' ? 1000 : 5

  const loadPapers = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        q: query || undefined,
        page,
        page_size: pageSize,
        sort_by: sortBy,
        jcr_quartile: filters.jcr_quartile || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        article_type: filters.article_type?.length ? filters.article_type.join(',') : undefined,
        subject_category: filters.subject_category?.length ? filters.subject_category.join(',') : undefined,
        is_top: filters.is_top || undefined,
        is_cns: filters.is_cns || undefined,
        if_min: filters.if_min ? Number(filters.if_min) : undefined,
      }
      const res = await fetchPapers(params)
      setPapers(res.data.items)
      setTotal(res.data.total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [query, page, filters, sortBy, pageSize])

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchStats()
      setStats(res.data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    loadPapers()
  }, [loadPapers])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Reset to page 1 when view changes
  useEffect(() => {
    setPage(1)
  }, [view])

  // Visitor ping on app init
  useEffect(() => {
    visitorPing().catch(() => {})
  }, [])

  // Auto-switch to card view on mobile (< 640px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640 && view === 'table') {
        setView('card')
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [view])

  const totalPages = Math.ceil(total / pageSize)

  const handleKeywordClick = useCallback((keyword) => {
    setQuery(keyword)
    setPage(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleExport = useCallback(() => {
    const params = {
      q: query || undefined,
      jcr_quartile: filters.jcr_quartile || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      article_type: filters.article_type?.length ? filters.article_type.join(',') : undefined,
      subject_category: filters.subject_category?.length ? filters.subject_category.join(',') : undefined,
      is_top: filters.is_top || undefined,
      is_cns: filters.is_cns || undefined,
      if_min: filters.if_min ? Number(filters.if_min) : undefined,
    }
    const url = buildExportUrl(params)

    if (papers.length === 0 && !loading) {
      const ok = window.confirm('当前筛选无结果，将导出仅有表头的空 CSV，是否继续？')
      if (!ok) return
    }

    const a = document.createElement('a')
    a.href = url
    a.download = ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [query, filters, papers.length, loading])

  const highlightText = useMemo(() => {
    if (!query) return (text) => text
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return (text) => {
      if (!text) return text
      const parts = text.split(re)
      return parts.map((part, i) =>
        re.test(part) ? <mark key={i} className="search-hl">{part}</mark> : part
      )
    }
  }, [query])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header
        onUpdateSuccess={loadStats}
        onShowVisitorMap={() => setShowVisitorMap(true)}
        onShowLogs={() => setShowLogPanel(true)}
        onShowUpdateFaq={() => setShowUpdateFaq(true)}
      />

      <Toolbar
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        view={view}
        onViewChange={setView}
        onExport={handleExport}
      />

      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 pb-10 space-y-6">
        {/* Stat cards */}
        <StatCards stats={stats} />

        {/* Papers list */}
        {view === 'table' ? (
          <PaperTable
            papers={papers}
            loading={loading}
            sortBy={sortBy}
            onSortChange={setSortBy}
            highlightText={highlightText}
            onRowClick={setSelectedPaper}
          />
        ) : view === 'card' ? (
          <div className="space-y-3">
            {papers.map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                highlightText={highlightText}
                onClick={() => setSelectedPaper(paper)}
              />
            ))}
            {papers.length === 0 && !loading && (
              <div className="text-center py-20 text-gray-400 text-sm">
                暂无文献，请尝试调整筛选条件或触发更新
              </div>
            )}
          </div>
        ) : (
          <SectionView
            papers={papers}
            loading={loading}
            highlightText={highlightText}
            onPaperClick={setSelectedPaper}
          />
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-1.5 flex-wrap">
            <button
              className="px-3 py-1.5 rounded-xl bg-white border text-sm font-medium transition-all duration-200 hover:bg-slate-50 hover:shadow-sm disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: '#9ca3af' }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1
              let show = false
              if (totalPages <= 7) {
                show = true
              } else if (p <= 2 || p >= totalPages - 1) {
                show = true
              } else if (p >= page - 1 && p <= page + 1) {
                show = true
              }
              if (!show) {
                if (p === 3 && page > 4) return <span key={p} className="px-1 text-sm" style={{ color: '#cbd5e1' }}>…</span>
                if (p === totalPages - 2 && page < totalPages - 3) return <span key={p} className="px-1 text-sm" style={{ color: '#cbd5e1' }}>…</span>
                return null
              }
              const active = p === page
              return (
                <button
                  key={p}
                  className="min-w-[2.25rem] px-2 py-1.5 rounded-xl border text-sm font-semibold transition-all duration-200 hover:shadow-sm"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                    background: active ? 'var(--accent)' : '#fff',
                    color: active ? '#fff' : '#9ca3af',
                    boxShadow: active ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
                  }}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            })}

            <button
              className="px-3 py-1.5 rounded-xl bg-white border text-sm font-medium transition-all duration-200 hover:bg-slate-50 hover:shadow-sm disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: '#9ca3af' }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              下一页
            </button>

            <span className="text-sm ml-1 font-medium" style={{ color: '#cbd5e1' }}>
              共 {totalPages} 页
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-sm font-medium" style={{ color: '#cbd5e1' }}>跳至</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                className="w-12 px-1.5 py-1 rounded-xl border text-sm text-center outline-none transition-all duration-200 focus:ring-2"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = Number(e.target.value)
                    if (v >= 1 && v <= totalPages) setPage(v)
                    e.target.value = ''
                  }
                }}
              />
              <span className="text-sm font-medium" style={{ color: '#cbd5e1' }}>页</span>
            </div>
          </div>
        )}

        {/* Charts */}
        <ChartsSection stats={stats} onKeywordClick={handleKeywordClick} />

        {/* Visitor map */}
        <GlobalVisitorMap />
      </main>

      {selectedPaper && (
        <PaperModal paper={selectedPaper} onClose={() => setSelectedPaper(null)} />
      )}

      {showVisitorMap && (
        <VisitorMap onClose={() => setShowVisitorMap(false)} />
      )}

      {showLogPanel && (
        <UpdateLogPanel onClose={() => setShowLogPanel(false)} />
      )}

      {showUpdateFaq && (
        <UpdateFaqPanel onClose={() => setShowUpdateFaq(false)} />
      )}

      {/* Donate */}
      <DonateCard />

      {/* Footer */}
      <footer className="py-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-xs text-gray-500 whitespace-normal sm:whitespace-nowrap">
          聚焦耐药组前沿，高效筛选高价值文献
        </div>
        <div className="text-[11px] text-gray-400 whitespace-normal sm:whitespace-nowrap" style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}>
          AI 提炼内容仅供参考，请以原文为准
        </div>
        <div className="text-[10px] text-gray-500 whitespace-normal sm:whitespace-nowrap">
          Resistome Literature Tracker © 2026 · Powered by PubMed & DeepSeek v4
        </div>
      </footer>
    </div>
  )
}

export default App
