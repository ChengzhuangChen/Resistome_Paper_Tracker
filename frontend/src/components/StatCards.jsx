import { FaBook, FaPlusCircle, FaCalendarAlt, FaTrophy, FaFlask } from 'react-icons/fa'

const cards = [
  {
    key: 'total_count',
    label: '总文献数',
    icon: FaBook,
    color: '#2563eb',
    tooltip: '已收录的耐药组领域文献总数',
    isMain: true,
  },
  {
    key: 'today_new_count',
    label: '今日新增',
    icon: FaPlusCircle,
    color: '#059669',
    tooltip: '今日新收录的文献数量',
  },
  {
    key: 'this_month',
    label: '本月新增',
    icon: FaCalendarAlt,
    color: '#0891b2',
    tooltip: '本月新收录的文献数量',
  },
  {
    key: 'top_ratio',
    label: 'Top期刊占比',
    icon: FaTrophy,
    color: '#d97706',
    fmt: (v) => `${(v * 100).toFixed(1)}%`,
    tooltip: 'Top期刊（IF≥10）的文献占比',
  },
  {
    key: 'subjects_count',
    label: '学科覆盖数',
    icon: FaFlask,
    color: '#7c3aed',
    fmt: (v) => v,
    tooltip: '已收录文献涵盖的学科类别数量',
  },
  {
    key: 'cns_ratio',
    label: 'CNS期刊占比',
    icon: FaTrophy,
    color: '#dc2626',
    fmt: (v) => `${(v * 100).toFixed(1)}%`,
    tooltip: 'Nature/Science/Cell及其子刊的文献占比',
  },
]

export default function StatCards({ stats }) {
  return (
    <div className="grid grid-cols-3 gap-3 my-1 md:grid-cols-6">
      {cards.map((c) => {
        let value = stats?.[c.key]
        if (c.key === 'subjects_count') {
          value = stats?.subjects_distribution ? Object.keys(stats.subjects_distribution).length : 0
        }
        if (value === undefined || value === null) value = '-'
        else if (c.fmt) value = c.fmt(value)

        return (
          <div
            key={c.key}
            className="bg-white rounded-2xl flex items-center gap-2.5 py-1.5 px-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-default"
            style={{ boxShadow: 'var(--shadow)' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${c.color}12` }}
            >
              <c.icon className="text-base shrink-0" style={{ color: c.color, opacity: 0.85 }} />
            </div>
            <div className="min-w-0 overflow-hidden">
              <div className="text-lg font-bold truncate tracking-tight leading-none mb-0.5" style={{ color: c.isMain ? c.color : 'var(--text)' }}>{value}</div>
              <span className="text-[11px] font-medium leading-tight" style={{ color: '#9ca3af' }}>{c.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
