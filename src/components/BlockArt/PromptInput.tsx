import { FunctionComponent, useState, useEffect } from 'react'
import { createMaskOverlay } from '../../utils/imageUtils'

interface PromptInputProps {
  onSubmit: (prompt: string) => void
  onBack: () => void
  originalImage: string | null
  editMode?: 'full' | 'inpaint' | 'generate'
  maskData?: string | null
  actions?: any // Storyblok actions for AI enhancement
}

type EnhancementAction = 
  | 'prompt' | 'complete' | 'shorten' | 'extend' | 'rephrase' | 'summarize' 
  | 'simplify' | 'translate' | 'tldr' | 'adjust-tone' | 'emojify' | 'fix_spelling_and_grammar'

const PromptInput: FunctionComponent<PromptInputProps> = ({ onSubmit, onBack, originalImage, editMode = 'full', maskData, actions }) => {
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [compositeImage, setCompositeImage] = useState<string | null>(null)
  const [isLoadingComposite, setIsLoadingComposite] = useState(false)
  const [showEnhanceDropdown, setShowEnhanceDropdown] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancementError, setEnhancementError] = useState<string | null>(null)

  // Create composite image for inpaint mode using the utility function
  useEffect(() => {
    if (editMode === 'inpaint' && originalImage && maskData) {
      console.log('PromptInput: Creating mask overlay...')
      console.log('Mask data type:', maskData.startsWith('MASK:') ? 'compact' : 'data URL')
      console.log('Mask data length:', maskData.length)
      
      setIsLoadingComposite(true)
      createMaskOverlay(originalImage, maskData)
        .then((result) => {
          console.log('PromptInput: Mask overlay created successfully:', !!result)
          setCompositeImage(result)
        })
        .catch((error) => {
          console.error('PromptInput: Failed to create mask overlay:', error)
          setCompositeImage(null)
        })
        .finally(() => {
          setIsLoadingComposite(false)
        })
    } else {
      setCompositeImage(null)
      setIsLoadingComposite(false)
    }
  }, [originalImage, maskData, editMode])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showEnhanceDropdown && !target.closest('.ai-enhance-container')) {
        setShowEnhanceDropdown(false)
      }
    }

    if (showEnhanceDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEnhanceDropdown])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      setError('Please enter a description of what you want to create or change.')
      return
    }

    if (trimmedPrompt.length < 10) {
      setError('Please provide a more detailed description (at least 10 characters).')
      return
    }

    setError(null)
    onSubmit(trimmedPrompt)
  }

  const getTitle = () => {
    switch (editMode) {
      case 'generate': return 'Describe Your Image'
      case 'inpaint': return 'Describe Your Edit'
      default: return 'Describe Your Changes'
    }
  }

  const getSubtitle = () => {
    switch (editMode) {
      case 'generate': return 'What image do you want to create?'
      case 'inpaint': return 'How should the highlighted areas be modified?'
      default: return 'How do you want to transform your image?'
    }
  }

  const getPlaceholder = () => {
    switch (editMode) {
      case 'generate': return 'A majestic mountain landscape at sunset...'
      case 'inpaint': return 'Replace with a beautiful garden...'
      default: return 'Make the colors more vibrant...'
    }
  }

  const examplePrompts = editMode === 'generate' ? [
    "A serene mountain lake at golden hour with perfect reflections",
    "A cozy modern living room with warm lighting and plants",
    "A futuristic cityscape with flying cars and neon lights",
    "A magical forest clearing with glowing fireflies at dusk",
    "A vintage bookstore with wooden shelves and reading nooks",
    "An underwater coral reef scene with tropical fish"
  ] : editMode === 'inpaint' ? [
    "Replace with a beautiful sunset sky",
    "Add a person sitting in this area",
    "Fill with lush green grass and flowers",
    "Change to a modern glass building",
    "Remove the object completely",
    "Add floating balloons in the sky"
  ] : [
    "Transform into a vintage sepia photograph",
    "Make the lighting dramatic and moody",
    "Add vibrant sunset colors to the sky",
    "Convert to a minimalist black and white style",
    "Enhance with soft romantic lighting",
    "Apply a magical fantasy atmosphere"
  ]

  const handleExampleClick = (example: string) => {
    setPrompt(example)
    setError(null)
  }

  const enhancePrompt = async (action: EnhancementAction) => {
    if (!prompt.trim() || !actions) {
      setEnhancementError('Please enter some text first')
      return
    }

    setIsEnhancing(true)
    setEnhancementError(null)
    
    try {
      let aiPrompt = ''
      
      switch (action) {
        case 'prompt':
          aiPrompt = `Convert this into a command starting with "generate an image of". Focus on concrete objects, colors, lighting, composition, style. Avoid stories, emotions, abstract concepts. Keep it under 50 words: "${prompt}"`
          break
        case 'complete':
          aiPrompt = `Complete this text as a command starting with "generate an image of": "${prompt}"`
          break
        case 'shorten':
          aiPrompt = `Make this shorter and more concise, starting with "generate an image of": "${prompt}"`
          break
        case 'extend':
          aiPrompt = `Add specific visual details while keeping it as a command starting with "generate an image of". Include materials, textures, lighting, camera angle, artistic style. Keep under 60 words: "${prompt}"`
          break
        case 'rephrase':
          aiPrompt = `Rephrase this as a clear command starting with "generate an image of". Use visual, concrete terms. Keep it concise: "${prompt}"`
          break
        case 'summarize':
          aiPrompt = `Summarize this as a command starting with "generate an image of": "${prompt}"`
          break
        case 'simplify':
          aiPrompt = `Simplify this into a clear command starting with "generate an image of": "${prompt}"`
          break
        case 'translate':
          aiPrompt = `Translate this to English (if needed) and format as a command starting with "generate an image of": "${prompt}"`
          break
        case 'tldr':
          aiPrompt = `Create a brief command starting with "generate an image of" that captures the key elements of: "${prompt}"`
          break
        case 'adjust-tone':
          aiPrompt = `Convert this into a professional command starting with "generate an image of". Focus on visual elements, composition, lighting style: "${prompt}"`
          break
        case 'emojify':
          aiPrompt = `Add relevant emojis while keeping it as a command starting with "generate an image of": "${prompt}"`
          break
        case 'fix_spelling_and_grammar':
          aiPrompt = `Fix spelling and grammar while formatting as a command starting with "generate an image of": "${prompt}"`
          break
        default:
          aiPrompt = `Improve this text as a command starting with "generate an image of": "${prompt}"`
      }

      const response = await actions.promptAI({
        action: 'prompt',
        basedOnCurrentStory: false,
        text: aiPrompt,
      })

      if (response && response.ok && response.answer) {
        setPrompt(response.answer)
        setError(null)
      } else {
        setEnhancementError('AI enhancement failed to return a result')
      }
    } catch (e: any) {
      setEnhancementError(e?.message || 'Enhancement failed')
    } finally {
      setIsEnhancing(false)
      setShowEnhanceDropdown(false)
    }
  }

  const getActionLabel = (action: EnhancementAction): string => {
    const labels: Record<EnhancementAction, string> = {
      prompt: 'Make More Descriptive',
      complete: 'Complete Text',
      shorten: 'Make Shorter',
      extend: 'Add More Details',
      rephrase: 'Rephrase',
      summarize: 'Summarize',
      simplify: 'Simplify',
      translate: 'Translate',
      tldr: 'TLDR',
      'adjust-tone': 'Adjust Tone',
      emojify: 'Add Emojis',
      'fix_spelling_and_grammar': 'Fix Grammar'
    }
    return labels[action]
  }

  const renderImagePreview = () => {
    if (editMode === 'generate') return null

    if (editMode === 'inpaint') {
      return (
        <div className="preview-container">
          {isLoadingComposite ? (
            <div className="preview-loading">
              <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
              <span>Preparing preview...</span>
            </div>
          ) : compositeImage ? (
            <>
              <img 
                src={compositeImage} 
                alt="Image with mask overlay" 
                className="compact-preview-image"
              />
              <small className="preview-help">Red areas will be edited by AI</small>
            </>
          ) : originalImage ? (
            <>
              <div className="preview-fallback">
                <img 
                  src={originalImage} 
                  alt="Original" 
                  className="compact-preview-image"
                />
                <div className="preview-overlay">
                  <span>Mask preview unavailable</span>
                </div>
              </div>
              <small className="preview-help">Selected areas will be edited by AI</small>
            </>
          ) : null}
        </div>
      )
    }

    // Full edit mode
    if (originalImage) {
      return (
        <div className="preview-container">
          <img 
            src={originalImage} 
            alt="Original" 
            className="compact-preview-image"
          />
        </div>
      )
    }

    return null
  }

  return (
    <div className="prompt-input">
      <div className="step-header">
        <h2>{getTitle()}</h2>
        <p>{getSubtitle()}</p>
      </div>

      {editMode !== 'generate' && (
        <div className="compact-image-preview">
          {renderImagePreview()}
        </div>
      )}

      <form onSubmit={handleSubmit} className="prompt-form">
        <div className="form-group">
          <div className="form-label-with-actions">
            <label htmlFor="prompt" className="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 'var(--space-2)' }}>
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Prompt
            </label>
            {actions && (
              <div className="ai-enhance-container">
                <button
                  type="button"
                  className={`ai-enhance-btn`}
                  onClick={() => setShowEnhanceDropdown(!showEnhanceDropdown)}
                  disabled={isEnhancing}
                >
                  {isEnhancing ? (
                    <>
                      <div className="spinner"></div>
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      AI Enhance
                    </>
                  )}
                </button>
                {showEnhanceDropdown && (
                  <div className="ai-enhance-dropdown">
                                          <div className="dropdown-header">
                        <h4>AI Enhancement</h4>
                        <p>Uses your page content as context to create more relevant prompts</p>
                      </div>
                                          <div className="dropdown-actions">
                        {(['prompt', 'extend', 'rephrase', 'simplify', 'adjust-tone', 'complete', 'shorten', 'summarize', 'fix_spelling_and_grammar'] as EnhancementAction[]).map((action) => (
                          <button
                            key={action}
                            type="button"
                            className="dropdown-action"
                            onClick={() => enhancePrompt(action)}
                          >
                            {getActionLabel(action)}
                          </button>
                        ))}
                      </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="textarea-container">
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={getPlaceholder()}
              className="form-textarea"
              rows={4}
            />
            {isEnhancing && (
              <div className="textarea-overlay">
                <div className="enhancement-loader">
                  <div className="spinner"></div>
                  <span>Enhancing prompt...</span>
                </div>
              </div>
            )}
          </div>
          <div className="textarea-footer">
            <div className="character-count">
              {prompt.length} characters
            </div>
            {enhancementError && (
              <div className="enhancement-error">
                {enhancementError}
              </div>
            )}
          </div>
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
          >
            Back
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={!prompt.trim()}
          >
            {editMode === 'generate' ? 'Generate Image' : 'Process Image'}
          </button>
        </div>
      </form>

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
    </div>
  )
}

export default PromptInput 