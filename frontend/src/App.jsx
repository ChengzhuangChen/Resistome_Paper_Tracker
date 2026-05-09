import { useState, useEffect, useCallback, useMemo } from 'react'
import Header from './components/Header'
import Toolbar from './components/Toolbar'
import PaperTable from './components/PaperTable'
import PaperCard from './components/PaperCard'
import SectionView from './components/SectionView'
import PaperModal from './components/PaperModal'
import VisitorMap from './components/VisitorMap'
import UpdateLogPanel from './components/UpdateLogPanel'
import StatCards from './components/StatCards'
import ChartsSection from './components/ChartsSection'
import GlobalVisitorMap from './components/GlobalVisitorMap'
import GuestbookSection from './components/GuestbookSection'
import DonateCard from './components/DonateCard'
import { fetchPapers, fetchStats, visitorPing } from './api'

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

  const totalPages = Math.ceil(total / pageSize)

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
        total={total}
      />

      <main className="max-w-[1600px] mx-auto px-6 pb-10 space-y-6">
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
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              className="px-3 py-1.5 rounded-md bg-white border text-sm hover:bg-gray-50 disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </button>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              {page} / {totalPages}
            </span>
            <button
              className="px-3 py-1.5 rounded-md bg-white border text-sm hover:bg-gray-50 disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              下一页
            </button>
          </div>
        )}

        {/* Charts */}
        <ChartsSection stats={stats} />

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

      {/* Donate */}
      <DonateCard />

      {/* Footer */}
      <footer className="py-6 text-center text-xs" style={{ color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
        数据源自 PubMed · 由 DeepSeek 大模型提供中文摘要生成
      </footer>
    </div>
  )
}

export default App
