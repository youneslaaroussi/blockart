import { FunctionComponent, useState, useEffect } from 'react'

interface ImageProcessorProps {
  isProcessing: boolean
  originalImage: string | null
  prompt: string
  partialImage?: string | null
  partialIndex?: number
  streamingProgress?: number
}

const ImageProcessor: FunctionComponent<ImageProcessorProps> = ({ 
  isProcessing, 
  originalImage, 
  prompt,
  partialImage,
  partialIndex,
  streamingProgress = 0
}) => {
  const [dots, setDots] = useState('')

  useEffect(() => {
    if (!isProcessing) return

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return ''
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isProcessing])

  if (!isProcessing) return null

  return (
    <div className="image-processor">
      <div className="step-header">
        <h2>Step 4: Processing</h2>
        <p>AI is editing your image{dots}</p>
      </div>

      <div className="processing-container">
        <div className="processing-images">
          {/* Original Image */}
          <div className="processing-image original">
            <h3>Original</h3>
            <div className="image-container">
              {originalImage && (
                <img 
                  src={originalImage} 
                  alt="Original" 
                  className="preview-image"
                />
              )}
            </div>
          </div>

          {/* Processing Arrow */}
          <div className="processing-arrow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14m-7-7l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Generated Image (with streaming support) */}
          <div className="processing-image generated">
            <h3>
              {partialImage ? `Processing... (${partialIndex ? partialIndex + 1 : 1}/3)` : 'Generated'}
            </h3>
            <div className="image-container">
              {partialImage ? (
                <div className="streaming-image">
                  <img 
                    src={partialImage} 
                    alt="AI Generated (Partial)" 
                    className="preview-image partial"
                  />
                  <div className="streaming-overlay">
                    <div className="streaming-progress">
                      <div 
                        className="progress-bar"
                        style={{ width: `${streamingProgress}%` }}
                      />
                    </div>
                    <div className="streaming-text">
                      Generating... {Math.round(streamingProgress)}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="processing-placeholder">
                  <div className="spinner-large"></div>
                  <p>Generating your image...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prompt Display */}
        <div className="processing-prompt">
          <h4>Your Prompt:</h4>
          <p>"{prompt}"</p>
        </div>

        {/* Progress Indicator */}
        <div className="processing-progress">
          <div className="progress-steps">
            <div className="progress-step active">
              <div className="step-circle">1</div>
              <span>Analyzing</span>
            </div>
            <div className={`progress-step ${partialImage ? 'active' : ''}`}>
              <div className="step-circle">2</div>
              <span>Generating</span>
            </div>
            <div className="progress-step">
              <div className="step-circle">3</div>
              <span>Finalizing</span>
            </div>
          </div>
        </div>
      </div>

      <div className="processing-info">
        <div className="info-item">
          <div className="info-icon">🧠</div>
          <div className="info-text">
            <strong>AI Image Processing</strong>
            <p>GPT Image 1 is analyzing and editing your image in one step</p>
          </div>
        </div>
        <div className="info-item">
          <div className="info-icon">✨</div>
          <div className="info-text">
            <strong>State-of-the-Art Model</strong>
            <p>Using OpenAI's latest multimodal image generation technology</p>
          </div>
        </div>
        <div className="info-item">
          <div className="info-icon">⏱️</div>
          <div className="info-text">
            <strong>Processing Time</strong>
            <p>This usually takes 15-30 seconds for direct image editing</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageProcessor 