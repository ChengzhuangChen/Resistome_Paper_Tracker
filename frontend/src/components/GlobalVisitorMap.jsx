import { useEffect, useRef, useState } from 'react'
import { fetchVisitorMap } from '../api'
import { Globe } from 'lucide-react'

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
    if (loading || !chartRef.current || data.length === 0) return
    let disposed = false

    const initChart = async () => {
      const echarts = await import('echarts')
      if (disposed) return

      try {
        const resp = await fetch('/world.json')
        const worldJson = await resp.json()
        echarts.registerMap('world', worldJson)
      } catch {
        return
      }

      if (!chartRef.current || disposed) return
      const instance = echarts.init(chartRef.current, null, { renderer: 'canvas' })
      chartInstance.current = instance

      const countryCounts = {}
      data.forEach((loc) => {
        countryCounts[loc.country] = (countryCounts[loc.country] || 0) + loc.count
      })

      const mapData = Object.entries(countryCounts).map(([name, value]) => ({ name, value }))
      const maxCount = Math.max(...Object.values(countryCounts), 1)

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
            if (params.value) {
              return `${params.name}<br/>${params.value} 次访问`
            }
            return params.name
          },
        },
        visualMap: {
          min: 0,
          max: maxCount,
          left: 'left',
          bottom: 'bottom',
          show: false,
          inRange: {
            color: ['#e5e7eb', '#bfdbfe', '#93c5fd', '#60a5fa', '#2563eb'],
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
            label: { show: false },
          },
        },
        series: [
          {
            type: 'map',
            map: 'world',
            roam: false,
            zoom: 1.2,
            data: mapData,
            label: { show: false },
            itemStyle: {
              borderColor: '#d1d5db',
              borderWidth: 0.5,
            },
            emphasis: {
              itemStyle: { areaColor: '#93c5fd' },
              label: { show: false },
            },
          },
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
              color: '#ef4444',
              shadowBlur: 10,
              shadowColor: '#ef4444',
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
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <Globe className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        全球访客分布
      </h3>
      <div className="w-full" style={{ minHeight: 260 }}>
        {loading ? (
          <div className="flex items-center justify-center h-64 text-xs" style={{ color: 'var(--muted)' }}>
            加载中...
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-xs gap-3" style={{ color: 'var(--muted)' }}>
            <Globe className="w-12 h-12 opacity-20" />
            <div className="text-center">
              <div className="font-medium mb-1">访客数据待更新</div>
              <div className="opacity-60">目标用户分布示意将在有数据后自动展示</div>
            </div>
          </div>
        ) : (
          <div ref={chartRef} className="w-full h-64" />
        )}
      </div>
    </div>
  )
}
