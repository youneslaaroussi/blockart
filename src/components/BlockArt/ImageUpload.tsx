import { FunctionComponent, useState, useRef } from 'react'
import { resizeImage, validateImageFile } from '../../utils/imageUtils'

interface ImageUploadProps {
  onImageUpload: (imageData: string) => void
  onBack: () => void
}

const ImageUpload: FunctionComponent<ImageUploadProps> = ({ onImageUpload, onBack }) => {
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
        <h2>Step 2: Upload Image</h2>
        <p>Select an image that you want to edit with AI.</p>
      </div>

      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
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
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14.2 2L18 5.8L18 20C18 20.5304 17.7893 21.0391 17.4142 21.4142C17.0391 21.7893 16.5304 22 16 22L4 22C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20L2 4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2L14.2 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 2L14 8L20 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="10"
                  cy="13"
                  r="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M2 19L6 15L16 25"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3>Drop your image here</h3>
            <p>or click to browse files</p>
            <div className="upload-requirements">
              <small>Supports JPEG, PNG, WebP • Max 10MB</small>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
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
          Back
        </button>
      </div>
    </div>
  )
}

export default ImageUpload 