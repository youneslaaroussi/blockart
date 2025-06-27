import { FunctionComponent, useState, useRef } from 'react'
import { resizeImage, validateImageFile } from '../../utils/imageUtils'

interface ImageUploadProps {
  onImageUpload: (imageData: string) => void
  onBack: () => void
}

const ImageUpload: FunctionComponent<ImageUploadProps> = ({ 
  onImageUpload, 
  onBack, 
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    setError(null)
    
    if (!validateImageFile(file)) {
      setError('Please select a valid image file (JPEG, PNG, WebP) under 10MB.')
      return
    }

    setIsProcessing(true)

    try {
      const resizedImage = await resizeImage(file)
      onImageUpload(resizedImage)
    } catch (err) {
      setError('Failed to process the image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="image-upload">
      <div className="step-header">
        <h2>Upload Image</h2>
        <p>Upload an image from your computer that you want to edit with AI.</p>
      </div>
      
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isProcessing ? openFileDialog : undefined}
        style={{ cursor: isProcessing ? 'not-allowed' : 'pointer' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="upload-processing">
            <div className="spinner"></div>
            <p>Processing image...</p>
            <small style={{ color: 'var(--muted)', marginTop: 'var(--space-2)' }}>
              Optimizing for AI processing
            </small>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3>Drop image here or click to browse</h3>
            <p>Choose an image file from your computer</p>
            <div className="upload-requirements">
              <small>Supported formats: JPEG, PNG, WebP</small>
              <small>Maximum size: 10MB</small>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 'var(--space-2)', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
        </div>
      )}

      <div className="step-actions">
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={onBack}
          disabled={isProcessing}
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

export default ImageUpload 