import { FunctionComponent, useState } from 'react'

interface ImagePreviewProps {
  originalImage: string | null
  editedImage: string | null
  prompt: string
  onAddToDocument: () => void
  onStartOver: () => void
}

const ImagePreview: FunctionComponent<ImagePreviewProps> = ({ 
  originalImage, 
  editedImage, 
  prompt, 
  onAddToDocument, 
  onStartOver 
}) => {
  const [viewMode, setViewMode] = useState<'both' | 'original' | 'edited'>('both')

  const downloadImage = () => {
    if (!editedImage) return
    
    const link = document.createElement('a')
    link.href = editedImage
    link.download = 'blockart-edited-image.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="image-preview">
      <div className="step-header">
        <h2>Step 5: Your Edited Image</h2>
        <p>Here's your AI-edited image! You can add it to your document or start over.</p>
      </div>

      <div className="view-controls">
        <div className="view-mode-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'both' ? 'active' : ''}`}
            onClick={() => setViewMode('both')}
          >
            Before & After
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'original' ? 'active' : ''}`}
            onClick={() => setViewMode('original')}
          >
            Original Only
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'edited' ? 'active' : ''}`}
            onClick={() => setViewMode('edited')}
          >
            Edited Only
          </button>
        </div>
      </div>

      <div className={`images-container ${viewMode}`}>
        {(viewMode === 'both' || viewMode === 'original') && originalImage && (
          <div className="image-section">
            <img 
              src={originalImage} 
              alt="Original" 
              className="comparison-image"
            />
            <div className="image-label">Original</div>
          </div>
        )}

        {(viewMode === 'both' || viewMode === 'edited') && editedImage && (
          <div className="image-section">
            <img 
              src={editedImage} 
              alt="Edited" 
              className="comparison-image"
            />
            <div className="image-label">AI Edited</div>
          </div>
        )}
      </div>

      <div className="edit-details">
        <div className="prompt-used">
          <h4>Applied Edit:</h4>
          <p>"{prompt}"</p>
        </div>
      </div>

      <div className="preview-actions">
        <div className="secondary-actions">
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={downloadImage}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path 
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <polyline 
                points="7,10 12,15 17,10" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <line 
                x1="12" 
                y1="15" 
                x2="12" 
                y2="3" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
            Download
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onStartOver}
          >
            Start Over
          </button>
        </div>
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={onAddToDocument}
        >
          Add to Document
        </button>
      </div>

      <div className="success-message">
        <div className="success-icon">✨</div>
        <div className="success-text">
          <strong>Edit Complete!</strong>
          <p>Your image has been successfully processed with AI</p>
        </div>
      </div>
    </div>
  )
}

export default ImagePreview 