import { FunctionComponent, useEffect, useState } from 'react'
import { createMaskOverlay } from '../../utils/imageUtils'

interface ImageProcessorProps {
  originalImage: string | null
  isProcessing: boolean
  editMode: 'full' | 'inpaint' | 'generate'
  processedImage: string | null
  partialImage?: string | null
  partialIndex?: number
  streamingProgress?: number
  maskData?: string | null
  status: string
  onRetry: () => void
  onCancel: () => void
}

const ImageProcessor: FunctionComponent<ImageProcessorProps> = ({
  originalImage,
  isProcessing,
  editMode,
  processedImage,
  partialImage,
  partialIndex,
  streamingProgress,
  maskData,
  status,
  onRetry,
  onCancel
}) => {
  const [compositeImage, setCompositeImage] = useState<string | null>(null)
  const [isLoadingComposite, setIsLoadingComposite] = useState(false)

  // Create composite image for inpaint mode using the utility function
  useEffect(() => {
    if (editMode === 'inpaint' && originalImage && maskData && !processedImage) {
      console.log('ImageProcessor: Creating mask overlay...')
      console.log('Mask data type:', maskData.startsWith('MASK:') ? 'compact' : 'data URL')
      console.log('Mask data length:', maskData.length)

      setIsLoadingComposite(true)
      createMaskOverlay(originalImage, maskData)
        .then((result) => {
          console.log('ImageProcessor: Mask overlay created successfully:', !!result)
          setCompositeImage(result)
        })
        .catch((error) => {
          console.error('ImageProcessor: Failed to create mask overlay:', error)
          setCompositeImage(null)
        })
        .finally(() => {
          setIsLoadingComposite(false)
        })
    } else {
      setCompositeImage(null)
      setIsLoadingComposite(false)
    }
  }, [originalImage, maskData, editMode, processedImage])

  const getImageToShow = () => {
    if (processedImage) return processedImage
    if (partialImage && isProcessing) return partialImage
    if (editMode === 'inpaint' && compositeImage) return compositeImage
    if (originalImage) return originalImage
    return null
  }

  const getImageAlt = () => {
    if (processedImage) return "Processed image"
    if (partialImage && isProcessing) return `Generating image... (${partialIndex || 0}/2)`
    if (editMode === 'inpaint' && compositeImage) return "Original image with editing mask"
    if (originalImage) return "Original image"
    return "Image"
  }

  const getStatusText = () => {
    if (status) {
      // Extract just the action part, not the prompt
      if (status.startsWith('Processing: "')) return 'Processing your image...'
      return status
    }
    if (editMode === 'generate') return 'Generating your image...'
    if (editMode === 'inpaint') return 'Processing selected areas...'
    return 'Processing your image...'
  }

  const getPromptFromStatus = () => {
    if (status && status.startsWith('Processing: "')) {
      const match = status.match(/Processing: "(.+)"/)
      return match ? match[1] : null
    }
    return null
  }

  const getHelpText = () => { return null }

  const imageToShow = getImageToShow()

  if (!imageToShow && !isLoadingComposite) {
    return (
      <div className="image-processor processing">
        <div className="processing-container">
          <div className="processing-content">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <h3>{editMode === 'generate' ? 'Creating Image' : 'Processing Image'}</h3>
            <p className="processing-status">{getStatusText()}</p>
            <div className="processing-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="image-processor">
      <div className="processor-header">
        <h2>
          {processedImage ? 'Image Complete!' :
            editMode === 'generate' ? 'Creating Image' :
              'Processing Image'}
        </h2>
        <div>
        <p>
          {processedImage ? 'Your image has been processed successfully.' :
            getStatusText()}
        </p>
          {getPromptFromStatus() && (
            <div className="prompt-display">
              <div className="prompt-text">
                {getPromptFromStatus()}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="processor-content">
        <div className="image-container">
          {isLoadingComposite ? (
            <div className="image-loading">
              <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
              <span>Preparing preview...</span>
            </div>
          ) : imageToShow ? (
            <>
              <img
                src={imageToShow}
                alt={getImageAlt()}
                className="processing-image"
              />
              {getHelpText() && (
                <div className="image-help">
                  <small>{getHelpText()}</small>
                </div>
              )}
            </>
          ) : (
            <div className="image-placeholder">
              <span>No image available</span>
            </div>
          )}
        </div>

        {isProcessing && !processedImage && !partialImage && (
          <div className="processing-overlay">
            <div className="processing-indicator">
              <div className="spinner"></div>
              <span className="processing-text">{getStatusText()}</span>
            </div>
          </div>
        )}

        {isProcessing && !processedImage && partialImage && (
          <div className="streaming-overlay">
            <div className="streaming-indicator">
              <div className="streaming-info">
                <small>Generating... {partialIndex || 0}/2</small>
                {streamingProgress && (
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${streamingProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="processor-actions">
        {processedImage ? (
          <div className="success-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onRetry}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="processing-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageProcessor 