export interface BlockArtData {
  originalImage: string | null
  editedImage: string | null
  prompt: string
  apiKey: string
}

export interface ImageEditRequest {
  image: string
  prompt: string
  model?: string
  n?: number
  size?: '1024x1024' | '1792x1024' | '1024x1792'
}

export interface ImageEditResponse {
  url: string
} 