import { useState } from 'react'
import Configurator from './components/Configurator.jsx'
import Canvas from './components/Canvas.jsx'
import History from './components/History.jsx'
import './App.css'

export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('design')

  async function handleGenerate(config) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
      setHistory(prev => [{ ...data, config, id: Date.now() }, ...prev.slice(0, 19)])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectHistory(entry) {
    setResult({ imageB64: entry.imageB64, prompt: entry.prompt })
    setActiveTab('design')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-gem">◆</span>
          <span className="logo-text">Kundan Designer</span>
        </div>
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'design' ? 'active' : ''}`}
            onClick={() => setActiveTab('design')}
          >
            Design
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
            {history.length > 0 && <span className="badge">{history.length}</span>}
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'design' && (
          <div className="design-layout">
            <aside className="sidebar">
              <Configurator onGenerate={handleGenerate} loading={loading} />
            </aside>
            <section className="canvas-area">
              <Canvas result={result} loading={loading} error={error} />
            </section>
          </div>
        )}
        {activeTab === 'history' && (
          <History entries={history} onSelect={handleSelectHistory} />
        )}
      </main>
    </div>
  )
}
