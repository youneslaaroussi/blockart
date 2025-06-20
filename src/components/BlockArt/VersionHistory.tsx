import { FunctionComponent } from 'react'
import { ImageVersion } from '../../types/BlockArt'

interface VersionHistoryProps {
  versions: ImageVersion[]
  currentVersion?: string
  onVersionSelect: (version: ImageVersion) => void
  onVersionDelete: (versionId: string) => void
  onClose: () => void
}

const VersionHistory: FunctionComponent<VersionHistoryProps> = ({
  versions,
  currentVersion,
  onVersionSelect,
  onVersionDelete,
  onClose
}) => {
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString()
  }

  const truncatePrompt = (prompt: string, maxLength: number = 50): string => {
    return prompt.length > maxLength ? `${prompt.slice(0, maxLength)}...` : prompt
  }

  const sortedVersions = [...versions].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="version-history-overlay">
      <div className="version-history-modal">
        <div className="version-history-header">
          <h3>Version History</h3>
          <button
            type="button"
            className="btn btn-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="version-history-content">
          {sortedVersions.length === 0 ? (
            <div className="no-versions">
              <div className="no-versions-icon">🕒</div>
              <h4>No version history</h4>
              <p>Edit some images to see version history here.</p>
            </div>
          ) : (
            <div className="versions-list">
              {sortedVersions.map((version, index) => (
                <div
                  key={version.id}
                  className={`version-item ${currentVersion === version.id ? 'current' : ''}`}
                >
                  <div className="version-image">
                    <img
                      src={version.imageData}
                      alt={`Version ${index + 1}`}
                      loading="lazy"
                    />
                    {currentVersion === version.id && (
                      <div className="current-badge">Current</div>
                    )}
                  </div>

                  <div className="version-details">
                    <div className="version-meta">
                      <div className="version-date">
                        {formatDate(version.timestamp)}
                      </div>
                      {index === 0 && <div className="version-latest">Latest</div>}
                    </div>

                    <div className="version-prompt">
                      <strong>Prompt:</strong> {truncatePrompt(version.prompt)}
                    </div>

                    {version.altText && (
                      <div className="version-alt">
                        <strong>Alt Text:</strong> {version.altText}
                      </div>
                    )}

                    {version.storyblokAssetId && (
                      <div className="version-asset">
                        <span className="asset-badge">
                          📁 Asset #{version.storyblokAssetId}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="version-actions">
                    {currentVersion !== version.id && (
                      <button
                        type="button"
                        className="btn btn-small btn-secondary"
                        onClick={() => onVersionSelect(version)}
                        title="Revert to this version"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M21 3v5h-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M3 21v-5h5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Revert
                      </button>
                    )}

                    {versions.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-small btn-outline-danger"
                        onClick={() => onVersionDelete(version.id)}
                        title="Delete this version"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M3 6h18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="version-history-footer">
          <div className="version-info">
            <small>
              💡 Versions are stored locally in your browser session
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VersionHistory 