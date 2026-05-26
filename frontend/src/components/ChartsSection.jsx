import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts'
import { fetchTrend, fetchYearly, fetchMonthly } from '../api'
import WordCloudSection from './WordCloudSection'
import GuestbookSection from './GuestbookSection'

const COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#dc2626', '#4b5563']

function ChartCard({ title, children, className = '' }) {
  return (
    <div
      className={`rounded-xl p-5 ${className}`}
      style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-48 text-xs" style={{ color: 'var(--muted)' }}>
      暂无数据
    </div>
  )
}

export default function ChartsSection({ stats }) {
  const [trend, setTrend] = useState(null)
  const [yearly, setYearly] = useState(null)
  const [monthly, setMonthly] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const trendData = trend?.dates?.map((d, i) => ({
    date: d.slice(5),
    count: trend.counts[i] || 0,
  })) || []

  const yearlyData = yearly?.years?.map((y, i) => ({
    year: String(y),
    count: yearly.counts[i] || 0,
  })) || []

  const monthlyData = monthly?.months?.map((m, i) => ({
    month: m.slice(5),
    count: monthly.counts[i] || 0,
  })) || []

  return (
    <div className="space-y-4">
      {/* Row 1: Trend line chart */}
      <ChartCard title="近30天发文趋势">
        {loading ? <EmptyState /> : trendData.length === 0 ? <EmptyState /> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v) => [v, '新增文献']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Row 2: Subject + WordCloud */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <WordCloudSection />
      </div>

      {/* Row 3: Monthly + Yearly + Guestbook */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="月度文献数量">
          {monthlyData.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v) => [v, '文献数']}
                  cursor={{ fill: '#f3f4f6', radius: 4 }}
                />
                <Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="年度文献数量">
          {yearlyData.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={yearlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v) => [v, '文献数']}
                  cursor={{ fill: '#f3f4f6', radius: 4 }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <GuestbookSection />
      </div>
    </div>
  )
}
