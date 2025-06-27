import { FunctionComponent, useState, useEffect } from 'react'
import { useFieldPlugin } from '@storyblok/field-plugin/react'
import ImageUpload from './ImageUpload'
import EditModeSelector from './EditModeSelector'
import MaskEditor from './MaskEditor'
import PromptInput from './PromptInput'
import ImageProcessor from './ImageProcessor'
import ImagePreview from './ImagePreview'
import ErrorDisplay from './ErrorDisplay'
import { useOpenAI, StreamingUpdate } from '../../hooks/useOpenAI'
import { BlockArtData, BlockArtVersion } from '../../types/BlockArt'
import { uploadImageToStoryblok, StoryblokAssetsAPI } from '../../utils/storyblokAssets'
import './BlockArt.css'

const BlockArt: FunctionComponent = () => {
  const { type, data, actions } = useFieldPlugin({
    validateContent: (content: unknown) => ({
      content: content as BlockArtData,
      errors: []
    })
  })

  const [currentStep, setCurrentStep] = useState<'mode-choice' | 'upload' | 'mode-select' | 'mask-edit' | 'prompt' | 'processing' | 'preview' | 'error'>('mode-choice')
  const [originalImage, setOriginalImage] = useState<string | null>(data?.content?.originalImage || null)
  const [prompt, setPrompt] = useState<string>(data?.content?.prompt || '')
  const [editedImage, setEditedImage] = useState<string | null>(data?.content?.editedImage || null)
  const [versions, setVersions] = useState<BlockArtVersion[]>(data?.content?.versions || [])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isGeneratingAltText, setIsGeneratingAltText] = useState(false)
  const [partialImage, setPartialImage] = useState<string | null>(null)
  const [partialIndex, setPartialIndex] = useState<number>(0)
  const [streamingProgress, setStreamingProgress] = useState<number>(0)
  const [editMode, setEditMode] = useState<'full' | 'inpaint' | 'generate'>('full')
  const [maskData, setMaskData] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState<string>('')

  const [altText, setAltText] = useState<string>('')
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
    timestamp: number
  } | null>(null)

  const { processImageWithStreaming, generateImageFromTextWithStreaming, generateAltText, error } = useOpenAI(data?.options?.openaiApiKey || '')

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Helper function to show notifications
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({
      type,
      message,
      timestamp: Date.now()
    })
  }

  // Helper function to create current content data
  const createContentData = (): BlockArtData => {
    let status: 'empty' | 'setup' | 'in-progress' | 'completed' | 'error' = 'empty'
    
    if (error) {
      status = 'error'
    } else if (editedImage) {
      status = 'completed'
    } else if (isProcessing || isGeneratingAltText) {
      status = 'in-progress'
    } else if (data?.options?.openaiApiKey) {
      status = 'setup'
    }

    return {
      originalImage,
      editedImage, // This will hold the Storyblok asset URL once selected
      prompt,
      altText,
      versions: versions,
      editMode,
      mask: maskData,
      status,
      lastUpdated: Date.now()
    }
  }

  // Set initial placeholder content when plugin loads
  useEffect(() => {
    if (type === 'loaded' && !data?.content) {
      const initialContent: BlockArtData = {
        originalImage: null,
        editedImage: null,
        prompt: '',
        altText: '',
        versions: [],
        editMode: 'full',
        mask: null,
        status: 'empty',
        lastUpdated: Date.now()
      }
      actions.setContent(initialContent)
    }
  }, [type, data?.content, actions])

  // Update content whenever key data changes
  useEffect(() => {
    if (type === 'loaded') {
      const currentContent = createContentData()
      actions.setContent(currentContent)
    }
  }, [type, originalImage, editedImage, prompt, altText, versions, editMode, maskData, isProcessing, isGeneratingAltText, error, actions])

  if (type !== 'loaded') {
    return (
      <div className="blockart-container">
        <div className="blockart-content">
          <div className="blockart-title">BlockArt</div>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
            <div className="spinner" style={{ margin: '0 auto var(--space-4) auto' }}></div>
            <p>Loading plugin...</p>
          </div>
        </div>
      </div>
    )
  }

  const handleModeChoice = async (choice: 'upload' | 'generate' | 'select-asset') => {
    if (choice === 'upload') {
      setCurrentStep('upload')
    } else if (choice === 'select-asset') {
      const asset = await actions.selectAsset()
      if (asset && asset.filename) {
        setOriginalImage(asset.filename) // The filename is the URL
        setCurrentStep('mode-select')
      }
    } else {
      setEditMode('generate')
      setCurrentStep('prompt')
    }
  }

  const handleImageUpload = (imageData: string) => {
    setOriginalImage(imageData)
    setCurrentStep('mode-select')
  }

  const handleModeSelect = (mode: 'full' | 'inpaint' | 'generate') => {
    setEditMode(mode)
    if (mode === 'generate') {
      setCurrentStep('prompt')
    } else if (mode === 'inpaint') {
      setCurrentStep('mask-edit')
    } else {
      setCurrentStep('prompt')
    }
  }

  const handleMaskCreated = (mask: string) => {
    setMaskData(mask)
    setCurrentStep('prompt')
  }

  const handlePromptSubmit = async (promptText: string) => {
    if (!data?.options?.openaiApiKey) {
      setGenerationError('OpenAI API key is not set. Please configure it in the plugin options.')
      setCurrentStep('error')
      return
    }

    // Before starting, if there's an existing image, add it to versions
    if (editedImage) {
      const newVersion: BlockArtVersion = {
        imageUrl: editedImage,
        prompt: lastPrompt, // Use the prompt that generated the previous image
        altText: altText,
        timestamp: Date.now(),
        editMode: editMode,
      };
      setVersions(prev => [newVersion, ...prev]);
    }

    setPrompt(promptText)
    setCurrentStep('processing')
    setIsProcessing(true)
    setPartialImage(null)
    setPartialIndex(0)
    setStreamingProgress(0)


    const finalPrompt = promptText;
    setLastPrompt(finalPrompt); // For retries

    try {
      console.log('Starting OpenAI image generation with prompt:', finalPrompt);
      let result: string;

      if (editMode === 'generate') {
        console.log('Using text-to-image generation mode');
        // Use text-to-image generation
        result = await generateImageFromTextWithStreaming(
          finalPrompt,
          (update: StreamingUpdate) => {
            if (update.partialImage) {
              setPartialImage(update.partialImage)
              setPartialIndex(update.partialIndex || 0)
              // Calculate progress based on partial index (0-2 maps to 20-80%)
              const progress = 20 + (update.partialIndex || 0) * 30
              setStreamingProgress(progress)
            }
            if (update.finalImage) {
              setEditedImage(update.finalImage)
              setStreamingProgress(100)
            }
            if (update.isComplete) {
              setCurrentStep('preview')
            }
          }
        )
      } else {
        console.log('Using image editing mode');
        // Use image editing
        result = await processImageWithStreaming(
          originalImage!, 
          finalPrompt,
          (update: StreamingUpdate) => {
            if (update.partialImage) {
              setPartialImage(update.partialImage)
              setPartialIndex(update.partialIndex || 0)
              // Calculate progress based on partial index (0-2 maps to 20-80%)
              const progress = 20 + (update.partialIndex || 0) * 30
              setStreamingProgress(progress)
            }
            if (update.finalImage) {
              setEditedImage(update.finalImage)
              setStreamingProgress(100)
            }
            if (update.isComplete) {
              setCurrentStep('preview')
            }
          },
          maskData || undefined
        )
      }

      setIsProcessing(false)

      // Step 2: Generate alt text using OpenAI
      if (result) {
        setIsGeneratingAltText(true)
        try {
          console.log('Generating alt text for image...')
          const generatedAltText = await generateAltText(result)
          if (generatedAltText) {
            setAltText(generatedAltText)
            console.log('Alt text generated successfully:', generatedAltText)
          } else {
            console.warn('Alt text generation returned empty result')
          }
        } catch (altError: any) {
          console.warn('Failed to generate alt text:', altError?.message || altError)
        } finally {
          setIsGeneratingAltText(false)
        }
      }

    } catch (error) {
      console.error('Image processing failed:', error);
      if (error instanceof Error) {
        setGenerationError(error.message)
      } else {
        setGenerationError('An unknown error occurred during image processing.')
      }
      setCurrentStep('error');
      setIsProcessing(false);
    }
  }

  const handleRetryPrompt = () => {
    if (lastPrompt) {
      handlePromptSubmit(lastPrompt)
    }
  }

  const handleRestoreVersion = (version: BlockArtVersion) => {
    // 1. Current image becomes a new version at the top
    if (editedImage) {
      const currentVersion: BlockArtVersion = {
        imageUrl: editedImage,
        prompt: prompt,
        altText: altText,
        timestamp: Date.now(),
        editMode: editMode,
      };
      setVersions(prev => [currentVersion, ...prev.filter(v => v.timestamp !== version.timestamp)]);
    }

    // 2. Set the selected version as current
    setEditedImage(version.imageUrl);
    setPrompt(version.prompt);
    setAltText(version.altText || '');
    setEditMode(version.editMode);
    
    // 3. Remove the restored version from the list to avoid duplicates
    setVersions(prev => prev.filter(v => v.timestamp !== version.timestamp))
  }

  const handleSaveToStoryblok = async () => {
    if (!editedImage || !data?.options?.spaceId || !data?.options?.managementToken) {
      showNotification('error', 'Missing required configuration to save to Storyblok. Please check your plugin settings.')
      return
    }

    try {
      setIsProcessing(true)
      showNotification('info', 'Uploading image to Storyblok...')
      
      // Generate a filename based on the prompt
      const sanitizedPrompt = prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_') || 'generated'
      const timestamp = Date.now()
      const filename = `blockart_${sanitizedPrompt}_${timestamp}.png`
      
      // Create StoryblokAssetsAPI instance to use the more robust upload method
      const assetsAPI = new StoryblokAssetsAPI(
        data.options.spaceId,
        data.options.managementToken,
        data.options.region as any
      )
      
      // Upload to Storyblok using the 3-step process with alt text if available
      const asset = await assetsAPI.uploadAsset(
        editedImage,
        filename,
        altText || undefined, // Include alt text if it was generated
        prompt || undefined // Use prompt as title
      )
      
      // Update the edited image to use the Storyblok asset URL
      setEditedImage(asset.filename)
      
      const successMessage = altText 
        ? 'Image saved to Storyblok with alt text successfully!'
        : 'Image saved to Storyblok successfully!'
      showNotification('success', successMessage)
      
    } catch (error) {
      console.error('Failed to save to Storyblok:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      showNotification('error', `Failed to save image to Storyblok: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStartOver = () => {
    setCurrentStep('mode-choice')
    setOriginalImage(null)
    setEditedImage(null)
    setPrompt('')

    setAltText('')
    setPartialImage(null)
    setPartialIndex(0)
    setStreamingProgress(0)
    setEditMode('full')
    setMaskData(null)
    setLastPrompt('')
    setVersions([])
    setGenerationError(null)
  }

  const renderCurrentStage = () => {
    switch (currentStep) {
      case 'mode-choice':
        return (
          <div className="mode-choice">
            <div className="step-header">
              <h2>Get Started</h2>
              <p>Choose how you want to provide an image for AI editing or generate a new one from scratch.</p>
            </div>
            
            <div className="choice-options">
              <div 
                className="choice-option"
                onClick={() => handleModeChoice('select-asset')}
              >
                <div style={{ fontSize: '24px', marginBottom: 'var(--space-3)', color: 'var(--muted)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-3.086-3.086a2 2 0 00-2.828 0L6 21" />
                  </svg>
                </div>
                <h3>Select Existing Asset</h3>
                <p>Choose from your Storyblok media library</p>
              </div>
              
              <div 
                className="choice-option"
                onClick={() => handleModeChoice('upload')}
              >
                <div style={{ fontSize: '24px', marginBottom: 'var(--space-3)', color: 'var(--muted)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <h3>Upload New Image</h3>
                <p>Upload an image file from your computer</p>
              </div>
              
              <div 
                className="choice-option"
                onClick={() => handleModeChoice('generate')}
              >
                <div style={{ fontSize: '24px', marginBottom: 'var(--space-3)', color: 'var(--muted)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h3>Generate New Image</h3>
                <p>Create an entirely new image from text description</p>
              </div>
            </div>
          </div>
        )
      case 'upload':
        return (
          <ImageUpload 
            onImageUpload={handleImageUpload}
            onBack={() => setCurrentStep('mode-choice')}
          />
        )
      case 'mode-select':
        if (!originalImage) return null
        return (
          <EditModeSelector
            onModeSelect={handleModeSelect}
            onBack={() => setCurrentStep('upload')}
            originalImage={originalImage}
            maskData={maskData}
          />
        )
      case 'mask-edit':
        if (!originalImage) return null
        return (
          <MaskEditor
            originalImage={originalImage}
            onMaskCreated={handleMaskCreated}
            onBack={() => setCurrentStep('mode-select')}
          />
        )
      case 'prompt':
        return (
          <PromptInput 
            onSubmit={handlePromptSubmit}
            onBack={() => {
              if (editMode === 'generate') {
                setCurrentStep('mode-choice')
              } else if (editMode === 'inpaint') {
                setCurrentStep('mask-edit')
              } else {
                setCurrentStep('mode-select')
              }
            }}
            originalImage={originalImage}
            editMode={editMode}
            maskData={maskData}
            actions={actions}
          />
        )
      case 'processing':
        return (
          <ImageProcessor 
            originalImage={originalImage}
            isProcessing={isProcessing}
            editMode={editMode}
            processedImage={editedImage}
            partialImage={partialImage}
            partialIndex={partialIndex}
            streamingProgress={streamingProgress}
            maskData={maskData}
            status={prompt ? `Processing: "${prompt}"` : 'Processing your image...'}
            onRetry={handleRetryPrompt}
            onCancel={handleStartOver}
          />
        )
      case 'preview':
        if (!editedImage) return null
        return (
          <ImagePreview
            originalImage={originalImage}
            editedImage={editedImage}
            prompt={prompt}
            altText={altText}
            editMode={editMode}
            maskData={maskData}
            onSaveToStoryblok={handleSaveToStoryblok}
            onStartOver={handleStartOver}
            isSaving={isProcessing}
            isGeneratingAltText={isGeneratingAltText}
            versions={versions}
            onRestoreVersion={handleRestoreVersion}
          />
        )
      case 'error':
        const displayError = generationError || error
        if (displayError) {
          return (
            <ErrorDisplay
              error={displayError}
              onStartOver={handleStartOver}
              onRetry={() => {
                setGenerationError(null)
                handleRetryPrompt()
              }}
              showRetry={!!lastPrompt && !generationError?.includes('API key')}
            />
          )
        }
        return null
    }
  }

  return (
    <div className="blockart-container">
      <div className="blockart-content">
        <h1 className="blockart-title">BlockArt</h1>
        {renderCurrentStage()}
      </div>
      
      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast notification-${notification.type}`}>
          <div className="notification-content">
            <div className="notification-icon">
              {notification.type === 'success' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
              )}
              {notification.type === 'error' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
              {notification.type === 'info' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              )}
            </div>
            <span className="notification-message">{notification.message}</span>
            <button 
              className="notification-close"
              onClick={() => setNotification(null)}
              aria-label="Close notification"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlockArt 