import { FunctionComponent, useState } from 'react'
import { useFieldPlugin } from '@storyblok/field-plugin/react'
import ApiKeyInput from './ApiKeyInput'
import ImageUpload from './ImageUpload'
import PromptInput from './PromptInput'
import ImageProcessor from './ImageProcessor'
import ImagePreview from './ImagePreview'
import { useOpenAI, StreamingUpdate } from '../../hooks/useOpenAI'
import { BlockArtData } from '../../types/BlockArt'
import './BlockArt.css'

const BlockArt: FunctionComponent = () => {
  const { type, data, actions } = useFieldPlugin({
    enablePortalModal: true,
    validateContent: (content: unknown) => ({
      content: content as BlockArtData || { 
        originalImage: null, 
        editedImage: null, 
        prompt: '', 
        apiKey: '' 
      },
    }),
  })

  const [currentStep, setCurrentStep] = useState<'setup' | 'upload' | 'prompt' | 'processing' | 'preview'>('setup')
  const [apiKey, setApiKey] = useState<string>(data?.content?.apiKey || '')
  const [originalImage, setOriginalImage] = useState<string | null>(data?.content?.originalImage || null)
  const [prompt, setPrompt] = useState<string>(data?.content?.prompt || '')
  const [editedImage, setEditedImage] = useState<string | null>(data?.content?.editedImage || null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [partialImage, setPartialImage] = useState<string | null>(null)
  const [partialIndex, setPartialIndex] = useState<number>(0)
  const [streamingProgress, setStreamingProgress] = useState<number>(0)

  const { processImageWithStreaming, error } = useOpenAI(apiKey)

  if (type !== 'loaded') {
    return null
  }

  const closeModal = () => {
    actions.setModalOpen(false)
  }

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key)
    setCurrentStep('upload')
  }

  const handleImageUpload = (imageData: string) => {
    setOriginalImage(imageData)
    setCurrentStep('prompt')
  }

  const handlePromptSubmit = async (promptText: string) => {
    setPrompt(promptText)
    setCurrentStep('processing')
    setIsProcessing(true)
    setPartialImage(null)
    setPartialIndex(0)
    setStreamingProgress(0)

    try {
      const result = await processImageWithStreaming(
        originalImage!, 
        promptText,
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
      setEditedImage(result)
      setCurrentStep('preview')
    } catch (err) {
      console.error('Error processing image:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddToDocument = () => {
    const blockArtData: BlockArtData = {
      originalImage,
      editedImage,
      prompt,
      apiKey,
      versions: []
    }
    actions.setContent(blockArtData)
    closeModal()
  }

  const handleStartOver = () => {
    setCurrentStep('setup')
    setOriginalImage(null)
    setEditedImage(null)
    setPrompt('')
    setPartialImage(null)
    setPartialIndex(0)
    setStreamingProgress(0)
  }

  return (
    <div className="blockart-container">
      {data.isModalOpen && (
        <button
          type="button"
          className="btn btn-close"
          onClick={closeModal}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1.75738 0.343176L0.343166 1.75739L4.58581 6.00003L0.343165 10.2427L1.75738 11.6569L6.00002 7.41424L10.2427 11.6569L11.6569 10.2427L7.41423 6.00003L11.6569 1.75739L10.2427 0.343176L6.00002 4.58582L1.75738 0.343176Z"
              fill="#1B243F"
            />
          </svg>
          <span className="sr-only">Close Modal</span>
        </button>
      )}

      <div className="blockart-content">
        <h1 className="blockart-title">BlockArt - AI Image Editor</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {currentStep === 'setup' && (
          <ApiKeyInput 
            onSubmit={handleApiKeySubmit}
            initialValue={apiKey}
          />
        )}

        {currentStep === 'upload' && (
          <ImageUpload 
            onImageUpload={handleImageUpload}
            onBack={() => setCurrentStep('setup')}
            spaceId={data?.spaceId?.toString()}
            managementToken={data?.options?.managementToken}
          />
        )}

        {currentStep === 'prompt' && (
          <PromptInput 
            onSubmit={handlePromptSubmit}
            onBack={() => setCurrentStep('upload')}
            originalImage={originalImage}
          />
        )}

        {currentStep === 'processing' && (
          <ImageProcessor 
            isProcessing={isProcessing}
            originalImage={originalImage}
            prompt={prompt}
            partialImage={partialImage}
            partialIndex={partialIndex}
            streamingProgress={streamingProgress}
          />
        )}

        {currentStep === 'preview' && (
          <ImagePreview
            originalImage={originalImage}
            editedImage={editedImage}
            prompt={prompt}
            onAddToDocument={handleAddToDocument}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </div>
  )
}

export default BlockArt 