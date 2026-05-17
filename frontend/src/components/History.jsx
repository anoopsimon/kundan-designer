import './History.css'

export default function History({ entries, onSelect }) {
  if (entries.length === 0) {
    return (
      <div className="history-empty">
        <p className="empty-title">No designs yet</p>
        <p className="empty-sub">Generated designs will appear here</p>
      </div>
    )
  }

  return (
    <div className="history-wrap">
      <div className="history-header">
        <span className="history-title">Design history</span>
        <span className="history-count">{entries.length} designs</span>
      </div>
      <div className="history-grid">
        {entries.map(entry => (
          <button
            key={entry.id}
            className="history-card"
            onClick={() => onSelect(entry)}
          >
            <div className="history-img-wrap">
              <img
                src={`data:image/png;base64,${entry.imageB64}`}
                alt="Design"
                className="history-img"
              />
            </div>
            <div className="history-info">
              <span className="history-piece">{entry.config?.pieceType || 'Design'}</span>
              <span className="history-style">{entry.config?.style} · {entry.config?.metal}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
