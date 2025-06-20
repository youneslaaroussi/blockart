import { FunctionComponent, useState, useEffect } from 'react'
import { StoryblokAsset } from '../../types/BlockArt'
import { StoryblokAssetsAPI, getAssetUrl } from '../../utils/storyblokAssets'

interface AssetSelectorProps {
  onAssetSelect: (imageData: string, asset: StoryblokAsset) => void
  onClose: () => void
  spaceId: string
  managementToken: string
}

const AssetSelector: FunctionComponent<AssetSelectorProps> = ({ 
  onAssetSelect, 
  onClose,
  spaceId,
  managementToken 
}) => {
  const [assets, setAssets] = useState<StoryblokAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null)

  const assetsAPI = new StoryblokAssetsAPI(spaceId, managementToken)

  useEffect(() => {
    loadAssets()
  }, [page])

  const loadAssets = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await assetsAPI.getAssets(page, 24)
      
      if (page === 1) {
        setAssets(result.assets)
      } else {
        setAssets(prev => [...prev, ...result.assets])
      }
      
      setTotal(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets')
    } finally {
      setLoading(false)
    }
  }

  const handleAssetClick = async (asset: StoryblokAsset) => {
    setSelectedAssetId(asset.id)
    
    try {
      const imageUrl = getAssetUrl(asset)
      if (!imageUrl) {
        throw new Error('Asset URL not found')
      }

      // Convert the asset URL to base64 for consistent handling
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onAssetSelect(reader.result, asset)
        }
      }
      reader.readAsDataURL(blob)
    } catch (err) {
      setError('Failed to load selected asset')
    } finally {
      setSelectedAssetId(null)
    }
  }

  const loadMore = () => {
    if (!loading && assets.length < total) {
      setPage(prev => prev + 1)
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
                className={`asset-item ${selectedAssetId === asset.id ? 'loading' : ''}`}
                onClick={() => handleAssetClick(asset)}
              >
                <div className="asset-image">
                  <img
                    src={getAssetUrl(asset)}
                    alt={asset.alt || asset.filename}
                    loading="lazy"
                  />
                  {selectedAssetId === asset.id && (
                    <div className="asset-loading">
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>
                <div className="asset-info">
                  <div className="asset-filename">{asset.filename}</div>
                  {asset.alt && (
                    <div className="asset-alt">{asset.alt}</div>
                  )}
                  <div className="asset-meta">
                    {Math.round(asset.content_length / 1024)}KB
                  </div>
                </div>
              </div>
            ))}
          </div>

          {assets.length < total && (
            <div className="load-more-container">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={loadMore}
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