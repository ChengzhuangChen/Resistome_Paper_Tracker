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

  return (
    <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}
              >
                <Dna className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                  耐药组领域相关文献追踪
                </h1>
                <span
                  className="text-[11px] px-2.5 py-1 rounded-full font-semibold tracking-wide"
                  style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                >
                  Resistome Literature Tracker
                </span>
              </div>
            </div>

            <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--muted)' }}>
              专为耐药组领域科研人员打造的前沿文献监测工具，每日自动更新，一站式追踪 2024 年以来领域最新研究成果。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <span>📚</span> 数据来源与更新
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  数据源为 PubMed 官方数据库，采用专业检索策略，精准匹配耐药基因组、抗生素抗性基因相关主题文献；仅收录 2024 年 1 月 1 日起发表的论文，系统每日定时自动同步更新，保证前沿文献不遗漏。
                </p>
              </div>

              <div className="rounded-xl border p-4 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <span>🤖</span> AI 智能内容提炼
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  基于 DeepSeek‑v4‑flash 大模型，对每篇文献自动结构化提炼：精简中文核心摘要、研究方法、研究对象、核心创新点、主要研究结论、样本环境来源及学科分类，省去人工精读筛选成本。
                </p>
              </div>

              <div className="rounded-xl border p-4 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <span>🔍</span> 多维度智能筛选
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  支持多条件组合筛选：JCR 分区、期刊影响因子、新锐期刊分区、Top 期刊、CNS 期刊、学科门类、文献类型、发表时间等，可自由组合快速定位高价值目标文献。
                </p>
              </div>

              <div className="rounded-xl border p-4 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <span>⚠️</span> 免责温馨提示
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  本平台所有中文摘要、结构化提炼内容均由人工智能自动生成，可能存在表述偏差、信息遗漏或理解误差，仅作学术查阅参考。科研写作、论文引用、学术结论请务必查阅原文全文进行核对，请勿直接将 AI 提炼内容作为正式引用依据。
                </p>
              </div>

              <div className="rounded-xl border p-4 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <span>🔬</span> 平台背景说明
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  本工具面向环境微生物、耐药组、生态健康相关研究者免费提供文献追踪服务。
                </p>
              </div>

              <div className="rounded-xl border p-4 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <span>📮</span> 反馈与合作联系
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  如有功能优化建议、使用问题反馈，可通过以下方式联系：<br />
                  邮箱：chenchengzhuang@westlake.edu.cn; chengzhuangchen@gmail.com<br />
                  微信：Superhero_2025
                </p>
              </div>
            </div>

            {message && (
              <div className="mt-3 text-xs px-3 py-2 rounded-md" style={{ background: '#f9fafb', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                {message}
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-4 shrink-0 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-auto justify-end md:justify-start">
              <button
                onClick={onShowUpdateFaq}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all border"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--muted)',
                  borderColor: 'var(--border)',
                }}
                title="更新与FAQ"
              >
                <FaClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">更新与FAQ</span>
              </button>
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
                className="hidden sm:flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-all"
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

            <div className="hidden md:flex flex-col items-center gap-1.5" style={{ width: 320 }}>
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
