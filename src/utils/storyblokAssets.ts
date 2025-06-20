import { StoryblokAsset } from '../types/BlockArt'
import { dataURLToBlob } from './imageUtils'

export class StoryblokAssetsAPI {
  private spaceId: string
  private managementToken: string

  constructor(spaceId: string, managementToken: string) {
    this.spaceId = spaceId
    this.managementToken = managementToken
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.managementToken}`,
      'Content-Type': 'application/json'
    }
  }

  async getAssets(page = 1, perPage = 25): Promise<{ assets: StoryblokAsset[], total: number }> {
    try {
      const response = await fetch(
        `https://mapi.storyblok.com/v1/spaces/${this.spaceId}/assets?page=${page}&per_page=${perPage}&search_term=&filter_query[content_type]=image/`,
        {
          headers: this.headers
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        assets: data.assets || [],
        total: data.total || 0
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
      throw new Error('Failed to fetch Storyblok assets')
    }
  }

  async uploadAsset(
    imageData: string, 
    filename: string, 
    altText?: string,
    title?: string
  ): Promise<StoryblokAsset> {
    try {
      // Convert base64 to blob
      const blob = dataURLToBlob(imageData)
      
      // Create form data
      const formData = new FormData()
      formData.append('asset', blob, filename)
      
      if (altText) {
        formData.append('alt', altText)
      }
      
      if (title) {
        formData.append('title', title)
      }

      const response = await fetch(
        `https://mapi.storyblok.com/v1/spaces/${this.spaceId}/assets`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.managementToken}`
            // Don't set Content-Type for FormData, let browser set it with boundary
          },
          body: formData
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to upload asset: ${response.statusText}. ${errorData.message || ''}`)
      }

      const data = await response.json()
      return data.asset || data
    } catch (error) {
      console.error('Error uploading asset:', error)
      throw new Error(`Failed to upload asset to Storyblok: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateAsset(
    assetId: number, 
    updates: { alt?: string; title?: string; copyright?: string }
  ): Promise<StoryblokAsset> {
    try {
      const response = await fetch(
        `https://mapi.storyblok.com/v1/spaces/${this.spaceId}/assets/${assetId}`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify(updates)
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to update asset: ${response.statusText}`)
      }

      const data = await response.json()
      return data.asset || data
    } catch (error) {
      console.error('Error updating asset:', error)
      throw new Error('Failed to update Storyblok asset')
    }
  }

  async deleteAsset(assetId: number): Promise<void> {
    try {
      const response = await fetch(
        `https://mapi.storyblok.com/v1/spaces/${this.spaceId}/assets/${assetId}`,
        {
          method: 'DELETE',
          headers: this.headers
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to delete asset: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      throw new Error('Failed to delete Storyblok asset')
    }
  }

  async getAsset(assetId: number): Promise<StoryblokAsset> {
    try {
      const response = await fetch(
        `https://mapi.storyblok.com/v1/spaces/${this.spaceId}/assets/${assetId}`,
        {
          headers: this.headers
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch asset: ${response.statusText}`)
      }

      const data = await response.json()
      return data.asset || data
    } catch (error) {
      console.error('Error fetching asset:', error)
      throw new Error('Failed to fetch Storyblok asset')
    }
  }
}

// Helper function to get asset URL for display
export const getAssetUrl = (asset: StoryblokAsset): string => {
  return asset.file?.url || asset.url || ''
}

// Helper function to generate filename from prompt
export const generateFilename = (originalFilename: string, prompt: string): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const sanitizedPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30)
  
  const extension = originalFilename.split('.').pop() || 'png'
  return `blockart-${sanitizedPrompt}-${timestamp}.${extension}`
} 