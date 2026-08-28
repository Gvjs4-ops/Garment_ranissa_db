export interface InventoryMovementRequest {
  companyId: string;
  warehouseId: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  referenceType: string;
  referenceId: string;
  remarks?: string;
}

export interface InventoryTransferRequest {
  companyId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  referenceType: string;
  referenceId: string;
  remarks?: string;
}

export interface InventoryBalance {
  itemId: string;
  warehouseId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  averageCost: number;
}

export interface StockLookupRequest {
  companyId: string;
  warehouseId: string;
  itemId: string;
}