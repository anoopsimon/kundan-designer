import './Canvas.css'

export default function Canvas({ result, loading, error }) {
  function downloadPNG() {
    if (!result?.imageB64) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${result.imageB64}`
    link.download = `kundan-design-${Date.now()}.png`
    link.click()
  }

  return (
    <div className="canvas-wrap">
      {loading && (
        <div className="canvas-state">
          <div className="gen-spinner" />
          <p className="state-title">Generating your design…</p>
          <p className="state-sub">This takes about 15–30 seconds</p>
        </div>
      )}

      {!loading && error && (
        <div className="canvas-state">
          <div className="error-icon">!</div>
          <p className="state-title">Generation failed</p>
          <p className="state-sub error-msg">{error}</p>
        </div>
      )}

      {!loading && !error && !result && (
        <div className="canvas-state empty">
          <div className="empty-gem">◆</div>
          <p className="state-title">Configure your design</p>
          <p className="state-sub">Choose piece, metal, stones and style on the left, then hit Generate</p>
        </div>
      )}

      {!loading && !error && result && (
        <div className="canvas-result">
          <div className="image-wrap">
            <img
              src={`data:image/png;base64,${result.imageB64}`}
              alt="Generated jewellery design"
              className="gen-image"
            />
          </div>

          <div className="result-footer">
            <div className="prompt-box">
              <span className="prompt-label">Prompt used</span>
              <p className="prompt-text">{result.prompt}</p>
            </div>
            <button className="download-btn" onClick={downloadPNG}>
              ↓ Download PNG
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
