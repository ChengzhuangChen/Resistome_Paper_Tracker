import { useEffect, useRef, useState } from 'react'
import { fetchVisitorMap } from '../api'

export default function GlobalVisitorMap() {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetchVisitorMap()
        if (!cancelled) setData(res.data?.locations || [])
      } catch (e) {
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (loading || !chartRef.current) return
    let disposed = false

    const initChart = async () => {
      const echarts = await import('echarts')
      if (disposed) return

      try {
        const resp = await fetch('/world.json')
        const worldJson = await resp.json()
        echarts.registerMap('world', worldJson)
      } catch {
        // Fallback: no map data
        return
      }

      if (!chartRef.current || disposed) return
      const instance = echarts.init(chartRef.current, null, { renderer: 'canvas' })
      chartInstance.current = instance

      const scatterData = data.map((loc) => ({
        name: `${loc.country} · ${loc.city}`,
        value: [loc.longitude, loc.latitude, loc.count],
        count: loc.count,
      }))

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            if (params.seriesType === 'effectScatter') {
              return `${params.name}<br/>${params.data.count} 次访问`
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
            symbolSize: (val) => Math.max(4, Math.min(12, val[2] * 2 + 4)),
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
  }, [data, loading])

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>
        全球访客分布
      </h3>
      <div className="w-full" style={{ minHeight: 260 }}>
        {loading ? (
          <div className="flex items-center justify-center h-64 text-xs" style={{ color: 'var(--muted)' }}>
            加载中...
          </div>
        ) : (
          <div ref={chartRef} className="w-full h-64" />
        )}
        {!loading && data.length === 0 && (
          <div className="text-center text-xs mt-2" style={{ color: 'var(--muted)' }}>
            暂无访客数据
          </div>
        )}
      </div>
    </div>
  )
}
