export interface BlockArtData {
  originalImage: string | null
  editedImage: string | null
  prompt: string
  apiKey: string
  altText?: string
  versions: ImageVersion[]
  storyblokAssetId?: number
  originalAssetId?: number
}

export interface ImageVersion {
  id: string
  imageData: string
  prompt: string
  altText?: string
  timestamp: number
  storyblokAssetId?: number
}

export interface StoryblokAsset {
  id: number
  filename: string
  content_type: string
  content_length: number
  alt?: string
  title?: string
  copyright?: string
  focus?: string
  created_at: string
  updated_at: string
  file?: {
    url: string
  }
  url?: string
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