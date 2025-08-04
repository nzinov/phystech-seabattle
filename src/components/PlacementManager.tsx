import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { placementStorage, PlacementSummary } from '../utils/placementStorage';
import type { Ship, GameConfig } from '../game/types';
import i18n from '../i18n';
import './PlacementManager.css';

interface PlacementManagerProps {
  cells: (Ship | null)[][];
  playerID: number;
  config: GameConfig;
  onLoadPlacement: (placementId: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const PlacementManager: React.FC<PlacementManagerProps> = ({
  cells,
  playerID,
  config,
  onLoadPlacement,
  isVisible,
  onClose,
}) => {
  const { t } = useTranslation();
  const [placements, setPlacements] = useState<PlacementSummary[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    if (isVisible) {
      loadPlacements();
    }
  }, [isVisible]);

  const loadPlacements = () => {
    setPlacements(placementStorage.getSavedPlacements());
  };

  const handleSave = () => {
    if (saveName.trim()) {
      placementStorage.savePlacement(saveName.trim(), cells, playerID, config);
      setSaveName('');
      setSaveDialogOpen(false);
      loadPlacements();
    }
  };

  const handleLoad = (id: string) => {
    const placement = placementStorage.loadPlacement(id);

    if (placement) {
      try {
        onLoadPlacement(placement.id);
        onClose();
      } catch (error) {
        console.error('Failed to load placement:', error);
        alert(t('placement.loadError'));
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(t('placement.confirmDelete'))) {
      placementStorage.deletePlacement(id);
      loadPlacements();
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      placementStorage.renamePlacement(id, editName.trim());
      setEditingId(null);
      setEditName('');
      loadPlacements();
    }
  };

  const startEdit = (placement: PlacementSummary) => {
    setEditingId(placement.id);
    setEditName(placement.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();

    // Use browser's native Intl.RelativeTimeFormat for proper i18n
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });

    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (Math.abs(diffInYears) >= 1) {
      return rtf.format(-diffInYears, 'year');
    }
    if (Math.abs(diffInMonths) >= 1) {
      return rtf.format(-diffInMonths, 'month');
    }
    if (Math.abs(diffInWeeks) >= 1) {
      return rtf.format(-diffInWeeks, 'week');
    }
    if (Math.abs(diffInDays) >= 1) {
      return rtf.format(-diffInDays, 'day');
    }
    if (Math.abs(diffInHours) >= 1) {
      return rtf.format(-diffInHours, 'hour');
    }
    if (Math.abs(diffInMinutes) >= 1) {
      return rtf.format(-diffInMinutes, 'minute');
    }

    return rtf.format(-diffInSeconds, 'second');
  };

  const compatiblePlacements = placements.filter(p =>
    placementStorage.isCompatibleConfig(p.config, config)
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`placement-manager ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <div className="placement-manager-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h3>{t('placement.title')}</h3>
        <button className="placement-collapse-btn" type="button">
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="placement-manager-content">
          <div className="placement-actions">
            <button
              className="placement-btn placement-btn-save"
              onClick={() => setSaveDialogOpen(true)}
            >
              💾 {t('placement.save')}
            </button>
            {placements.length > 0 && (
              <button
                className="placement-btn placement-btn-clear"
                onClick={() => {
                  if (confirm(t('placement.confirmClearAll'))) {
                    placementStorage.clearAllPlacements();
                    loadPlacements();
                  }
                }}
              >
                🗑️ {t('placement.clearAll')}
              </button>
            )}
          </div>

          {saveDialogOpen && (
            <div className="placement-save-dialog">
              <input
                type="text"
                placeholder={t('placement.enterName')}
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSave();
                  } else if (e.key === 'Escape') {
                    setSaveDialogOpen(false);
                    setSaveName('');
                  }
                }}
                autoFocus
              />
              <div className="placement-save-dialog-actions">
                <button
                  className="placement-btn placement-btn-primary"
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                >
                  {t('placement.saveBtn')}
                </button>
                <button
                  className="placement-btn"
                  onClick={() => {
                    setSaveDialogOpen(false);
                    setSaveName('');
                  }}
                >
                  {t('placement.cancel')}
                </button>
              </div>
            </div>
          )}

          <div className="placement-list">
            {compatiblePlacements.length === 0 ? (
              <div className="placement-empty">
                <p>{t('placement.noSavedPlacements')}</p>
                <p className="placement-empty-hint">{t('placement.saveHint')}</p>
              </div>
            ) : (
              compatiblePlacements.map(placement => (
                <div key={placement.id} className="placement-item">
                  <div className="placement-item-main">
                    {editingId === placement.id ? (
                      <div className="placement-item-edit">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handleRename(placement.id);
                            } else if (e.key === 'Escape') {
                              cancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <div className="placement-item-edit-actions">
                          <button
                            className="placement-btn placement-btn-small placement-btn-primary"
                            onClick={() => handleRename(placement.id)}
                            disabled={!editName.trim()}
                          >
                            {t('placement.saveBtn')}
                          </button>
                          <button
                            className="placement-btn placement-btn-small"
                            onClick={cancelEdit}
                          >
                            {t('placement.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="placement-item-info">
                          <div className="placement-item-name">{placement.name}</div>
                          <div className="placement-item-details">
                            <span className="placement-item-date">
                              {t('placement.created')} {formatRelativeTime(placement.createdAt)}
                            </span>
                            {placement.lastUsed && (
                              <span className="placement-item-last-used">
                                {t('placement.used')} {formatRelativeTime(placement.lastUsed)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="placement-item-actions">
                          <button
                            className="placement-btn placement-btn-small placement-btn-primary"
                            onClick={() => handleLoad(placement.id)}
                            title={t('placement.load')}
                          >
                            {t('placement.load')}
                          </button>
                          <button
                            className="placement-btn placement-btn-small"
                            onClick={() => startEdit(placement)}
                            title={t('placement.rename')}
                          >
                            {t('placement.rename')}
                          </button>
                          <button
                            className="placement-btn placement-btn-small placement-btn-danger"
                            onClick={() => handleDelete(placement.id)}
                            title={t('placement.delete')}
                          >
                            {t('placement.delete')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementManager;
