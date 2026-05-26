import { useEffect, useState } from 'react'
import { X, Clock, AlertCircle, CheckCircle, MinusCircle, Search, Download, Plus, Sparkles, XCircle, FileText } from 'lucide-react'
import { fetchUpdateLogs } from '../api'

const STATUS_META = {
  success: { icon: CheckCircle, color: '#059669', bg: '#d1fae5', label: '成功' },
  partial: { icon: MinusCircle, color: '#d97706', bg: '#fef3c7', label: '部分失败' },
  failed: { icon: AlertCircle, color: '#dc2626', bg: '#fee2e2', label: '失败' },
}

function formatRelativeTime(dateString) {
  const now = new Date()
  const then = new Date(dateString)
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHour < 24) return `${diffHour} 小时前`
  if (diffDay < 7) return `${diffDay} 天前`
  return then.toLocaleDateString('zh-CN')
}

function StatItem({ icon: Icon, label, value, highlight, danger }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.02)' }}>
      <Icon className="w-3.5 h-3.5" style={{ color: danger ? '#ef4444' : highlight ? 'var(--accent)' : 'var(--muted)' }} />
      <span className="text-base font-bold" style={{ color: danger ? '#ef4444' : highlight ? 'var(--accent)' : 'var(--text)' }}>
        {value}
      </span>
      <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}

export default function UpdateLogPanel({ onClose }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchUpdateLogs(7)
      setLogs(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        style={{ background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>更新日志</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-l)', color: 'var(--accent)' }}>
              最近 {logs.length} 次
            </span>
          </div>
          <button onClick={onClose} style={{ color: '#9ca3af' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-4 shadow-sm animate-pulse" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="h-4 rounded mb-3" style={{ background: '#e5e7eb', width: '40%' }} />
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="h-8 rounded" style={{ background: '#e5e7eb' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileText className="w-10 h-10" style={{ color: '#d1d5db' }} />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>暂无更新日志</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const meta = STATUS_META[log.status] || STATUS_META.failed
                const StatusIcon = meta.icon
                const hasNew = log.new_count > 0

                return (
                  <div
                    key={log.id}
                    className="rounded-xl border p-4 shadow-sm"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    {/* Top row: time + status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {formatRelativeTime(log.triggered_at)}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          {new Date(log.triggered_at).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-5 gap-2">
                      <StatItem icon={Search} label="检索" value={log.searched} />
                      <StatItem icon={Download} label="获取" value={log.fetched} />
                      <StatItem icon={Plus} label="新增" value={log.new_count} highlight={hasNew} />
                      <StatItem icon={Sparkles} label="分析" value={log.enriched} />
                      <StatItem icon={XCircle} label="失败" value={log.failed_count} danger={log.failed_count > 0} />
                    </div>

                    {/* No-new hint */}
                    {!hasNew && (
                      <div className="mt-3 text-xs px-3 py-2 rounded-lg text-center" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                        该次更新无新增文献
                      </div>
                    )}

                    {/* Error message */}
                    {log.error_msg && (
                      <div className="mt-3 text-xs px-3 py-2 rounded-lg leading-relaxed" style={{ background: '#fee2e2', color: '#991b1b' }}>
                        <span className="font-semibold">错误信息：</span>
                        {log.error_msg.length > 120 ? log.error_msg.slice(0, 120) + '...' : log.error_msg}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
