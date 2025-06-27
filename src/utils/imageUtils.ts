export const convertImageToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  return new Blob([u8arr], { type: mime })
}

export const resizeImage = (
  file: File, 
  maxWidth: number = 1024, 
  maxHeight: number = 1024, 
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      const dataURL = canvas.toDataURL('image/jpeg', quality)
      resolve(dataURL)
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  return validTypes.includes(file.type) && file.size <= maxSize
}

export const getImageDimensions = (dataUrl: string): Promise<{ width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => {
      reject(new Error('Failed to load image for dimension check'))
    }
    img.src = dataUrl
  })
}

export const createMaskWithAlphaChannel = (
  maskCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): string => {
  // Create a new canvas at the target dimensions
  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = targetWidth
  finalCanvas.height = targetHeight
  const ctx = finalCanvas.getContext('2d')
  if (!ctx) throw new Error('Could not create canvas context')

  // Scale the mask canvas to the target dimensions
  ctx.drawImage(maskCanvas, 0, 0, targetWidth, targetHeight)

  // Get the image data and ensure proper alpha channel
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
  const data = imageData.data

  // Process the image data to create proper mask format
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    if (alpha > 0) {
      // White with full alpha for masked areas
      data[i] = 255     // R
      data[i + 1] = 255 // G
      data[i + 2] = 255 // B
      data[i + 3] = 255 // A
    } else {
      // Transparent for unmasked areas
      data[i] = 0       // R
      data[i + 1] = 0   // G
      data[i + 2] = 0   // B
      data[i + 3] = 0   // A
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return finalCanvas.toDataURL('image/png')
}

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // Handle CORS issues
    img.onload = () => resolve(img)
    img.onerror = (error) => {
      console.error('Failed to load image:', src, error)
      reject(new Error(`Failed to load image: ${src}`))
    }
    img.src = src
  })
}

// Iframe-safe version that doesn't use crossOrigin
export const loadImageForIframe = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Don't set crossOrigin for iframe contexts
    img.onload = () => resolve(img)
    img.onerror = (error) => {
      console.error('Failed to load image:', src, error)
      reject(new Error(`Failed to load image: ${src}`))
    }
    img.src = src
  })
}

// Decode compact mask format
export const decodeMask = (maskString: string): { width: number, height: number, data: Uint8Array } | null => {
  if (!maskString.startsWith('MASK:')) {
    return null
  }
  
  try {
    const parts = maskString.substring(5).split(':')
    const [dimensions, runsString] = parts
    const [width, height] = dimensions.split('x').map(Number)
    const runs = runsString.split(',').map(Number)
    
    const totalPixels = width * height
    const data = new Uint8Array(totalPixels)
    
    let pixelIndex = 0
    let currentValue = 0 // Start with black (0)
    
    for (const runLength of runs) {
      for (let i = 0; i < runLength && pixelIndex < totalPixels; i++) {
        data[pixelIndex++] = currentValue
      }
      currentValue = 1 - currentValue // Toggle between 0 and 1
    }
    
    return { width, height, data }
  } catch (error) {
    console.error('Failed to decode mask:', error)
    return null
  }
}

export const createMaskOverlay = async (
  originalImageSrc: string, 
  maskSrc: string,
  maxWidth = 800,
  maxHeight = 600
): Promise<string | null> => {
  try {
    // Check if this is our compact mask format
    if (maskSrc.startsWith('MASK:')) {
      return createMaskOverlayFromCompact(originalImageSrc, maskSrc, maxWidth, maxHeight)
    }
    
    // Fallback to original approach for backward compatibility
    // First try the standard approach
    const [originalImg, maskImg] = await Promise.all([
      loadImage(originalImageSrc),
      loadImage(maskSrc)
    ])

    // Calculate display dimensions while maintaining aspect ratio
    const aspectRatio = originalImg.width / originalImg.height
    let displayWidth = Math.min(maxWidth, originalImg.width)
    let displayHeight = displayWidth / aspectRatio
    
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight
      displayWidth = maxHeight * aspectRatio
    }

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = displayWidth
    canvas.height = displayHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Draw original image
    ctx.drawImage(originalImg, 0, 0, displayWidth, displayHeight)
    
    // Create temporary canvas for mask processing
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = maskImg.width
    tempCanvas.height = maskImg.height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) {
      throw new Error('Could not get temporary canvas context')
    }

    // Draw mask to temporary canvas
    tempCtx.drawImage(maskImg, 0, 0)
    const maskImageData = tempCtx.getImageData(0, 0, maskImg.width, maskImg.height)

    // Apply red overlay where mask is white
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'

    // Scale factors to map mask coordinates to display coordinates
    const scaleX = displayWidth / maskImg.width
    const scaleY = displayHeight / maskImg.height

    // Apply overlay pixel by pixel (optimized for better performance)
    const imageData = ctx.getImageData(0, 0, displayWidth, displayHeight)
    const overlayData = new Uint8ClampedArray(imageData.data)

    for (let y = 0; y < displayHeight; y++) {
      for (let x = 0; x < displayWidth; x++) {
        // Map display coordinates back to mask coordinates
        const maskX = Math.floor(x / scaleX)
        const maskY = Math.floor(y / scaleY)
        
        if (maskX < maskImg.width && maskY < maskImg.height) {
          const maskIndex = (maskY * maskImg.width + maskX) * 4
          const displayIndex = (y * displayWidth + x) * 4
          
          // Check if mask pixel is white (masked area)
          const r = maskImageData.data[maskIndex]
          const g = maskImageData.data[maskIndex + 1]
          const b = maskImageData.data[maskIndex + 2]
          const a = maskImageData.data[maskIndex + 3]
          
          if (r > 200 && g > 200 && b > 200 && a > 0) {
            // Apply red overlay
            overlayData[displayIndex] = Math.min(255, overlayData[displayIndex] + 100)     // R
            overlayData[displayIndex + 1] = Math.max(0, overlayData[displayIndex + 1] - 50) // G
            overlayData[displayIndex + 2] = Math.max(0, overlayData[displayIndex + 2] - 50) // B
          }
        }
      }
    }

    // Put the modified image data back
    const finalImageData = new ImageData(overlayData, displayWidth, displayHeight)
    ctx.putImageData(finalImageData, 0, 0)

    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Standard mask overlay failed, trying iframe-safe approach:', error)
    // Fallback to iframe-safe approach
    return createMaskOverlayIframeSafe(originalImageSrc, maskSrc, maxWidth, maxHeight)
  }
}

// New efficient function for compact mask format
export const createMaskOverlayFromCompact = async (
  originalImageSrc: string, 
  maskString: string,
  maxWidth = 800,
  maxHeight = 600
): Promise<string | null> => {
  try {
    // Load original image
    const originalImg = await loadImageForIframe(originalImageSrc)
    
    // Decode mask
    const maskData = decodeMask(maskString)
    if (!maskData) {
      throw new Error('Failed to decode mask data')
    }
    
    // Calculate display dimensions while maintaining aspect ratio
    const aspectRatio = originalImg.width / originalImg.height
    let displayWidth = Math.min(maxWidth, originalImg.width)
    let displayHeight = displayWidth / aspectRatio
    
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight
      displayWidth = maxHeight * aspectRatio
    }

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = displayWidth
    canvas.height = displayHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Draw original image
    ctx.drawImage(originalImg, 0, 0, displayWidth, displayHeight)
    
    // Apply red overlay where mask is white (value = 1)
    const imageData = ctx.getImageData(0, 0, displayWidth, displayHeight)
    const overlayData = new Uint8ClampedArray(imageData.data)

    // Scale factors to map mask coordinates to display coordinates
    const scaleX = displayWidth / maskData.width
    const scaleY = displayHeight / maskData.height

    // Apply overlay efficiently
    for (let y = 0; y < displayHeight; y++) {
      for (let x = 0; x < displayWidth; x++) {
        // Map display coordinates back to mask coordinates
        const maskX = Math.floor(x / scaleX)
        const maskY = Math.floor(y / scaleY)
        
        if (maskX < maskData.width && maskY < maskData.height) {
          const maskIndex = maskY * maskData.width + maskX
          const displayIndex = (y * displayWidth + x) * 4
          
          // Check if mask pixel is white (1)
          if (maskData.data[maskIndex] === 1) {
            // Apply red overlay
            overlayData[displayIndex] = Math.min(255, overlayData[displayIndex] + 100)     // R
            overlayData[displayIndex + 1] = Math.max(0, overlayData[displayIndex + 1] - 50) // G
            overlayData[displayIndex + 2] = Math.max(0, overlayData[displayIndex + 2] - 50) // B
          }
        }
      }
    }

    // Put the modified image data back
    const finalImageData = new ImageData(overlayData, displayWidth, displayHeight)
    ctx.putImageData(finalImageData, 0, 0)

    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Compact mask overlay failed:', error)
    return null
  }
}

// Iframe-safe version of mask overlay
export const createMaskOverlayIframeSafe = async (
  originalImageSrc: string, 
  maskSrc: string,
  maxWidth = 800,
  maxHeight = 600
): Promise<string | null> => {
  try {
    // Use iframe-safe image loading
    const [originalImg, maskImg] = await Promise.all([
      loadImageForIframe(originalImageSrc),
      loadImageForIframe(maskSrc)
    ])

    // Calculate display dimensions while maintaining aspect ratio
    const aspectRatio = originalImg.width / originalImg.height
    let displayWidth = Math.min(maxWidth, originalImg.width)
    let displayHeight = displayWidth / aspectRatio
    
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight
      displayWidth = maxHeight * aspectRatio
    }

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = displayWidth
    canvas.height = displayHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    try {
      // Draw original image
      ctx.drawImage(originalImg, 0, 0, displayWidth, displayHeight)
      
      // Create temporary canvas for mask processing
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = maskImg.width
      tempCanvas.height = maskImg.height
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) {
        throw new Error('Could not get temporary canvas context')
      }

      // Draw mask to temporary canvas
      tempCtx.drawImage(maskImg, 0, 0)
      const maskImageData = tempCtx.getImageData(0, 0, maskImg.width, maskImg.height)

      // Apply red overlay where mask is white
      const imageData = ctx.getImageData(0, 0, displayWidth, displayHeight)
      const overlayData = new Uint8ClampedArray(imageData.data)

      // Scale factors to map mask coordinates to display coordinates
      const scaleX = displayWidth / maskImg.width
      const scaleY = displayHeight / maskImg.height

      // Apply overlay pixel by pixel
      for (let y = 0; y < displayHeight; y++) {
        for (let x = 0; x < displayWidth; x++) {
          // Map display coordinates back to mask coordinates
          const maskX = Math.floor(x / scaleX)
          const maskY = Math.floor(y / scaleY)
          
          if (maskX < maskImg.width && maskY < maskImg.height) {
            const maskIndex = (maskY * maskImg.width + maskX) * 4
            const displayIndex = (y * displayWidth + x) * 4
            
            // Check if mask pixel is white (masked area)
            const r = maskImageData.data[maskIndex]
            const g = maskImageData.data[maskIndex + 1]
            const b = maskImageData.data[maskIndex + 2]
            const a = maskImageData.data[maskIndex + 3]
            
            if (r > 200 && g > 200 && b > 200 && a > 0) {
              // Apply red overlay
              overlayData[displayIndex] = Math.min(255, overlayData[displayIndex] + 100)     // R
              overlayData[displayIndex + 1] = Math.max(0, overlayData[displayIndex + 1] - 50) // G
              overlayData[displayIndex + 2] = Math.max(0, overlayData[displayIndex + 2] - 50) // B
            }
          }
        }
      }

      // Put the modified image data back
      const finalImageData = new ImageData(overlayData, displayWidth, displayHeight)
      ctx.putImageData(finalImageData, 0, 0)

      return canvas.toDataURL('image/png')
    } catch (canvasError) {
      console.error('Canvas operations failed in iframe context:', canvasError)
      // Return a basic CSS-based overlay approach
      return null
    }
  } catch (error) {
    console.error('Iframe-safe mask overlay failed:', error)
    return null
  }
}

// Simpler CSS-based approach as fallback
export const getMaskOverlayStyle = (maskSrc: string) => ({
  position: 'relative' as const,
  '&::after': {
    content: '""',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(${maskSrc})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    mixBlendMode: 'multiply' as const,
    opacity: 0.3,
    pointerEvents: 'none' as const
  }
})

// Convert compact mask back to PNG data URL for API usage
export const convertCompactMaskToPNG = (maskString: string): string | null => {
  const maskData = decodeMask(maskString)
  if (!maskData) {
    return null
  }
  
  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = maskData.width
  canvas.height = maskData.height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return null
  }
  
  // Create image data
  const imageData = ctx.createImageData(maskData.width, maskData.height)
  const data = imageData.data
  
  // Fill image data - white for masked areas (1), black for unmasked (0)
  for (let i = 0; i < maskData.data.length; i++) {
    const pixelIndex = i * 4
    if (maskData.data[i] === 1) {
      // White pixel (masked area)
      data[pixelIndex] = 255     // R
      data[pixelIndex + 1] = 255 // G
      data[pixelIndex + 2] = 255 // B
      data[pixelIndex + 3] = 255 // A
    } else {
      // Black pixel (unmasked area)
      data[pixelIndex] = 0       // R
      data[pixelIndex + 1] = 0   // G
      data[pixelIndex + 2] = 0   // B
      data[pixelIndex + 3] = 255 // A
    }
  }
  
  // Put image data and convert to PNG
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
} 