import { FaBook, FaPlusCircle, FaCalendarAlt, FaTrophy, FaFlask } from 'react-icons/fa'

const cards = [
  { key: 'total_count', label: '总文献数', icon: FaBook, color: '#2563eb' },
  { key: 'today_new_count', label: '今日新增', icon: FaPlusCircle, color: '#059669' },
  { key: 'this_month', label: '本月新增', icon: FaCalendarAlt, color: '#0891b2' },
  { key: 'top_ratio', label: 'Top期刊占比', icon: FaTrophy, color: '#d97706', fmt: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'subjects_count', label: '学科覆盖数', icon: FaFlask, color: '#7c3aed', fmt: (v) => v },
  { key: 'cns_ratio', label: 'CNS期刊占比', icon: FaTrophy, color: '#dc2626', fmt: (v) => `${(v * 100).toFixed(1)}%` },
]

export default function StatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 my-2">
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
            className="bg-white rounded-lg shadow-sm py-1.5 px-2.5 flex items-center gap-2"
          >
            <c.icon className="text-base" style={{ color: c.color }} />
            <div>
              <div className="text-base font-bold" style={{ color: 'var(--text)' }}>{value}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{c.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
