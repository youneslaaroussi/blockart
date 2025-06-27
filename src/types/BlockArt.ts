export interface BlockArtVersion {
  imageUrl: string
  prompt: string
  altText?: string
  timestamp: number
  editMode: 'full' | 'inpaint' | 'generate'
}

export interface BlockArtData {
  originalImage: string | null
  editedImage: string | null  // This will now contain Storyblok asset URL instead of base64
  prompt: string
  altText?: string
  versions: BlockArtVersion[]
  storyblokAssetId?: number  // ID of the generated image asset
  originalAssetId?: number   // ID of the original image asset (if uploaded)
  editMode: 'full' | 'inpaint' | 'generate'
  mask: string | null
  status: 'empty' | 'setup' | 'in-progress' | 'completed' | 'error'
  lastUpdated: number
}

export interface ImageVersion {
  id: string
  imageData: string
  prompt: string
  altText?: string
  timestamp: number
  storyblokAssetId?: number
  editMode?: 'full' | 'inpaint' | 'generate'
  mask?: string | null
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