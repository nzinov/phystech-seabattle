import { DefaultGameConfig } from '../game/config';
import type { GameConfig, Ship } from '../game/types';

export interface SavedPlacement {
  id: string;
  name: string;
  config: GameConfig;
  shipTypes: (string | null)[][];
  createdAt: Date;
  lastUsed?: Date;
}

export interface PlacementSummary {
  id: string;
  name: string;
  createdAt: Date;
  lastUsed?: Date;
  shipCount: number;
  configName: string;
  config: GameConfig;
}

const STORAGE_KEY = 'seabattle-saved-placements';

class PlacementStorageService {
  private placements: SavedPlacement[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.placements = parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          lastUsed: p.lastUsed ? new Date(p.lastUsed) : undefined,
        }));
      }
    } catch (error) {
      console.warn('Failed to load saved placements:', error);
      this.placements = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.placements));
    } catch (error) {
      console.warn('Failed to save placements to storage:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private extractPlayerShipTypes(
    cells: (Ship | null)[][],
    playerID: number,
    config: GameConfig
  ): (string | null)[][] {
    const fieldSize = config.fieldSize;
    const shipTypeGrid: (string | null)[][] = [];

    // Initialize empty grid
    for (let x = 0; x < fieldSize; x++) {
      shipTypeGrid.push([]);
      for (let y = 0; y < fieldSize; y++) {
        shipTypeGrid[x].push(null);
      }
    }

    // Extract only ship types for the player
    for (let x = 0; x < fieldSize; x++) {
      for (let y = 0; y < fieldSize; y++) {
        const cell = cells[x][y];
        if (cell && cell.player === playerID) {
          shipTypeGrid[x][y] = cell.type;
        }
      }
    }

    return shipTypeGrid;
  }

  private getShipCount(shipTypes: (string | null)[][]): number {
    let count = 0;
    const fieldSize = shipTypes.length;
    for (let x = 0; x < fieldSize; x++) {
      for (let y = 0; y < fieldSize; y++) {
        if (shipTypes[x][y] !== null) {
          count++;
        }
      }
    }
    return count;
  }

  savePlacement(
    name: string,
    cells: (Ship | null)[][],
    playerID: number,
    config: GameConfig = DefaultGameConfig
  ): string {
    const id = this.generateId();
    const shipTypes = this.extractPlayerShipTypes(cells, playerID, config);

    const placement: SavedPlacement = {
      id,
      name: name.trim() || `Placement ${this.placements.length + 1}`,
      config,
      shipTypes,
      createdAt: new Date(),
    };

    this.placements.unshift(placement);

    // Keep only the most recent 10 placements
    if (this.placements.length > 10) {
      this.placements = this.placements.slice(0, 10);
    }

    this.saveToStorage();
    return id;
  }

  loadPlacement(id: string): SavedPlacement | null {
    const placement = this.placements.find(p => p.id === id);
    if (placement) {
      // Update last used timestamp
      placement.lastUsed = new Date();
      this.saveToStorage();
      return placement;
    }
    return null;
  }

  getSavedPlacements(): PlacementSummary[] {
    return this.placements.map(p => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      lastUsed: p.lastUsed,
      shipCount: this.getShipCount(p.shipTypes),
      configName: p.config.name,
      config: p.config,
    }));
  }

  deletePlacement(id: string): boolean {
    const index = this.placements.findIndex(p => p.id === id);
    if (index !== -1) {
      this.placements.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  renamePlacement(id: string, newName: string): boolean {
    const placement = this.placements.find(p => p.id === id);
    if (placement) {
      placement.name = newName.trim() || placement.name;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  clearAllPlacements(): void {
    this.placements = [];
    this.saveToStorage();
  }

  isCompatibleConfig(placementConfig: GameConfig, currentConfig: GameConfig): boolean {
    return (
      placementConfig.fieldSize === currentConfig.fieldSize &&
      placementConfig.placementZoneSize === currentConfig.placementZoneSize &&
      JSON.stringify(placementConfig.initialShips) === JSON.stringify(currentConfig.initialShips)
    );
  }

  getPlacementShipTypes(id: string): (string | null)[][] | null {
    const placement = this.placements.find(p => p.id === id);
    return placement ? placement.shipTypes : null;
  }
}

export const placementStorage = new PlacementStorageService();
