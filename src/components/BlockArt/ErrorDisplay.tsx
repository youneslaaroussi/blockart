import { FunctionComponent } from 'react'

interface ErrorDisplayProps {
  error: string
  onStartOver: () => void
  onRetry?: () => void
  showRetry?: boolean
}

const ErrorDisplay: FunctionComponent<ErrorDisplayProps> = ({
  error,
  onStartOver,
  onRetry,
  showRetry = false
}) => {
  const getErrorDetails = (errorMessage: string) => {
    if (errorMessage.includes('Content policy rejection')) {
      return {
        title: 'Content Policy Restriction',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M4.93 4.93l14.14 14.14"/>
          </svg>
        ),
        message: errorMessage.replace('Content policy rejection: ', ''),
        suggestions: [
          'Try rephrasing your prompt with more appropriate language',
          'Avoid requesting content involving people, violence, or adult themes',
          'Use general descriptions rather than specific instructions',
          'Focus on objects, landscapes, or abstract concepts'
        ]
      }
    }
    
    if (errorMessage.includes('API key')) {
      return {
        title: 'API Key Issue',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 003 3 3 3 0 003 3 3 3 0 00-3 3 3 3 0 00-3 3 3 3 0 00-3-3 3 3 0 00-3-3 3 3 0 003-3 3 3 0 003-3z"/>
            <path d="M9 21H5a2 2 0 01-2-2v-4l6-6 2-2 3-3"/>
          </svg>
        ),
        message: errorMessage,
        suggestions: [
          'Check that your OpenAI API key is valid',
          'Ensure you have sufficient credits',
          'Verify your organization has access to image generation'
        ]
      }
    }
    
    if (errorMessage.includes('Failed to upload mask')) {
      return {
        title: 'Mask Upload Failed',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
            <line x1="8" y1="8" x2="16" y2="16"/>
          </svg>
        ),
        message: 'There was an issue uploading your mask for inpainting',
        suggestions: [
          'Try creating a simpler mask with fewer details',
          'Ensure your internet connection is stable',
          'Check that your mask has clear white areas'
        ]
      }
    }
    
    if (errorMessage.includes('No final image generated')) {
      return {
        title: 'Generation Incomplete',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="10,6 10,12 14,16"/>
            <line x1="16" y1="8" x2="8" y2="16"/>
          </svg>
        ),
        message: 'The image generation process was interrupted',
        suggestions: [
          'Check your internet connection',
          'Try a simpler prompt',
          'Ensure your API key has sufficient credits'
        ]
      }
    }
    
    // Generic error
    return {
      title: 'Processing Error',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      message: errorMessage,
      suggestions: [
        'Check your internet connection',
        'Try again with a different prompt',
        'Ensure your API key is valid and has credits'
      ]
    }
  }

  const errorDetails = getErrorDetails(error)

  return (
    <div className="error-display">
      <div className="step-header">
        <h2>Something went wrong</h2>
        <p>We encountered an issue while processing your request.</p>
      </div>

      <div style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border)', 
        borderRadius: 'var(--radius-md)', 
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-6)'
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{ color: 'var(--accent-red)', flexShrink: 0 }}>
            {errorDetails.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: '0 0 var(--space-2) 0', 
              fontSize: 'var(--text-lg)', 
              fontWeight: '600', 
              color: 'var(--stone-900)' 
            }}>
              {errorDetails.title}
            </h3>
            <p style={{ 
              margin: 0, 
              fontSize: 'var(--text-base)', 
              color: 'var(--stone-700)', 
              lineHeight: '1.5' 
            }}>
              {errorDetails.message}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h4 style={{ 
            margin: '0 0 var(--space-3) 0', 
            fontSize: 'var(--text-sm)', 
            fontWeight: '600', 
            color: 'var(--stone-800)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              <path d="M12 17h.01"/>
            </svg>
            What you can try:
          </h4>
          <ul style={{ 
            margin: 0, 
            paddingLeft: 'var(--space-5)', 
            color: 'var(--stone-700)',
            fontSize: 'var(--text-sm)',
            lineHeight: '1.5'
          }}>
            {errorDetails.suggestions.map((suggestion, index) => (
              <li key={index} style={{ marginBottom: 'var(--space-1)' }}>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        <details style={{ 
          padding: 'var(--space-3)', 
          background: 'var(--stone-50)', 
          borderRadius: 'var(--radius)',
          fontSize: 'var(--text-sm)'
        }}>
          <summary style={{ 
            cursor: 'pointer', 
            fontWeight: '500', 
            color: 'var(--stone-700)',
            marginBottom: 'var(--space-2)'
          }}>
            Technical Details
          </summary>
          <pre style={{ 
            margin: 0, 
            fontFamily: 'monospace', 
            fontSize: 'var(--text-xs)', 
            color: 'var(--stone-600)',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}>
            {error}
          </pre>
        </details>
      </div>

      <div className="step-actions">
        {showRetry && onRetry && (
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onRetry}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 10.9-4"/>
              <path d="M21 12a9 9 0 10-.9 4"/>
              <path d="M8 12l4-4 4 4"/>
            </svg>
            Try Again
          </button>
        )}
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={onStartOver}
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

export default ErrorDisplay 