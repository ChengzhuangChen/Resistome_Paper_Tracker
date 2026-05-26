import { useEffect, useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, ReferenceLine, LabelList,
} from 'recharts'
import { fetchTrend, fetchYearly, fetchMonthly } from '../api'
import WordCloudSection from './WordCloudSection'
import GuestbookSection from './GuestbookSection'

const COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#dc2626', '#4b5563']

function ChartCard({ title, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 ${className}`}
      style={{ background: '#fff', boxShadow: 'var(--shadow-md)' }}
    >
      <h3 className="text-sm font-bold mb-5 flex items-center gap-2 tracking-wide" style={{ color: '#374151' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-48 text-xs" style={{ color: '#9ca3af' }}>
      暂无数据
    </div>
  )
}

function TrendTooltip({ active, payload, label, data }) {
  if (!active || !payload?.length) return null
  const count = payload[0].value
  const idx = data.findIndex(d => d.date === label)
  const prevCount = idx > 0 ? data[idx - 1].count : null
  let changeText = ''
  if (prevCount !== null) {
    if (prevCount === 0) {
      changeText = '环比：前日无数据'
    } else {
      const change = ((count - prevCount) / prevCount * 100).toFixed(1)
      const sign = change > 0 ? '+' : ''
      changeText = `环比：${sign}${change}%`
    }
  }
  return (
    <div style={{ background: '#fff', border: '1px solid #e8eaef', borderRadius: 12, padding: '10px 14px', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#111827' }}>{label}</div>
      <div style={{ color: '#374151' }}>新增文献：{count} 篇</div>
      {changeText && <div style={{ color: '#9ca3af', marginTop: 4, fontSize: 11 }}>{changeText}</div>}
    </div>
  )
}

export default function ChartsSection({ stats, onKeywordClick }) {
  const [trend, setTrend] = useState(null)
  const [yearly, setYearly] = useState(null)
  const [monthly, setMonthly] = useState(null)
  const [loading, setLoading] = useState(true)
  const [highlightYear, setHighlightYear] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [tRes, yRes, mRes] = await Promise.all([
          fetchTrend(30),
          fetchYearly(),
          fetchMonthly(),
        ])
        if (!cancelled) {
          setTrend(tRes.data)
          setYearly(yRes.data)
          setMonthly(mRes.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const subjectData = stats?.subjects_distribution
    ? Object.entries(stats.subjects_distribution).map(([name, value]) => ({ name, value }))
    : []

  const trendData = useMemo(() => {
    return trend?.dates?.map((d, i) => ({
      date: d.slice(5),
      count: trend.counts[i] || 0,
    })) || []
  }, [trend])

  const yearlyData = useMemo(() => {
    return yearly?.years?.map((y, i) => ({
      year: String(y),
      count: yearly.counts[i] || 0,
    })) || []
  }, [yearly])

  const monthlyData = useMemo(() => {
    return monthly?.months?.map((m, i) => ({
      month: m.slice(5),
      fullMonth: m,
      count: monthly.counts[i] || 0,
    })) || []
  }, [monthly])

  const avgCount = useMemo(() => {
    if (trendData.length === 0) return 0
    return trendData.reduce((sum, d) => sum + d.count, 0) / trendData.length
  }, [trendData])

  const currentMonth = new Date().getMonth() + 1
  const yearLabel = `截至${currentMonth}月`

  return (
    <div className="space-y-5">
      {/* Row 1: Trend line chart */}
      <ChartCard title="近30天发文趋势">
        {loading ? <EmptyState /> : trendData.length === 0 ? <EmptyState /> : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                label={{ value: '新增文献数', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 11, fill: '#cbd5e1' } }}
              />
              <Tooltip content={<TrendTooltip data={trendData} />} />
              <ReferenceLine
                y={avgCount}
                stroke="#e2e8f0"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{ value: `均值 ${avgCount.toFixed(1)}`, position: 'right', fill: '#9ca3af', fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Row 2: Subject + WordCloud */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="学科分布">
          {subjectData.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={subjectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {subjectData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e8eaef', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <WordCloudSection onWordClick={onKeywordClick} />
      </div>

      {/* Row 3: Monthly + Yearly + Guestbook */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="月度文献数量">
          {monthlyData.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#93c5fd" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e8eaef', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                  formatter={(v) => [v, '文献数']}
                  cursor={{ fill: '#f8fafc', radius: 4 }}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                >
                  <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} />
                  {monthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={highlightYear && entry.fullMonth.startsWith(highlightYear) ? '#2563eb' : 'url(#monthlyGradient)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="年度文献数量">
          {yearlyData.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={yearlyData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e8eaef', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                  formatter={(v) => [v, '文献数']}
                  cursor={{ fill: '#f8fafc', radius: 4 }}
                />
                <Bar
                  dataKey="count"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                  onClick={(data) => setHighlightYear(prev => prev === data.year ? null : data.year)}
                  style={{ cursor: 'pointer' }}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                    content={(props) => {
                      const { x, y, width, value, index } = props
                      const cx = (x || 0) + (width || 0) / 2
                      const isLast = index === yearlyData.length - 1
                      return (
                        <g>
                          <text x={cx} y={y - 5} textAnchor="middle" fill="#9ca3af" fontSize={11} fontWeight={600}>{value}</text>
                          {isLast && (
                            <text x={cx} y={y - 18} textAnchor="middle" fill="#cbd5e1" fontSize={10}>{yearLabel}</text>
                          )}
                        </g>
                      )
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <GuestbookSection />
      </div>
    </div>
  )
}
