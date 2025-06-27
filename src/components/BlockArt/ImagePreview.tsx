import { FunctionComponent, useState, useRef, useEffect } from 'react'
import VersionHistory from './VersionHistory'
import { BlockArtVersion } from '../../types/BlockArt'

interface ImagePreviewProps {
  originalImage: string | null
  editedImage: string | null
  prompt: string
  altText?: string
  editMode: 'full' | 'inpaint' | 'generate'
  maskData: string | null
  onSaveToStoryblok: () => void
  onStartOver: () => void
  isSaving: boolean
  isGeneratingAltText: boolean
  versions: BlockArtVersion[]
  onRestoreVersion: (version: BlockArtVersion) => void
}

const ImagePreview: FunctionComponent<ImagePreviewProps> = ({ 
  originalImage, 
  editedImage, 
  prompt,
  altText,
  editMode,
  maskData,
  onSaveToStoryblok,
  onStartOver,
  isSaving,
  isGeneratingAltText,
  versions,
  onRestoreVersion
}) => {
  const [comparisonView, setComparisonView] = useState<'edited' | 'original' | 'mask'>('edited')
  const [showHistory, setShowHistory] = useState(false)
  const maskedCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (comparisonView === 'mask' && editMode === 'inpaint' && originalImage && maskData && maskedCanvasRef.current) {
      const canvas = maskedCanvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const originalImg = new Image()
      const maskImg = new Image()
      
      let imagesLoaded = 0
      const checkAllLoaded = () => {
        imagesLoaded++
        if (imagesLoaded === 2) {
          canvas.width = originalImg.width
          canvas.height = originalImg.height
          
          ctx.drawImage(originalImg, 0, 0)
          
          ctx.globalCompositeOperation = 'source-over'
          ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'
          
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = maskImg.width
          tempCanvas.height = maskImg.height
          const tempCtx = tempCanvas.getContext('2d')
          if (!tempCtx) return
          
          tempCtx.drawImage(maskImg, 0, 0)
          
          const maskImageData = tempCtx.getImageData(0, 0, maskImg.width, maskImg.height)
          const maskDataArray = maskImageData.data
          
          for (let y = 0; y < maskImg.height; y++) {
            for (let x = 0; x < maskImg.width; x++) {
              const i = (y * maskImg.width + x) * 4
              const r = maskDataArray[i]
              const g = maskDataArray[i + 1] 
              const b = maskDataArray[i + 2]
              const a = maskDataArray[i + 3]
              
              if (r > 200 && g > 200 && b > 200 && a > 0) {
                ctx.fillRect(x, y, 1, 1)
              }
            }
          }
        }
      }
      
      originalImg.onload = checkAllLoaded
      maskImg.onload = checkAllLoaded
      originalImg.src = originalImage
      maskImg.src = maskData
    }
  }, [originalImage, maskData, editMode, comparisonView])

  const downloadImage = () => {
    let url: string | null = null
    let filename = 'blockart-image.png'

    if (editMode === 'generate' || comparisonView === 'edited') {
      url = editedImage
      filename = 'blockart-edited.png'
    } else if (comparisonView === 'original') {
      url = originalImage
      filename = 'blockart-original.png'
    } else if (comparisonView === 'mask' && maskedCanvasRef.current) {
      url = maskedCanvasRef.current.toDataURL()
      filename = 'blockart-mask.png'
    }
    
    if (!url) return
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatus = () => {
    if (editMode === 'generate') return 'Generated'
    switch (comparisonView) {
      case 'edited': return 'Edited'
      case 'original': return 'Original'
      case 'mask': return 'Mask'
      default: return 'Edited'
    }
  }

  const getMethodText = () => {
    if (editMode === 'full') return 'Full Edit'
    if (editMode === 'inpaint') return 'Inpaint Edit'
    return 'Generated from text'
  }

  return (
    <div className="image-preview-container">
      <div className="step-header">
        <h2>Preview Result</h2>
        <p>Your AI-processed image is ready. Save it to Storyblok or create another version.</p>
      </div>

      <div className="image-preview-main">
        <div className="image-preview-fullscreen">
          <div className="fullscreen-image-container">
            {(editMode === 'generate' || comparisonView === 'edited') && editedImage && (
              <img 
                src={editedImage} 
                alt="Edited" 
                className="fullscreen-image"
              />
            )}
            {editMode !== 'generate' && comparisonView === 'original' && originalImage && (
              <img 
                src={originalImage} 
                alt="Original" 
                className="fullscreen-image"
              />
            )}
            {editMode === 'inpaint' && comparisonView === 'mask' && (
              <canvas ref={maskedCanvasRef} className="fullscreen-image"></canvas>
            )}
          </div>
  
          <div className="overlay-top">
            <div className="app-badge">BlockArt</div>
            <div className="status-badge">{getStatus()}</div>
          </div>
  
          <div className="overlay-bottom">
            {editMode !== 'generate' && (
              <div className="comparison-controls">
                <button 
                  className={`comparison-btn ${comparisonView === 'edited' ? 'active' : ''}`}
                  onClick={() => setComparisonView('edited')}
                >
                  Edited
                </button>
                <button 
                  className={`comparison-btn ${comparisonView === 'original' ? 'active' : ''}`}
                  onClick={() => setComparisonView('original')}
                >
                  Original
                </button>
              </div>
            )}
            <div className="primary-actions">
              <button 
                className="action-btn primary"
                onClick={onSaveToStoryblok}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner" style={{ width: '14px', height: '14px' }}></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Save to Storyblok
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Details */}
      <div style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border-light)', 
        borderRadius: 'var(--radius)', 
        padding: 'var(--space-4)', 
        marginTop: 'var(--space-4)' 
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Method
            </div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--stone-800)' }}>
              {getMethodText()}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Prompt
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--stone-700)', lineHeight: '1.4' }}>
              "{prompt}"
            </div>
          </div>
          
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Alt Text
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--stone-700)', lineHeight: '1.4' }}>
              {isGeneratingAltText ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span className="spinner" style={{ width: '12px', height: '12px' }}></span>
                  <span style={{ color: 'var(--muted)' }}>Generating alt text...</span>
              </div>
              ) : altText ? (
                altText
              ) : (
                <span style={{ color: 'var(--muted)' }}>No alt text available</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Version History */}
      {versions.length > 0 && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: '600', color: 'var(--stone-900)' }}>
              Version History
            </h3>
            <button 
              className="btn btn-small btn-secondary"
              onClick={() => setShowHistory(!showHistory)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 10.9-4"/>
                <path d="M21 12a9 9 0 10-.9 4"/>
                <path d="M8 12l4-4 4 4"/>
              </svg>
              {showHistory ? 'Hide' : 'Show'} ({versions.length})
            </button>
          </div>
          
          {showHistory && (
            <VersionHistory
              versions={versions}
              onRestore={onRestoreVersion}
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="step-actions">
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={onStartOver}
          disabled={isSaving}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 01.9-4M21 12a9 9 0 01-.9 4"/>
            <path d="M8 12l4-4 4 4"/>
          </svg>
          Start Over
        </button>
      </div>
    </div>
  )
}

export default ImagePreview 