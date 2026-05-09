import { useEffect, useState } from 'react'
import { X, FileText, Clock, AlertCircle, CheckCircle, MinusCircle } from 'lucide-react'
import { fetchLogs } from '../api'

const STATUS_META = {
  success: { icon: CheckCircle, color: '#059669', bg: '#d1fae5', label: '成功' },
  partial: { icon: MinusCircle, color: '#d97706', bg: '#fef3c7', label: '部分成功' },
  failed: { icon: AlertCircle, color: '#dc2626', bg: '#fee2e2', label: '失败' },
}

export default function UpdateLogPanel({ onClose }) {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const pageSize = 15

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchLogs({ page, page_size: pageSize })
      setLogs(res.data.items)
      setTotal(res.data.total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        style={{ background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>更新日志</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-l)', color: 'var(--accent)' }}>
              共 {total} 条
            </span>
          </div>
          <button onClick={onClose} style={{ color: '#9ca3af' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10" style={{ background: '#f9fafb' }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-4 py-2.5 font-semibold text-xs" style={{ color: 'var(--muted)' }}>时间</th>
                <th className="text-right px-4 py-2.5 font-semibold text-xs" style={{ color: 'var(--muted)' }}>检索</th>
                <th className="text-right px-4 py-2.5 font-semibold text-xs" style={{ color: 'var(--muted)' }}>获取</th>
                <th className="text-right px-4 py-2.5 font-semibold text-xs" style={{ color: 'var(--muted)' }}>新增</th>
                <th className="text-right px-4 py-2.5 font-semibold text-xs" style={{ color: 'var(--muted)' }}>分析</th>
                <th className="text-right px-4 py-2.5 font-semibold text-xs" style={{ color: 'var(--muted)' }}>失败</th>
                <th className="text-left px-4 py-2.5 font-semibold text-xs" style={{ color: 'var(--muted)' }}>状态</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded skeleton-pulse" style={{ background: '#e5e7eb', width: j === 0 ? '80%' : '60%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-xs" style={{ color: 'var(--muted)' }}>
                    暂无日志记录
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const meta = STATUS_META[log.status] || STATUS_META.failed
                  const Icon = meta.icon
                  return (
                    <tr
                      key={log.id}
                      className={idx % 2 === 0 ? 'tr-odd' : 'tr-even'}
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text)' }}>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" style={{ color: 'var(--muted)' }} />
                          {new Date(log.triggered_at).toLocaleString('zh-CN')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-medium" style={{ color: 'var(--text)' }}>{log.searched}</td>
                      <td className="px-4 py-3 text-xs text-right font-medium" style={{ color: 'var(--text)' }}>{log.fetched}</td>
                      <td className="px-4 py-3 text-xs text-right font-medium" style={{ color: 'var(--accent)' }}>{log.new_count}</td>
                      <td className="px-4 py-3 text-xs text-right font-medium" style={{ color: 'var(--green)' }}>{log.enriched}</td>
                      <td className="px-4 py-3 text-xs text-right font-medium" style={{ color: log.failed_count > 0 ? 'var(--red)' : 'var(--muted)' }}>{log.failed_count}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-6 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              className="px-3 py-1 rounded-md border text-xs hover:bg-gray-50 disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--surface)' }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </button>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {page} / {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded-md border text-xs hover:bg-gray-50 disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--surface)' }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
