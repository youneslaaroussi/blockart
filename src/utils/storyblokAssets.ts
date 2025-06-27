import { StoryblokAsset } from '../types/BlockArt'
import { dataURLToBlob } from './imageUtils'

type StoryblokRegion = 'us' | 'eu' | 'ca' | 'ap' | 'cn'

interface StoryblokSignedResponse {
  id: number
  post_url: string
  fields: {
    [key: string]: string
  }
}

interface StoryblokUploadResult {
  asset: {
    id: number
    filename: string
    content_type: string
    content_length: number
    alt?: string
    title?: string
  }
}

export class StoryblokAssetsAPI {
  private spaceId: string
  private managementToken: string
  private baseUrl: string

  constructor(spaceId: string, managementToken: string, region?: StoryblokRegion) {
    this.spaceId = spaceId
    this.managementToken = managementToken
    this.baseUrl = this.getBaseUrl(region)
  }

  private getBaseUrl(region?: StoryblokRegion): string {
    switch (region) {
      case 'us':
        return 'https://api-us.storyblok.com/v1'
      case 'ca':
        return 'https://api-ca.storyblok.com/v1'
      case 'ap':
        return 'https://api-ap.storyblok.com/v1'
      case 'cn':
        return 'https://api.storyblokchina.cn/v1'
      case 'eu':
      default:
        return 'https://mapi.storyblok.com/v1'
    }
  }

  private get headers() {
    return {
      'Authorization': this.managementToken,
      'Content-Type': 'application/json'
    }
  }

  async getAssets(page = 1, perPage = 25): Promise<{ assets: StoryblokAsset[], total: number }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/spaces/${this.spaceId}/assets?page=${page}&per_page=${perPage}&search_term=&filter_query[content_type]=image/`,
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
    title?: string,
    assetFolderId?: number
  ): Promise<StoryblokAsset> {
    try {
      // Convert base64 to blob
      const blob = dataURLToBlob(imageData)
      
      // Step 1: Get signed response object
      const signedResponse = await this.getSignedResponse(filename, assetFolderId)
      
      // Step 2: Upload to Amazon S3
      await this.uploadToS3(signedResponse, blob, filename)
      
      // Step 3: Finalize upload
      const asset = await this.finalizeUpload(signedResponse.id, altText, title)
      
      return asset
    } catch (error) {
      console.error('Error uploading asset:', error)
      throw new Error(`Failed to upload asset to Storyblok: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async getSignedResponse(
    filename: string, 
    assetFolderId?: number
  ): Promise<any> {
    const body: any = {
      filename,
      validate_upload: 1
    }

    if (assetFolderId) {
      body.asset_folder_id = assetFolderId
    }

    const response = await fetch(
      `${this.baseUrl}/spaces/${this.spaceId}/assets/`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to get signed response: ${response.statusText}. ${errorData.message || ''}`)
    }

    return await response.json()
  }

  private async uploadToS3(signedResponse: any, blob: Blob, filename: string): Promise<void> {
    const formData = new FormData()
    
    // Apply all fields from the signed response object
    for (const key in signedResponse.fields) {
      formData.append(key, signedResponse.fields[key])
    }
    
    // Append the file
    formData.append('file', blob, filename)

    const response = await fetch(signedResponse.post_url, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Failed to upload to S3: ${response.statusText}`)
    }
  }

  private async finalizeUpload(
    signedResponseId: string, 
    altText?: string, 
    title?: string
  ): Promise<StoryblokAsset> {
    const response = await fetch(
      `${this.baseUrl}/spaces/${this.spaceId}/assets/${signedResponseId}/finish_upload`,
      {
        method: 'GET',
        headers: this.headers
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Failed to finalize upload: ${response.statusText}. ${errorData.message || ''}`)
    }

    let asset = await response.json()
    asset = asset.asset || asset

    // Update asset with alt text and title if provided
    if (altText || title) {
      const updates: any = {}
      if (altText) updates.alt = altText
      if (title) updates.title = title
      
      console.log('Updating asset with metadata:', updates)
      asset = await this.updateAsset(asset.id, updates)
      console.log('Asset updated with metadata:', asset)
    }

    return asset
  }

  async updateAsset(
    assetId: number,
    updates: { alt?: string; title?: string; copyright?: string },
  ): Promise<StoryblokAsset> {
    try {
      const payload = {
        meta_data: { ...updates },
      }

      const response = await fetch(
        `${this.baseUrl}/spaces/${this.spaceId}/assets/${assetId}`,
        {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(
          `Failed to update asset: ${response.statusText} - ${errorBody}`,
        )
      }

      // The PUT response can be inconsistent (sometimes empty, sometimes stale data).
      // The most reliable way to get the updated asset is to re-fetch it.
      console.log('Asset update request successful. Re-fetching asset to ensure fresh data.')
      return this.getAsset(assetId)
    } catch (error) {
      console.error('Error updating asset:', error)
      throw new Error(`Failed to update Storyblok asset: ${error instanceof Error ? error.message : 'Check console for details'}`)
    }
  }

  async deleteAsset(assetId: number): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/spaces/${this.spaceId}/assets/${assetId}`,
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
        `${this.baseUrl}/spaces/${this.spaceId}/assets/${assetId}`,
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

const getApiBaseUrl = (region: 'us' | 'eu' | 'ca' | 'ap' | 'cn' | undefined) => {
  switch (region) {
    case 'us':
      return 'https://api-us.storyblok.com'
    case 'ca':
      return 'https://api-ca.storyblok.com'
    case 'ap':
      return 'https://api-ap.storyblok.com'
    case 'cn':
      return 'https://app.storyblokchina.cn'
    case 'eu':
    default:
      return 'https://mapi.storyblok.com'
  }
}

// Convert base64 to blob
const base64ToBlob = (base64Data: string, contentType: string = 'image/png'): Blob => {
  const byteCharacters = atob(base64Data.split(',')[1])
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: contentType })
}

export const uploadImageToStoryblok = async (
  imageBase64: string,
  filename: string,
  spaceId: string,
  managementToken: string,
  region: 'us' | 'eu' | 'ca' | 'ap' | 'cn' | undefined,
  assetFolderId?: number
): Promise<string> => {
  try {
    const baseUrl = getApiBaseUrl(region)
    
    // Convert base64 to blob to get the size
    const blob = base64ToBlob(imageBase64)
    
    // Step 1: Get signed response
    // The `size` parameter seems to expect dimensions (e.g., "400x500") which we don't have.
    // Omitting it, as the API should determine size after upload.
    const signedResponsePayload: any = {
      filename: filename,
      validate_upload: 1
    }
    
    if (assetFolderId) {
      signedResponsePayload.asset_folder_id = assetFolderId
    }
    
    const signedResponse = await fetch(`${baseUrl}/v1/spaces/${spaceId}/assets/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': managementToken,
      },
      body: JSON.stringify(signedResponsePayload)
    })

    if (!signedResponse.ok) {
      throw new Error(`Failed to get signed response: ${signedResponse.statusText}`)
    }

    const signedData: StoryblokSignedResponse = await signedResponse.json()

    // Step 2: Upload to S3
    const formData = new FormData()
    
    // Add all fields from signed response
    for (const [key, value] of Object.entries(signedData.fields)) {
      formData.append(key, value)
    }
    
    // Add the file
    formData.append('file', blob, filename)

    const uploadResponse = await fetch(signedData.post_url, {
      method: 'POST',
      body: formData
    })

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload to S3: ${uploadResponse.statusText}`)
    }

    // Step 3: Finalize upload
    const finalizeResponse = await fetch(`${baseUrl}/v1/spaces/${spaceId}/assets/${signedData.id}/finish_upload`, {
      method: 'GET',
      headers: {
        'Authorization': managementToken,
      }
    })

    if (!finalizeResponse.ok) {
      throw new Error(`Failed to finalize upload: ${finalizeResponse.statusText}`)
    }

    const finalizeData: StoryblokAsset = await finalizeResponse.json()
    
    // The finalize response is the asset object itself, not nested.
    return finalizeData.filename
    
  } catch (error) {
    console.error('Error uploading to Storyblok:', error)
    throw error
  }
} 