import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Send, Loader2, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'
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
  const [success, setSuccess] = useState('')
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
    setSuccess('')
    setSubmitting(true)
    try {
      await postGuestbook({ nickname: nickname.trim() || undefined, content: text })
      setContent('')
      setPage(1)
      await loadMessages()
      setSuccess('留言已提交')
      setTimeout(() => setSuccess(''), 3000)
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
      className="rounded-2xl p-4 sm:p-6"
      style={{ background: '#fff', boxShadow: 'var(--shadow-md)' }}
    >
      <h3 className="text-sm font-bold mb-5 flex items-center gap-2 tracking-wide" style={{ color: '#374151' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#eff6ff' }}>
          <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        </div>
        留言板
      </h3>

      {/* Input area */}
      <div className="space-y-3 mb-6">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="昵称（选填）"
          maxLength={32}
          className="w-full sm:w-64 px-3 py-2 text-sm rounded-xl border outline-none transition-all duration-200"
          style={{ borderColor: 'var(--border)', background: '#fafbfc', color: 'var(--text)' }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent)'
            e.target.style.background = '#fff'
            e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border)'
            e.target.style.background = '#fafbfc'
            e.target.style.boxShadow = 'none'
          }}
        />
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (error) setError('')
              if (success) setSuccess('')
            }}
            placeholder="写下你的留言…"
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 text-sm rounded-xl border outline-none transition-all duration-200 resize-none"
            style={{ borderColor: error ? '#ef4444' : 'var(--border)', background: '#fafbfc', color: 'var(--text)' }}
            onFocus={(e) => {
              e.target.style.borderColor = error ? '#ef4444' : 'var(--accent)'
              e.target.style.background = '#fff'
              e.target.style.boxShadow = error ? 'none' : '0 0 0 3px rgba(37,99,235,0.08)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? '#ef4444' : 'var(--border)'
              e.target.style.background = '#fafbfc'
              e.target.style.boxShadow = 'none'
            }}
          />
          <div className="absolute bottom-2 right-2.5 text-[10px] font-medium" style={{ color: '#cbd5e1' }}>
            {content.length}/500
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ background: '#f0fdf4', color: '#059669' }}>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {success}
          </div>
        )}

        <div className="flex justify-end sm:justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 hover:shadow-md"
            style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8, #4338ca)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #4f46e5)'
            }}
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
            <div key={i} className="rounded-xl p-3.5" style={{ background: '#f8fafc' }}>
              <div className="h-3 rounded-md w-1/4 mb-2" style={{ background: '#e2e8f0' }} />
              <div className="h-3 rounded-md w-3/4" style={{ background: '#e2e8f0' }} />
            </div>
          ))
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-xs" style={{ color: '#cbd5e1' }}>
            暂无留言，来说两句吧～
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className="rounded-xl p-3 sm:p-3.5 transition-all duration-200 hover:shadow-sm"
              style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                  {m.nickname || '匿名访客'}
                </span>
                <span className="text-[10px] font-medium" style={{ color: '#cbd5e1' }}>
                  {timeAgo(m.created_at)}
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#475569' }}>
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
            className="px-2.5 py-1.5 rounded-lg bg-white border text-xs transition-all duration-200 hover:bg-slate-50 disabled:opacity-40"
            style={{ borderColor: 'var(--border)', color: '#9ca3af' }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>
            {page} / {totalPages}
          </span>
          <button
            className="px-2.5 py-1.5 rounded-lg bg-white border text-xs transition-all duration-200 hover:bg-slate-50 disabled:opacity-40"
            style={{ borderColor: 'var(--border)', color: '#9ca3af' }}
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
