import { useEffect, useState, useCallback } from 'react'
import ReactWordcloud from 'react-wordcloud'
import { fetchKeywords } from '../api'
import { Cloud, Copy, Check } from 'lucide-react'

const COLORS = ['#1e3a8a', '#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-48 text-xs" style={{ color: 'var(--muted)' }}>
      暂无数据
    </div>
  )
}

export default function WordCloudSection({ onWordClick }) {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [hoveredWord, setHoveredWord] = useState(null)

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
    fontSizes: [12, 36],
    fontFamily: '"Inter", "PingFang SC", "Microsoft YaHei", sans-serif',
    padding: 6,
    scale: 'sqrt',
    spiral: 'rectangular',
    deterministic: true,
    enableTooltip: true,
    colors: COLORS,
    transitionDuration: 500,
  }

  const callbacks = {
    onWordClick: onWordClick ? (word) => onWordClick(word.text) : undefined,
    onWordMouseOver: (word) => setHoveredWord(word),
    onWordMouseOut: () => setHoveredWord(null),
  }

  const handleCopy = async () => {
    if (words.length === 0) return
    const text = words.map((w) => w.text).join('、')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error(e)
    }
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
        <div className="relative">
          <div className="w-full" style={{ height: 220, position: 'relative', zIndex: 1 }}>
            <ReactWordcloud words={words} options={options} callbacks={callbacks} />
          </div>
          {hoveredWord && (
            <div
              className="absolute z-10 bg-gray-800 text-white text-xs rounded-md px-2.5 py-1.5 shadow-lg pointer-events-none"
              style={{
                left: '50%',
                bottom: 8,
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
              }}
            >
              {hoveredWord.text}：{hoveredWord.value} 篇文献
            </div>
          )}
          <button
            onClick={handleCopy}
            className="mt-3 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-gray-50"
            style={{
              borderColor: 'var(--border)',
              color: copied ? '#059669' : 'var(--muted)',
            }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已复制' : '一键复制关键词'}
          </button>
        </div>
      )}
    </div>
  )
}
