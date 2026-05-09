export default function DonateCard() {
  return (
    <div
      className="hidden md:flex flex-col items-center gap-3"
      style={{
        position: 'fixed',
        right: 24,
        top: 140,
        transform: 'none',
        zIndex: 50,
        width: 160,
        padding: 16,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      <img
        src="/qrcode.png"
        alt="收款码"
        style={{ width: '100%', height: 'auto', borderRadius: 8 }}
      />
      <p style={{ color: '#999', fontSize: 12, textAlign: 'center', lineHeight: 1.4, whiteSpace: 'nowrap' }}>
        覆盖模型成本，感谢老板🙏
      </p>
    </div>
  )
}
