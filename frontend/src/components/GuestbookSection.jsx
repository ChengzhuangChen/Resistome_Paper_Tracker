import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Send, Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { fetchGuestbook, postGuestbook } from '../api'

function timeAgo(dt) {
  const now = new Date()
  const then = new Date(dt)
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`
  return then.toLocaleDateString('zh-CN')
}

export default function GuestbookSection() {
  const [messages, setMessages] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const pageSize = 10

  const loadMessages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchGuestbook({ page, page_size: pageSize })
      setMessages(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const handleSubmit = async () => {
    const text = content.trim()
    if (!text) {
      setError('内容不能为空')
      return
    }
    if (text.length > 500) {
      setError('内容不能超过 500 字')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await postGuestbook({ nickname: nickname.trim() || undefined, content: text })
      setContent('')
      setPage(1)
      await loadMessages()
    } catch (e) {
      const msg = e.response?.data?.detail || '提交失败，请稍后重试'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}
    >
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        留言板
      </h3>

      {/* Input area */}
      <div className="space-y-3 mb-5">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="昵称（选填）"
          maxLength={32}
          className="w-full sm:w-64 px-3 py-2 text-sm rounded-md border outline-none transition-colors"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (error) setError('')
            }}
            placeholder="写下你的留言…"
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 text-sm rounded-md border outline-none transition-colors resize-none"
            style={{ borderColor: error ? '#ef4444' : 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
          <div className="absolute bottom-2 right-2 text-[10px]" style={{ color: 'var(--muted)' }}>
            {content.length}/500
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#ef4444' }}>
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            提交
          </button>
        </div>
      </div>

      {/* Message list */}
      <div className="space-y-3">
        {loading && messages.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg p-3" style={{ background: '#f9fafb' }}>
              <div className="h-3 rounded w-1/4 mb-2" style={{ background: '#e5e7eb' }} />
              <div className="h-3 rounded w-3/4" style={{ background: '#e5e7eb' }} />
            </div>
          ))
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--muted)' }}>
            暂无留言，来说两句吧～
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className="rounded-lg p-3"
              style={{ background: '#f9fafb', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                  {m.nickname || '匿名访客'}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                  {timeAgo(m.created_at)}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                {m.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            className="px-2.5 py-1 rounded-md bg-white border text-xs hover:bg-gray-50 disabled:opacity-40"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {page} / {totalPages}
          </span>
          <button
            className="px-2.5 py-1 rounded-md bg-white border text-xs hover:bg-gray-50 disabled:opacity-40"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
