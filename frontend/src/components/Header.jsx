import { useState } from 'react'
import { Dna, RefreshCw, Globe, ClipboardList, Mail, MessageCircle } from 'lucide-react'
import { triggerUpdate } from '../api'

export default function Header({ stats, onUpdateSuccess, onShowVisitorMap, onShowLogs }) {
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

  return (
    <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}
              >
                <Dna className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                  ARGs 相关文献前沿追踪
                </h1>
                <span
                  className="text-[11px] px-2.5 py-1 rounded-full font-semibold tracking-wide"
                  style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                >
                  Antibiotic Resistance Genes Tracker
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              <p>
                <span className="font-semibold" style={{ color: 'var(--accent)' }}>ARGs相关文献前沿追踪</span>
                是一个每日自动更新的学术文献监测与展示平台，专注于
                <span className="font-medium" style={{ color: 'var(--text)' }}>抗生素耐药基因（Antibiotic Resistance Genes, ARGs）</span>
                领域的最新研究进展。
              </p>

              <div>
                <p className="font-semibold text-xs mb-0.5" style={{ color: 'var(--accent)' }}>数据来源与覆盖</p>
                <p className="text-xs">
                  本平台通过 NCBI Entrez API 每日自动检索 PubMed 数据库，检索策略覆盖
                  <span className="font-medium" style={{ color: 'var(--text)' }}>resistome*</span>、
                  <span className="font-medium" style={{ color: 'var(--text)' }}>antibiotics resistance gene*</span>
                  等相关关键词，确保全面追踪领域前沿动态。
                </p>
              </div>

              <div>
                <p className="font-semibold text-xs mb-0.5" style={{ color: 'var(--accent)' }}>AI 智能提炼</p>
                <p className="text-xs">
                  文献抓取后，通过 <span className="font-medium" style={{ color: 'var(--text)' }}>DeepSeek-v4-flash</span> 自动提取并生成以下中文核心信息，帮助您快速把握文献要点：中文摘要（核心要点提炼，150字以内）、研究方法、研究对象、主要创新点与结论、样本来源与学科分类。
                </p>
              </div>

              <div>
                <p className="font-semibold text-xs mb-0.5" style={{ color: 'var(--accent)' }}>多维筛选</p>
                <p className="text-xs">
                  平台支持按 JCR 分区、影响因子（IF）、中科院分区、Top 期刊、CNS 子刊、学科分类、文献类型及发表时间等多维度筛选，助您高效定位高质量研究。
                </p>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
                <span className="font-medium" style={{ color: '#ef4444' }}>⚠️ 重要提示</span>：文献的中文摘要及提炼字段均由 AI 自动生成，可能存在错误或遗漏。所有结论请务必查阅原始文献核实，AI 提炼内容仅供学术参考，不可直接作为科研引用依据。
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>如有建议或合作意向，欢迎联系：</span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                  <Mail className="w-3 h-3" />
                  Email: chenchengzhuang@westlake.edu.com
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
                  <MessageCircle className="w-3 h-3" />
                  Wechat：Superhero_2025
                </span>
              </div>
            </div>

            {message && (
              <div className="mt-3 text-xs px-3 py-2 rounded-md" style={{ background: '#f9fafb', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                {message}
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onShowLogs}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all border"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--muted)',
                  borderColor: 'var(--border)',
                }}
                title="更新日志"
              >
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">日志</span>
              </button>
              <button
                onClick={onShowVisitorMap}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all border"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--muted)',
                  borderColor: 'var(--border)',
                }}
                title="访客分布"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">访客</span>
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  background: updating ? '#e5e7eb' : 'var(--accent)',
                  color: updating ? 'var(--muted)' : '#fff',
                  boxShadow: updating ? 'none' : '0 1px 3px rgba(37,99,235,.3)',
                }}
              >
                <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
                {updating ? '更新中...' : '手动更新'}
              </button>
            </div>

            <div className="flex flex-col items-center gap-1.5" style={{ width: 320 }}>
              <img
                src="/onehealth.png"
                alt="One Health"
                className="border"
                style={{ width: '100%', height: 'auto', borderRadius: 10, borderColor: 'var(--border)', padding: 6, background: '#fff' }}
              />
              <a
                href="https://aboutsmallruminants.com/antimicrobial-resistance-one-health/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] hover:underline"
                style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}
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
