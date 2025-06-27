import { FunctionComponent, useState } from 'react'
import { useOpenAI } from '../../hooks/useOpenAI'

interface ApiKeyInputProps {
  onSubmit: (apiKey: string) => void
  initialValue?: string
}

const ApiKeyInput: FunctionComponent<ApiKeyInputProps> = ({ onSubmit, initialValue = '' }) => {
  const [apiKey, setApiKey] = useState(initialValue)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  
  const { testApiKey } = useOpenAI(apiKey)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!apiKey.trim()) {
      setValidationError('Please enter your OpenAI API key')
      return
    }

    setIsValidating(true)
    setValidationError(null)

    try {
      const isValid = await testApiKey()
      if (isValid) {
        onSubmit(apiKey.trim())
      } else {
        setValidationError('Invalid API key. Please check your key and try again.')
      }
    } catch (error) {
      setValidationError('Failed to validate API key. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="api-key-input">
      <div className="step-header">
        <h2>Enter OpenAI API Key</h2>
        <p>Required for AI image editing features.</p>
      </div>

      <form onSubmit={handleSubmit} className="api-key-form">
        <div className="form-group">
          <label htmlFor="apiKey" className="form-label">
            API Key
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="form-input"
            disabled={isValidating}
          />
          <div className="form-help">
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="help-link"
            >
              Get API key from OpenAI
            </a>
          </div>
        </div>

        {validationError && (
          <div className="error-message">
            {validationError}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isValidating || !apiKey.trim()}
        >
          {isValidating ? 'Validating...' : 'Continue'}
        </button>
      </form>

      <div className="security-note">
        <div className="security-text">
          <strong>Secure</strong>
          <p>API key used only for this session.</p>
        </div>
      </div>
    </div>
  )
}

export default ApiKeyInput 