import { FunctionComponent } from 'react'

interface ImageProcessorProps {
  isProcessing: boolean
  originalImage: string | null
  prompt: string
}

const ImageProcessor: FunctionComponent<ImageProcessorProps> = ({ 
  isProcessing, 
  originalImage, 
  prompt 
}) => {
  return (
    <div className="image-processor">
      <div className="step-header">
        <h2>Step 4: AI Processing</h2>
        <p>Our AI is working on your image edit. This may take a few moments...</p>
      </div>

      <div className="processing-content">
        <div className="processing-visual">
          <div className="original-image">
            {originalImage && (
              <img 
                src={originalImage} 
                alt="Original" 
                className="preview-image"
              />
            )}
            <div className="image-label">Original</div>
          </div>

          <div className="processing-arrow">
            <div className="arrow-animation">
              →
            </div>
          </div>

          <div className="processing-placeholder">
            <div className="processing-spinner">
              <div className="spinner-large"></div>
            </div>
            <div className="image-label">AI Processing...</div>
          </div>
        </div>

        <div className="processing-details">
          <div className="processing-prompt">
            <h4>Your prompt:</h4>
            <p>"{prompt}"</p>
          </div>

          <div className="processing-status">
            {isProcessing && (
              <div className="status-message">
                <div className="status-icon">⚡</div>
                <span>Generating your edited image...</span>
              </div>
            )}
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