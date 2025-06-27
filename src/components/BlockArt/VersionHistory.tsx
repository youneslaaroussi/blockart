import { FunctionComponent } from 'react'
import { BlockArtVersion } from '../../types/BlockArt'

interface VersionHistoryProps {
  versions: BlockArtVersion[]
  onRestore: (version: BlockArtVersion) => void
}

const VersionHistory: FunctionComponent<VersionHistoryProps> = ({ versions, onRestore }) => {
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`
    } else if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const truncatePrompt = (prompt: string): string => {
    return prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt
  }

  const getMethodIcon = (editMode: 'full' | 'inpaint' | 'generate') => {
    switch (editMode) {
      case 'generate':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )
      case 'inpaint':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3"/>
            <path d="M9 15h3l8.5-8.5a2.12 2.12 0 00-3-3L9 12v3z"/>
            <path d="M16 5l3 3"/>
          </svg>
        )
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2z"/>
            <path d="M16 12h-4l-2-2-2 2h4v4"/>
          </svg>
        )
    }
  }

  const getMethodName = (editMode: 'full' | 'inpaint' | 'generate') => {
    switch (editMode) {
      case 'generate': return 'Generated'
      case 'inpaint': return 'Inpaint'
      case 'full': return 'Full Edit'
      default: return 'Edit'
    }
  }

  const sortedVersions = [...versions].sort((a, b) => b.timestamp - a.timestamp)

  if (versions.length === 0) {
    return null
  }

  return (
    <div className="version-history-panel">
      <ul className="version-list">
        {sortedVersions.map((version, index) => (
          <li key={version.timestamp} className="version-item">
            <img 
              src={version.imageUrl} 
              alt={`Version ${index + 1}`} 
              className="version-thumbnail" 
            />
            
            <div className="version-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--muted)' }}>
                  {getMethodIcon(version.editMode)}
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: '500' }}>
                    {getMethodName(version.editMode)}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-light)' }}>
                  {formatDate(version.timestamp)}
                </div>
              </div>
              
              <div className="version-prompt">
                "{truncatePrompt(version.prompt)}"
              </div>
              
              {version.altText && (
                <div style={{ 
                  fontSize: 'var(--text-xs)', 
                  color: 'var(--muted-light)', 
                  marginTop: 'var(--space-1)',
                  fontStyle: 'italic'
                }}>
                  {version.altText.length > 40 ? version.altText.substring(0, 40) + '...' : version.altText}
                </div>
              )}
            </div>
            
            <button 
              className="action-btn-icon"
              onClick={() => onRestore(version)}
              title="Restore this version"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 10.9-4"/>
                <path d="M21 12a9 9 0 10-.9 4"/>
                <path d="M8 12l4-4 4 4"/>
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default VersionHistory 