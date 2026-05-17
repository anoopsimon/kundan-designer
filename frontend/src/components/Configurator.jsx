import { useState } from 'react'
import './Configurator.css'

const PIECE_TYPES = [
  { value: 'tikka',    label: 'Maang Tikka' },
  { value: 'jhumka',   label: 'Jhumka' },
  { value: 'nath',     label: 'Nath' },
  { value: 'choker',   label: 'Kundan Choker' },
  { value: 'necklace', label: 'Necklace Set' },
  { value: 'haar',     label: 'Long Haar' },
  { value: 'bangles',  label: 'Bangles' },
  { value: 'payal',    label: 'Payal' },
]

const METALS = [
  { value: 'gold',     label: '22k Gold' },
  { value: 'silver',   label: 'Oxidised Silver' },
  { value: 'rosegold', label: 'Rose Gold' },
  { value: 'antique',  label: 'Antique Gold' },
  { value: 'platinum', label: 'White Gold' },
]

const STYLES = [
  { value: 'kundan',    label: 'Kundan' },
  { value: 'meenakari', label: 'Meenakari' },
  { value: 'polki',     label: 'Polki' },
  { value: 'temple',    label: 'Temple' },
  { value: 'oxidised',  label: 'Oxidised' },
  { value: 'plain',     label: 'Plain Metal' },
]

const STONES = [
  { value: 'ruby',     label: 'Ruby', color: '#c0392b' },
  { value: 'emerald',  label: 'Emerald', color: '#1e8449' },
  { value: 'sapphire', label: 'Sapphire', color: '#1a5276' },
  { value: 'pearl',    label: 'Pearl', color: '#d5cfc4' },
  { value: 'diamond',  label: 'Diamond', color: '#e8e4dc' },
  { value: 'coral',    label: 'Coral', color: '#d35400' },
  { value: 'turquoise',label: 'Turquoise', color: '#148f77' },
  { value: 'onyx',     label: 'Onyx', color: '#1c1c1c' },
]

const ARRANGEMENTS = [
  { value: 'single',    label: 'Single centre' },
  { value: 'cluster',   label: 'Cluster' },
  { value: 'border',    label: 'Stone border' },
  { value: 'fullset',   label: 'Fully set' },
  { value: 'scattered', label: 'Scattered' },
]

const DEFAULT = {
  pieceType: 'tikka',
  metal: 'gold',
  style: 'kundan',
  stones: ['ruby', 'emerald'],
  arrangement: 'single',
  extraPrompt: '',
}

export default function Configurator({ onGenerate, loading }) {
  const [config, setConfig] = useState(DEFAULT)

  function set(key, value) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  function toggleStone(stone) {
    setConfig(prev => {
      const has = prev.stones.includes(stone)
      return {
        ...prev,
        stones: has
          ? prev.stones.filter(s => s !== stone)
          : [...prev.stones, stone],
      }
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    onGenerate(config)
  }

  return (
    <form className="configurator" onSubmit={handleSubmit}>
      <div className="cfg-section">
        <div className="cfg-label">Jewellery type</div>
        <div className="piece-grid">
          {PIECE_TYPES.map(p => (
            <button
              key={p.value}
              type="button"
              className={`piece-btn ${config.pieceType === p.value ? 'active' : ''}`}
              onClick={() => set('pieceType', p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cfg-section">
        <div className="cfg-label">Metal finish</div>
        <div className="option-row">
          {METALS.map(m => (
            <button
              key={m.value}
              type="button"
              className={`option-btn ${config.metal === m.value ? 'active' : ''}`}
              onClick={() => set('metal', m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cfg-section">
        <div className="cfg-label">Style</div>
        <div className="option-row">
          {STYLES.map(s => (
            <button
              key={s.value}
              type="button"
              className={`option-btn ${config.style === s.value ? 'active' : ''}`}
              onClick={() => set('style', s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cfg-section">
        <div className="cfg-label">Gemstones</div>
        <div className="stone-grid">
          {STONES.map(s => (
            <button
              key={s.value}
              type="button"
              className={`stone-btn ${config.stones.includes(s.value) ? 'active' : ''}`}
              onClick={() => toggleStone(s.value)}
            >
              <span className="stone-dot" style={{ background: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cfg-section">
        <div className="cfg-label">Stone arrangement</div>
        <div className="option-row">
          {ARRANGEMENTS.map(a => (
            <button
              key={a.value}
              type="button"
              className={`option-btn ${config.arrangement === a.value ? 'active' : ''}`}
              onClick={() => set('arrangement', a.value)}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cfg-section">
        <div className="cfg-label">Extra details (optional)</div>
        <textarea
          className="extra-input"
          placeholder="e.g. bridal style, peacock motif, temple border..."
          value={config.extraPrompt}
          onChange={e => set('extraPrompt', e.target.value)}
          rows={2}
        />
      </div>

      <div className="cfg-footer">
        <button type="submit" className="generate-btn" disabled={loading}>
          {loading ? (
            <><span className="spinner" /> Generating…</>
          ) : (
            <><span className="btn-gem">◆</span> Generate Design</>
          )}
        </button>
      </div>
    </form>
  )
}
