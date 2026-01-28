import { ShelfSlot, Product } from '@/types/game';

export interface ShelfConfig {
  rows: number;
  slotsPerRow: number;
  slotWidth: number;
  slotHeight: number;
  shelfHeight: number;
  topMargin: number;
  leftMargin: number;
}

/**
 * Manages shelf state and operations
 */
export class ShelfManager {
  private slots: ShelfSlot[] = [];
  private config: ShelfConfig;

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    rows: number = 4,
    slotsPerRow: number = 5,
    overrides: Partial<ShelfConfig> = {}
  ) {
    const slotHeight = overrides.slotHeight ?? 80;
    const topMargin = overrides.topMargin ?? 80;
    const slotWidth = overrides.slotWidth ?? canvasWidth / slotsPerRow;
    const shelfHeight = overrides.shelfHeight ?? rows * slotHeight;
    const leftMargin = overrides.leftMargin ?? 0;

    this.config = {
      rows,
      slotsPerRow,
      slotWidth,
      slotHeight,
      shelfHeight,
      topMargin, // Space from top for UI
      leftMargin,
      ...overrides,
    };

    this.initializeSlots();
  }

  private initializeSlots(): void {
    this.slots = [];
    const startY = this.config.topMargin;

    for (let shelfIndex = 0; shelfIndex < this.config.rows; shelfIndex++) {
      for (let slotIndex = 0; slotIndex < this.config.slotsPerRow; slotIndex++) {
        const x = this.config.leftMargin + (slotIndex + 0.5) * this.config.slotWidth;
        const y = startY + (shelfIndex + 0.5) * this.config.slotHeight;

        this.slots.push({
          id: `slot_${shelfIndex}_${slotIndex}`,
          shelfIndex,
          slotIndex,
          occupied: false,
          x,
          y,
        });
      }
    }
  }

  /**
   * Get all slots
   */
  getSlots(): ShelfSlot[] {
    return this.slots;
  }

  /**
   * Get nearest empty slot to a given position
   */
  getNearestEmptySlot(x: number, y: number): ShelfSlot | null {
    const emptySlots = this.slots.filter(slot => !slot.occupied);

    if (emptySlots.length === 0) {
      return null;
    }

    // Find the slot with minimum distance
    return emptySlots.reduce((nearest, slot) => {
      const distToNearest = Math.hypot(nearest.x - x, nearest.y - y);
      const distToSlot = Math.hypot(slot.x - x, slot.y - y);
      return distToSlot < distToNearest ? slot : nearest;
    });
  }

  /**
   * Get a specific slot by ID
   */
  getSlot(slotId: string): ShelfSlot | undefined {
    return this.slots.find(slot => slot.id === slotId);
  }

  /**
   * Occupy a shelf slot with a product
   */
  occupySlot(slotId: string, productId: string): boolean {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot || slot.occupied) {
      return false;
    }

    slot.occupied = true;
    slot.productId = productId;
    return true;
  }

  /**
   * Release a shelf slot
   */
  releaseSlot(slotId: string): string | null {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot) {
      return null;
    }

    const productId = slot.productId || null;
    slot.occupied = false;
    slot.productId = undefined;
    return productId;
  }

  /**
   * Get all occupied products on shelf
   */
  getOccupiedProducts(): string[] {
    return this.slots
      .filter(slot => slot.occupied && slot.productId)
      .map(slot => slot.productId!);
  }

  /**
   * Get remaining empty slots count
   */
  getEmptySlotCount(): number {
    return this.slots.filter(slot => !slot.occupied).length;
  }

  /**
   * Check if shelf is full
   */
  isShelfFull(): boolean {
    return this.getEmptySlotCount() === 0;
  }

  /**
   * Get config
   */
  getConfig(): ShelfConfig {
    return this.config;
  }

  /**
   * Reset all slots
   */
  reset(): void {
    this.initializeSlots();
  }
}
