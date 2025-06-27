import { FunctionComponent, useState, useEffect } from 'react'
import { StoryblokAsset } from '../../types/BlockArt'
import { StoryblokAssetsAPI } from '../../utils/storyblokAssets'

interface AssetSelectorProps {
  spaceId: string
  managementToken: string
  region?: 'us' | 'eu' | 'ca' | 'ap' | 'cn'
  onSelect: (asset: StoryblokAsset) => void
  onClose: () => void
}

const AssetSelector: FunctionComponent<AssetSelectorProps> = ({ 
  spaceId, 
  managementToken, 
  region,
  onSelect, 
  onClose 
}) => {
  const [assets, setAssets] = useState<StoryblokAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<StoryblokAsset | null>(null)

  useEffect(() => {
    const fetchInitialAssets = async () => {
      setLoading(true)
      const assetsAPI = new StoryblokAssetsAPI(spaceId, managementToken, region)
      try {
        const { assets: fetchedAssets, total } = await assetsAPI.getAssets(1, 100) // Fetch more initially
        setAssets(fetchedAssets)
        setTotal(total)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assets')
        setLoading(false)
      }
    }

    if (spaceId && managementToken) {
      fetchInitialAssets()
    }
  }, [spaceId, managementToken, region])

  const handleAssetClick = async (asset: StoryblokAsset) => {
    setSelectedAssetId(asset.id)
    
    try {
      const imageUrl = asset.filename
      if (!imageUrl) {
        throw new Error('Asset URL not found')
      }

      // Convert the asset URL to base64 for consistent handling
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onSelect(asset)
        }
      }
      reader.readAsDataURL(blob)
    } catch (err) {
      setError('Failed to load selected asset')
    } finally {
      setSelectedAssetId(null)
    }
  }

  const handleLoadMore = async () => {
    if (loading || assets.length >= total) return
    setLoading(true)
    const assetsAPI = new StoryblokAssetsAPI(spaceId, managementToken, region)
    try {
      const { assets: newAssets } = await assetsAPI.getAssets(page + 1, 25)
      setAssets(prev => [...prev, ...newAssets])
      setPage(prev => prev + 1)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more assets')
      setLoading(false)
    }
  }

  return (
    <div className="asset-selector-overlay">
      <div className="asset-selector-modal">
        <div className="asset-selector-header">
          <h3>Select from Storyblok Assets</h3>
          <button
            type="button"
            className="btn btn-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="asset-selector-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {assets.length === 0 && !loading && (
            <div className="no-assets">
              <div className="no-assets-icon">📁</div>
              <h4>No images found</h4>
              <p>Upload some images to your Storyblok space first.</p>
            </div>
          )}

          <div className="assets-grid">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className={`asset-item ${selectedAssetId === asset.id ? 'selected' : ''}`}
                onClick={() => handleAssetClick(asset)}
              >
                <img
                  src={asset.filename}
                  alt={asset.alt || 'Storyblok asset'}
                  className="asset-thumbnail"
                  loading="lazy"
                />
                <div className="asset-overlay">
                  <p className="asset-filename">{asset.title || asset.filename.split('/').pop()}</p>
                </div>
              </div>
            ))}
          </div>

          {assets.length < total && (
            <div className="load-more-container">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : `Load More (${assets.length}/${total})`}
              </button>
            </div>
          )}

          {loading && page === 1 && (
            <div className="assets-loading">
              <div className="spinner-large"></div>
              <p>Loading your Storyblok assets...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssetSelector 