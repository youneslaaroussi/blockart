import { FunctionComponent, useState } from 'react'

interface PromptInputProps {
  onSubmit: (prompt: string) => void
  onBack: () => void
  originalImage: string | null
}

const PromptInput: FunctionComponent<PromptInputProps> = ({ onSubmit, onBack, originalImage }) => {
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      setError('Please enter a description of how you want to edit the image.')
      return
    }

    if (trimmedPrompt.length < 10) {
      setError('Please provide a more detailed description (at least 10 characters).')
      return
    }

    setError(null)
    onSubmit(trimmedPrompt)
  }

  const examplePrompts = [
    "Add a beautiful sunset sky in the background",
    "Make the colors more vibrant and saturated",
    "Remove the background and make it transparent",
    "Add soft lighting and make it look more professional",
    "Turn this into a vintage-style photograph",
    "Add snow falling in the scene"
  ]

  const handleExampleClick = (example: string) => {
    setPrompt(example)
  }

  return (
    <div className="prompt-input">
      <div className="step-header">
        <h2>Step 3: Describe Your Edit</h2>
        <p>Tell the AI how you want to modify your image.</p>
      </div>

      <div className="image-preview">
        {originalImage && (
          <img 
            src={originalImage} 
            alt="Original" 
            className="preview-image"
          />
        )}
      </div>

      <form onSubmit={handleSubmit} className="prompt-form">
        <div className="form-group">
          <label htmlFor="prompt" className="form-label">
            How would you like to edit this image?
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the changes you want to make..."
            className="form-textarea"
            rows={4}
          />
          <div className="character-count">
            {prompt.length} characters
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="example-prompts">
          <h4>Example prompts:</h4>
          <div className="examples-grid">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                type="button"
                className="example-prompt"
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="step-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onBack}
          >
            Back
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={!prompt.trim()}
          >
            Generate Edit
          </button>
        </div>
      </form>

      <div className="prompt-tips">
        <h4>💡 Tips for better results:</h4>
        <ul>
          <li>Be specific about colors, styles, and details</li>
          <li>Describe the mood or atmosphere you want</li>
          <li>Mention lighting conditions (bright, soft, dramatic)</li>
          <li>Specify any objects to add or remove</li>
        </ul>
      </div>
    </div>
  )
}

export default PromptInput 