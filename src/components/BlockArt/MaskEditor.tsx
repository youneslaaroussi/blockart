import { FunctionComponent, useRef, useState, useEffect } from 'react'

interface MaskEditorProps {
  originalImage: string
  onMaskCreated: (maskData: string) => void
  onBack: () => void
}

const MaskEditor: FunctionComponent<MaskEditorProps> = ({
  originalImage,
  onMaskCreated,
  onBack
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const baseCanvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(30)
  const [tool, setTool] = useState<'paint' | 'erase'>('paint')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 })
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

  // Load and setup the image
  useEffect(() => {
    const baseCanvas = baseCanvasRef.current
    const maskCanvas = maskCanvasRef.current
    const container = containerRef.current
    if (!baseCanvas || !maskCanvas || !container) return

    const baseCtx = baseCanvas.getContext('2d')
    const maskCtx = maskCanvas.getContext('2d')
    if (!baseCtx || !maskCtx) return

    const img = new Image()
    img.onload = () => {
      setImageNaturalSize({ width: img.width, height: img.height })
      
      // Calculate the display size to fit within container while maintaining aspect ratio
      const containerRect = container.getBoundingClientRect()
      const maxWidth = Math.min(800, containerRect.width - 40) // Leave some padding
      const maxHeight = 600
      
      const aspectRatio = img.width / img.height
      let displayWidth = maxWidth
      let displayHeight = maxWidth / aspectRatio
      
      if (displayHeight > maxHeight) {
        displayHeight = maxHeight
        displayWidth = maxHeight * aspectRatio
      }
      
      // Set both canvases to the same display size
      baseCanvas.width = displayWidth
      baseCanvas.height = displayHeight
      baseCanvas.style.width = `${displayWidth}px`
      baseCanvas.style.height = `${displayHeight}px`
      
      maskCanvas.width = displayWidth
      maskCanvas.height = displayHeight
      maskCanvas.style.width = `${displayWidth}px`
      maskCanvas.style.height = `${displayHeight}px`
      
      setCanvasSize({ width: displayWidth, height: displayHeight })
      
      // Draw the image on the base canvas
      baseCtx.drawImage(img, 0, 0, displayWidth, displayHeight)
      
      // Set up mask canvas for drawing
      maskCtx.lineCap = 'round'
      maskCtx.lineJoin = 'round'
      
      setImageLoaded(true)
    }
    
    img.onerror = () => {
      console.error('Failed to load image for mask editor')
    }
    
    img.src = originalImage
  }, [originalImage])

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return null

    const rect = maskCanvas.getBoundingClientRect()
    let clientX: number, clientY: number

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else if ('clientX' in e) {
      clientX = e.clientX
      clientY = e.clientY
    } else {
      return null
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const maskCanvas = maskCanvasRef.current
    const ctx = maskCanvas?.getContext('2d')
    if (!ctx) return

    ctx.save()
    
    if (tool === 'paint') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = 'rgb(255, 0, 0)' // Fully opaque red
      ctx.lineWidth = brushSize
    } else {
      ctx.globalCompositeOperation = 'destination-out' // This only erases the mask layer
      ctx.lineWidth = brushSize
    }
    
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    
    ctx.restore()
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const point = getCanvasPoint(e)
    if (!point) return

    setIsDrawing(true)
    setLastPoint(point)
    
    // Draw a single point for immediate feedback
    const maskCanvas = maskCanvasRef.current
    const ctx = maskCanvas?.getContext('2d')
    if (!ctx) return

    ctx.save()
    
    if (tool === 'paint') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgb(255, 0, 0)' // Fully opaque red
    } else {
      ctx.globalCompositeOperation = 'destination-out' // Only erases mask layer
    }
    
    ctx.beginPath()
    ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.restore()
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing || !lastPoint) return

    const point = getCanvasPoint(e)
    if (!point) return

    drawLine(lastPoint, point)
    setLastPoint(point)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setLastPoint(null)
  }

  const clearMask = () => {
    const maskCanvas = maskCanvasRef.current
    const ctx = maskCanvas?.getContext('2d')
    if (!ctx || !maskCanvas || !imageLoaded) return

    // Clear only the mask canvas, leaving the base image intact
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
  }

  const generateMask = () => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return

    // Create a mask canvas at the original image resolution
    const finalMaskCanvas = document.createElement('canvas')
    finalMaskCanvas.width = imageNaturalSize.width
    finalMaskCanvas.height = imageNaturalSize.height
    const finalMaskCtx = finalMaskCanvas.getContext('2d')
    if (!finalMaskCtx) return

    // Scale up the mask canvas to original image size
    finalMaskCtx.drawImage(maskCanvas, 0, 0, imageNaturalSize.width, imageNaturalSize.height)
    
    // Get the scaled mask data
    const maskImageData = finalMaskCtx.getImageData(0, 0, imageNaturalSize.width, imageNaturalSize.height)
    
    // Instead of storing as data URL, use run-length encoding for efficiency
    const maskData = []
    let currentPixel = 0 // 0 = black, 1 = white
    let runLength = 0
    
    for (let i = 0; i < maskImageData.data.length; i += 4) {
      const r = maskImageData.data[i]
      const g = maskImageData.data[i + 1]
      const b = maskImageData.data[i + 2]
      const a = maskImageData.data[i + 3]
      
      // Check if this pixel is red (painted area) -> should be white in mask
      const isWhite = (r > 200 && g < 100 && b < 100 && a > 0) ? 1 : 0
      
      if (isWhite === currentPixel) {
        runLength++
      } else {
        // Push the run
        maskData.push(runLength)
        currentPixel = isWhite
        runLength = 1
      }
    }
    // Push the final run
    maskData.push(runLength)
    
    // Create a compact mask representation
    const compactMask = {
      width: imageNaturalSize.width,
      height: imageNaturalSize.height,
      runs: maskData,
      startsWith: 0 // Always start with black (0)
    }
    
    // Convert to a much smaller string representation
    const maskString = `MASK:${compactMask.width}x${compactMask.height}:${compactMask.runs.join(',')}`
    
    onMaskCreated(maskString)
  }

  return (
    <div className="mask-editor-new">
      <div className="step-header">
        <h2>Create Mask</h2>
        <p>Paint over the areas you want to edit. Red areas will be modified by AI.</p>
      </div>

      <div className="mask-editor-workspace">
        {/* Canvas Container */}
        <div className="canvas-container" ref={containerRef}>
          {!imageLoaded && (
            <div className="canvas-loading">
              <div className="spinner"></div>
              <p>Loading image...</p>
            </div>
          )}
          
          {/* Base image canvas */}
          <canvas
            ref={baseCanvasRef}
            className={`mask-canvas-base ${imageLoaded ? 'loaded' : ''}`}
            style={{
              position: 'absolute',
              zIndex: 1
            }}
          />
          
          {/* Mask overlay canvas */}
          <canvas
            ref={maskCanvasRef}
            className={`mask-canvas-overlay ${imageLoaded ? 'loaded' : ''}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ 
              cursor: tool === 'paint' ? 'crosshair' : 'copy',
              touchAction: 'none',
              position: 'absolute',
              zIndex: 2
            }}
          />
        </div>

        {/* Toolbar */}
        <div className="mask-toolbar">
          <div className="toolbar-section">
            <div className="toolbar-title">Tools</div>
            <div className="tool-buttons-new">
              <button
                className={`tool-btn-new ${tool === 'paint' ? 'active' : ''}`}
                onClick={() => setTool('paint')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/>
                  <path d="m7.07 14.94-1.13 1.13a3 3 0 0 1-4.24 0l-1.06-1.06a3 3 0 0 1 0-4.24l1.13-1.13"/>
                </svg>
                Paint
              </button>
              <button
                className={`tool-btn-new ${tool === 'erase' ? 'active' : ''}`}
                onClick={() => setTool('erase')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
                  <path d="M22 21H7"/>
                  <path d="m5 11 9 9"/>
                </svg>
                Erase
              </button>
            </div>
          </div>

          <div className="toolbar-section">
            <div className="toolbar-title">Brush Size: {brushSize}px</div>
            <input
              type="range"
              min="5"
              max="80"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="brush-slider-new"
            />
          </div>

          <div className="toolbar-section">
            <button
              className="btn btn-secondary btn-small"
              onClick={clearMask}
              disabled={!imageLoaded}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
              Clear All
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mask-instructions">
          <div className="instruction-item">
            <div className="instruction-icon paint">●</div>
            <span>Paint red areas over parts you want to edit</span>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon erase">◌</div>
            <span>Use eraser to remove painted areas (not the image)</span>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon tip">💡</div>
            <span>Only red areas will be modified by AI</span>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button 
          className="btn btn-secondary"
          onClick={onBack}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <button 
          className="btn btn-primary"
          onClick={generateMask}
          disabled={!imageLoaded}
        >
          Continue
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14"/>
            <path d="M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default MaskEditor 