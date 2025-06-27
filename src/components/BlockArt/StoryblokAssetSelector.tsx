import { FunctionComponent, useState, useEffect } from 'react'

interface StoryblokAsset {
  id: number
  filename: string // This is the URL
  alt: string | null
  title: string | null
  content_type?: string
}

interface StoryblokAssetSelectorProps {
  spaceId: string
  managementToken: string
  region: 'us' | 'eu' | 'ca' | 'ap' | 'cn' | undefined
  onAssetSelect: (assetUrl: string) => void
  onBack: () => void
}

const getApiBaseUrl = (region: StoryblokAssetSelectorProps['region']) => {
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


const StoryblokAssetSelector: FunctionComponent<StoryblokAssetSelectorProps> = ({
  spaceId,
  managementToken,
  region,
  onAssetSelect,
  onBack,
}) => {
  const [assets, setAssets] = useState<StoryblokAsset[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAssets = async () => {
      if (!spaceId || !managementToken) {
        setError('Space ID or Management Token is missing.')
        setLoading(false)
        return
      }

      const baseUrl = getApiBaseUrl(region)
      const url = `${baseUrl}/v1/spaces/${spaceId}/assets/`

      try {
        setLoading(true)
        const response = await fetch(url, {
          headers: {
            Authorization: managementToken,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch assets: ${response.statusText}`)
        }

        const data = await response.json()
        // We only want to show images
        const imageAssets = data.assets.filter((asset: StoryblokAsset) => 
          asset.content_type && asset.content_type.startsWith('image/')
        )
        setAssets(imageAssets)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'An unknown error occurred.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [spaceId, managementToken, region])

  return (
    <div className="storyblok-asset-selector">
      <div className="step-header">
        <h2>Select an Existing Asset</h2>
        <p>Choose an image from your Storyblok asset library.</p>
      </div>

      {loading && <p>Loading assets...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {!loading && !error && (
        <div className="asset-grid">
          {assets.length === 0 ? (
            <p>No images found in your asset library.</p>
          ) : (
            assets.map((asset) => (
              <div
                key={asset.id}
                className="asset-item"
                onClick={() => onAssetSelect(asset.filename)}
              >
                <img src={asset.filename} alt={asset.alt || asset.title || `Asset ${asset.id}`} />
                <div className="asset-title">{asset.title || asset.filename.split('/').pop()}</div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="step-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  )
}

export default StoryblokAssetSelector 