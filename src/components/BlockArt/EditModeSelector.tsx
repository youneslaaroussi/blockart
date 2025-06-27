import { FunctionComponent, useRef, useEffect, useState } from 'react'

interface EditModeSelectorProps {
  onModeSelect: (mode: 'full' | 'inpaint' | 'generate') => void
  onBack: () => void
  originalImage: string | null
  maskData?: string | null
}

const EditModeSelector: FunctionComponent<EditModeSelectorProps> = ({
  onModeSelect,
  onBack,
  originalImage,
  maskData
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [compositeImage, setCompositeImage] = useState<string | null>(null)

  useEffect(() => {
    if (originalImage && maskData) {
      // Create composite image showing original + mask overlay
      const canvas = canvasRef.current
      if (!canvas) return

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
          
          // Draw original image
          ctx.drawImage(originalImg, 0, 0)
          
          // Draw mask overlay
          ctx.globalAlpha = 0.5
          ctx.drawImage(maskImg, 0, 0)
          ctx.globalAlpha = 1.0
          
          // Convert to data URL
          setCompositeImage(canvas.toDataURL())
        }
      }
      
      originalImg.onload = checkAllLoaded
      maskImg.onload = checkAllLoaded
      originalImg.src = originalImage
      maskImg.src = maskData
    } else {
      setCompositeImage(null)
    }
  }, [originalImage, maskData])

  return (
    <div className="edit-mode-selector">
      <div className="step-header">
        <h2>Choose Editing Mode</h2>
        <p>Select how you want to edit your image with AI assistance.</p>
      </div>

      {originalImage && (
        <div className="image-preview" style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
          <img 
            src={compositeImage || originalImage} 
            alt={compositeImage ? "Original with Mask" : "Original"} 
            className="compact-preview-image"
            style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'contain' }}
          />
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="edit-mode-selection">
        <div className="edit-mode-options">
          <div 
            className="edit-mode-option"
            onClick={() => onModeSelect('full')}
          >
            <div style={{ fontSize: '24px', marginBottom: 'var(--space-3)', color: 'var(--muted)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2z"/>
                <path d="M16 12h-4l-2-2-2 2h4v4"/>
              </svg>
            </div>
            <h3>Full Edit</h3>
            <p>Apply changes to the entire image</p>
            <div className="mode-features">
              <small>Best for overall style changes • Color adjustments • Global effects</small>
            </div>
          </div>

          <div 
            className="edit-mode-option"
            onClick={() => onModeSelect('inpaint')}
          >
            <div style={{ fontSize: '24px', marginBottom: 'var(--space-3)', color: 'var(--muted)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3"/>
                <path d="M9 15h3l8.5-8.5a2.12 2.12 0 00-3-3L9 12v3z"/>
                <path d="M16 5l3 3"/>
              </svg>
            </div>
            <h3>Inpaint Mode</h3>
            <p>Edit only specific areas you select</p>
            <div className="mode-features">
              <small>Best for object removal • Adding elements • Selective changes</small>
            </div>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={onBack}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back
        </button>
      </div>
    </div>
  )
}

export default EditModeSelector 