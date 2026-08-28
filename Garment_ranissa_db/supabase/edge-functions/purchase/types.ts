export interface PurchaseOrderItem {

  itemId: string;

  orderedQuantity: number;

  unitPrice: number;

  discountPercent?: number;

  taxPercent?: number;

  remarks?: string;

}

export interface PurchaseOrderRequest {

  supplierId: string;

  orderDate: string;

  expectedDate: string;

  currencyCode: string;

  warehouseId: string;

  remarks?: string;

  items: PurchaseOrderItem[];

}

export interface ApprovePurchaseOrderRequest {

  purchaseOrderId: string;

}

export interface GoodsReceiptItem {

  purchaseOrderItemId: string;

  itemId: string;

  receivedQuantity: number;

  unitCost: number;

}

export interface GoodsReceiptRequest {

  purchaseOrderId: string;

  warehouseId: string;

  receivedDate: string;

  remarks?: string;

  items: GoodsReceiptItem[];

}