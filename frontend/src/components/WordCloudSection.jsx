import { useEffect, useState, useCallback } from 'react'
import ReactWordcloud from 'react-wordcloud'
import { fetchKeywords } from '../api'
import { Cloud } from 'lucide-react'

const COLORS = ['#1e40af', '#3b82f6', '#93c5fd']

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-48 text-xs" style={{ color: 'var(--muted)' }}>
      暂无数据
    </div>
  )
}

export default function WordCloudSection() {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetchKeywords({ limit: 50 })
      const items = res.data?.keywords || []
      setWords(items.map((k) => ({ text: k.text, value: k.value })))
    } catch (e) {
      console.error(e)
      setWords([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const options = {
    rotations: 0,
    rotationAngles: [0, 0],
    fontSizes: [12, 32],
    fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
    padding: 4,
    scale: 'sqrt',
    spiral: 'rectangular',
    deterministic: true,
    enableTooltip: true,
    colors: COLORS,
    transitionDuration: 500,
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}
    >
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <Cloud className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        研究热点词云
      </h3>
      {loading ? (
        <EmptyState />
      ) : words.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ height: 260, position: 'relative', zIndex: 1 }}>
          <ReactWordcloud words={words} options={options} />
        </div>
      )}
    </div>
  )
}
