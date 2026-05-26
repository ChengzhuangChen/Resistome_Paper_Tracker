import { useState } from 'react'
import { Dna, RefreshCw, Globe, ClipboardList } from 'lucide-react'
import { FaClipboardList } from 'react-icons/fa'
import { triggerUpdate } from '../api'

export default function Header({ onUpdateSuccess, onShowVisitorMap, onShowLogs, onShowUpdateFaq }) {
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')

  const handleUpdate = async () => {
    const token = prompt('请输入更新 Token：')
    if (!token) return
    setUpdating(true)
    setMessage('')
    try {
      const res = await triggerUpdate(token)
      const d = res.data
      let msg = `更新完成：抓取 ${d.fetched} 篇，新增 ${d.new} 篇，分析成功 ${d.enriched} 篇`
      if (d.failed && d.failed.length > 0) msg += `，${d.failed.length} 篇失败`
      setMessage(msg)
      onUpdateSuccess && onUpdateSuccess()
    } catch (e) {
      setMessage('更新失败：' + (e.response?.data?.detail || e.message))
    } finally {
      setUpdating(false)
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const topBtnClass =
    'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all border hover:shadow-sm'

  return (
    <header className="pt-2 pb-1">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6">
        <div
          className="rounded-2xl border overflow-hidden relative"
          style={{
            background: '#fff',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Top action buttons */}
          <div className="flex items-center justify-end gap-2 px-5 pt-0.5 pb-0.5 md:absolute md:top-0 md:right-0 md:z-10">
            <button
              onClick={onShowUpdateFaq}
              className={topBtnClass}
              style={{
                background: '#fff',
                color: 'var(--muted)',
                borderColor: 'var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.background = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = '#fff'
              }}
              title="更新与FAQ"
            >
              <FaClipboardList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">更新与FAQ</span>
            </button>
            <button
              onClick={onShowLogs}
              className={topBtnClass}
              style={{
                background: '#fff',
                color: 'var(--muted)',
                borderColor: 'var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.background = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = '#fff'
              }}
              title="更新日志"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">日志</span>
            </button>
            <button
              onClick={onShowVisitorMap}
              className={topBtnClass}
              style={{
                background: '#fff',
                color: 'var(--muted)',
                borderColor: 'var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.background = '#f8fafc'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = '#fff'
              }}
              title="访客分布"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">访客</span>
            </button>
            <button
              onClick={handleUpdate}
              disabled={updating}
              className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: updating ? '#e5e7eb' : 'var(--accent)',
                color: updating ? 'var(--muted)' : '#fff',
                boxShadow: updating ? 'none' : '0 2px 8px rgba(37,99,235,.25)',
              }}
              onMouseEnter={(e) => {
                if (!updating) e.currentTarget.style.background = 'var(--accent-d)'
              }}
              onMouseLeave={(e) => {
                if (!updating) e.currentTarget.style.background = 'var(--accent)'
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
              {updating ? '更新中...' : '手动更新'}
            </button>
          </div>

          {/* Main content: left + right */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 px-5 pb-0.5 pt-0 md:items-end">
            {/* Left column ~65% */}
            <div className="md:w-[65%] min-w-0">
              {/* Title row */}
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
                    boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
                  }}
                >
                  <Dna className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                  <h1
                    className="text-xl sm:text-2xl font-extrabold tracking-tight"
                    style={{
                      background: 'linear-gradient(90deg, #0e0e0fff, #0e0e0fff)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 1px 2px rgba(30,64,175,0.15))',
                    }}
                  >
                    耐药组领域相关文献前沿追踪
                  </h1>
                  <span className="text-xs sm:text-sm font-serif italic font-bold w-fit" style={{ color: '#ec0909ff' }}>
                    Resistome Literature Tracker
                  </span>
                </div>
              </div>

              {/* Full content sections */}
              <div className="space-y-1">
                <Section icon="📚" title="数据来源与更新">
                  文献数据源为 PubMed 官方数据库，检索策略覆盖resistome、antibiotic resistance gene、antimicrobial resistance gene 及其各类变体等相关关键词；目前收录了 2021 年 1 月 1 日起发表的论文，系统每日定时自动同步更新，保证前沿文献不遗漏。
                </Section>

                <Section icon="🤖" title="AI 智能内容提炼">
                  基于 DeepSeek‑v4‑flash 大模型，对每篇文献自动结构化提炼：精简中文核心摘要、研究方法、研究对象、核心创新点、主要研究结论、样本环境来源及学科分类，省去人工精读筛选成本。
                </Section>

                <Section icon="🔍" title="多维度智能筛选">
                  支持多条件组合筛选：JCR 分区、期刊影响因子、新锐期刊分区、Top 期刊、CNS 相关期刊、学科门类、文献类型、发表时间等，可自由组合快速定位高价值目标文献。
                </Section>

                <div className="rounded-lg p-2">
                  <h3 className="text-[13px] font-bold mb-1.5 flex items-center gap-1.5 tracking-wide" style={{ color: '#374151' }}>
                    <span>📮</span>
                    反馈与联系
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span>📧</span>
                      <span style={{ color: '#6b7280' }}>Email：</span>
                      <span className="font-mono font-medium text-blue-600 hover:underline">
                        chenchengzhuang@westlake.edu.cn
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>💬</span>
                      <span style={{ color: '#6b7280' }}>Wechat：</span>
                      <span className="font-medium text-gray-700">Superhero_2025</span>
                    </div>
                  </div>
                </div>

                <Section icon="⚠️" title="免责温馨提示" italic>
                  本平台所有中文摘要、结构化提炼内容均由人工智能自动生成，可能存在表述偏差、信息遗漏或理解误差，仅作学术查阅参考。
                </Section>
              </div>

              {message && (
                <div
                  className="mt-2 text-xs px-4 py-2.5 rounded-xl"
                  style={{ background: '#f8fafc', border: '1px solid var(--border)', color: 'var(--muted)' }}
                >
                  {message}
                </div>
              )}
            </div>

            {/* Right column ~35% */}
            <div className="hidden md:flex md:w-[35%] flex-col items-center justify-start shrink-0">
              <div
                className="rounded-2xl border overflow-hidden w-full"
                style={{
                  borderColor: 'var(--border)',
                  background: '#fff',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <img
                  src="/onehealth.png"
                  alt="One Health"
                  className="w-3/4 h-auto object-contain mx-auto"
                  style={{ padding: 10 }}
                />
              </div>
              <a
                href="https://aboutsmallruminants.com/antimicrobial-resistance-one-health/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] hover:underline mt-2 whitespace-nowrap"
                style={{ color: 'var(--muted)' }}
              >
                来源：https://aboutsmallruminants.com/antimicrobial-resistance-one-health/
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function Section({ icon, title, children, italic }) {
  return (
    <div>
      <h3 className="text-[13px] font-bold mb-0.5 flex items-center gap-1.5 tracking-wide" style={{ color: '#374151' }}>
        <span>{icon}</span>
        {title}
      </h3>
      <p className={`text-xs leading-relaxed ${italic ? 'italic' : ''}`} style={{ color: '#6b7280' }}>
        {children}
      </p>
    </div>
  )
}
