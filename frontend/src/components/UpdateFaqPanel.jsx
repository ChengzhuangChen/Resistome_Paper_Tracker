import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { platformUpdates, faqList } from '../data/platformUpdates'

export default function UpdateFaqPanel({ onClose }) {
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col"
        style={{ background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            更新与FAQ
          </h3>
          <button onClick={onClose} style={{ color: '#9ca3af' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-8">
          {/* Updates Timeline */}
          <div>
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span>📝</span> 平台更新日志
            </h4>
            <div className="relative pl-4">
              <div className="absolute left-[5px] top-2 bottom-2 w-px" style={{ background: 'var(--border)' }} />
              {platformUpdates.map((item, idx) => (
                <div key={idx} className="relative mb-4 last:mb-0">
                  <div
                    className="absolute -left-[11px] top-1.5 w-2.5 h-2.5 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                  <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--accent)' }}>
                    {item.date}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text)' }}>
                    {item.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Accordion */}
          <div>
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span>❓</span> 常见问题
            </h4>
            <div className="space-y-2">
              {faqList.map((item, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div
                    key={idx}
                    className="rounded-lg border overflow-hidden"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors"
                      style={{
                        background: isOpen ? 'var(--accent-l)' : 'var(--surface)',
                        color: 'var(--text)',
                      }}
                    >
                      <span>Q: {item.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div
                        className="px-4 py-3 text-sm leading-relaxed"
                        style={{ color: 'var(--muted)', background: 'var(--surface)' }}
                      >
                        A: {item.answer}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
