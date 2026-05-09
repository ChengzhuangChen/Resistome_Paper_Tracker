import { useEffect, useRef, useState } from 'react'
import { Globe, X, Users } from 'lucide-react'

export default function VisitorMap({ onClose }) {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { fetchVisitorStats } = await import('../api')
        const res = await fetchVisitorStats()
        setStats(res.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!stats || !chartRef.current) return
    let disposed = false

    const initChart = async () => {
      const echarts = await import('echarts')
      if (disposed) return

      // Register world map
      try {
        const resp = await fetch('/world.json')
        const worldJson = await resp.json()
        echarts.registerMap('world', worldJson)
      } catch {
        // Fallback: no map data
      }

      if (!chartRef.current) return
      const instance = echarts.init(chartRef.current, null, { renderer: 'canvas' })
      chartInstance.current = instance

      const coords = stats.coordinates || []
      const scatterData = coords.map((c) => ({
        name: c.country || '',
        value: [c.lng, c.lat, 1],
      }))

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            if (params.seriesType === 'effectScatter') {
              return `${params.name || 'Unknown'} ${params.data.value[1].toFixed(2)}, ${params.data.value[0].toFixed(2)}`
            }
            return params.name
          },
        },
        geo: {
          map: 'world',
          roam: true,
          zoom: 1.2,
          label: { show: false },
          itemStyle: {
            areaColor: '#e5e7eb',
            borderColor: '#d1d5db',
          },
          emphasis: {
            itemStyle: { areaColor: '#cbd5e1' },
          },
        },
        series: [
          {
            type: 'effectScatter',
            coordinateSystem: 'geo',
            data: scatterData,
            symbolSize: 8,
            showEffectOn: 'render',
            rippleEffect: {
              brushType: 'stroke',
              scale: 3,
            },
            itemStyle: {
              color: '#2563eb',
              shadowBlur: 10,
              shadowColor: '#2563eb',
            },
          },
        ],
      }

      instance.setOption(option)

      const resize = () => instance.resize()
      window.addEventListener('resize', resize)

      return () => {
        window.removeEventListener('resize', resize)
      }
    }

    const cleanup = initChart()

    return () => {
      disposed = true
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [stats])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>访客分布</h3>
          </div>
          <button onClick={onClose} style={{ color: '#9ca3af' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats bar */}
        {!loading && stats && (
          <div className="flex items-center gap-6 px-6 py-3 text-xs" style={{ borderBottom: '1px solid var(--border)', background: '#f9fafb' }}>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--muted)' }}>总访客：</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{stats.total_visitors}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: 'var(--muted)' }}>今日：</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{stats.today_visitors}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: 'var(--muted)' }}>覆盖国家/地区：</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{stats.countries?.length || 0}</span>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="flex-1 min-h-[400px] relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: 'var(--muted)' }}>
              加载中...
            </div>
          ) : (
            <div ref={chartRef} className="w-full h-full" style={{ minHeight: 400 }} />
          )}
        </div>

        {/* Country list */}
        {!loading && stats?.countries?.length > 0 && (
          <div className="px-6 py-3 overflow-x-auto" style={{ borderTop: '1px solid var(--border)', maxHeight: 120 }}>
            <div className="flex flex-wrap gap-2">
              {stats.countries.slice(0, 20).map((c) => (
                <span
                  key={c.code}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                  style={{ background: 'var(--accent-l)', color: 'var(--accent)' }}
                >
                  {c.name}
                  <span className="opacity-60">({c.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
