import { useEffect, useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps'
import { fetchVisitorMap } from '../api'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export default function GlobalVisitorMap() {
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

  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 1

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>
        全球访客分布
      </h3>
      <div className="w-full" style={{ minHeight: 320 }}>
        {loading ? (
          <div className="flex items-center justify-center h-80 text-xs" style={{ color: 'var(--muted)' }}>
            加载中...
          </div>
        ) : (
          <ComposableMap
            projection="geoEqualEarth"
            projectionConfig={{ scale: 140, center: [0, 20] }}
            style={{ width: '100%', height: 'auto' }}
          >
            <ZoomableGroup>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#e5e7eb"
                      stroke="#d1d5db"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none', fill: '#cbd5e1' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>
              {data.map((loc, i) => {
                const r = Math.max(3, Math.min(10, (loc.count / maxCount) * 7 + 3))
                return (
                  <Marker key={i} coordinates={[loc.longitude, loc.latitude]}>
                    <circle
                      r={r}
                      fill="#2563eb"
                      fillOpacity={0.5}
                      stroke="#2563eb"
                      strokeWidth={1}
                    />
                    <title>{`${loc.country} · ${loc.city} · ${loc.count} 次访问`}</title>
                  </Marker>
                )
              })}
            </ZoomableGroup>
          </ComposableMap>
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
