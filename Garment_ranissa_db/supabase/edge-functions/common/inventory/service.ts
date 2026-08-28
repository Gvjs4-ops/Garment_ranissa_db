import { SupabaseClient } from "npm:@supabase/supabase-js@2";

import {
  InventoryMovementRequest,
  InventoryTransferRequest,
  StockLookupRequest,
} from "./types.ts";

export class InventoryService {
  constructor(
    private readonly supabase: SupabaseClient
  ) {}

  // --------------------------------------------------
  // STOCK RECEIPT
  // --------------------------------------------------

  async receiveStock(
    request: InventoryMovementRequest
  ) {

    const { error } = await this.supabase.rpc(
      "inventory_in",
      {
        p_company_id: request.companyId,
        p_warehouse_id: request.warehouseId,
        p_item_id: request.itemId,
        p_quantity: request.quantity,
        p_unit_cost: request.unitCost,
        p_reference_type: request.referenceType,
        p_reference_id: request.referenceId,
        p_remarks: request.remarks ?? null,
      }
    );

    if (error) throw error;

    return true;
  }

  // --------------------------------------------------
  // STOCK ISSUE
  // --------------------------------------------------

  async issueStock(
    request: InventoryMovementRequest
  ) {

    const { error } = await this.supabase.rpc(
      "inventory_out",
      {
        p_company_id: request.companyId,
        p_warehouse_id: request.warehouseId,
        p_item_id: request.itemId,
        p_quantity: request.quantity,
        p_unit_cost: request.unitCost,
        p_reference_type: request.referenceType,
        p_reference_id: request.referenceId,
        p_remarks: request.remarks ?? null,
      }
    );

    if (error) throw error;

    return true;
  }

  // --------------------------------------------------
  // WAREHOUSE TRANSFER
  // --------------------------------------------------

  async transferStock(
    request: InventoryTransferRequest
  ) {

    const { error } = await this.supabase.rpc(
      "inventory_transfer",
      {
        p_company_id: request.companyId,
        p_from_warehouse: request.fromWarehouseId,
        p_to_warehouse: request.toWarehouseId,
        p_item_id: request.itemId,
        p_quantity: request.quantity,
        p_unit_cost: request.unitCost,
        p_reference_type: request.referenceType,
        p_reference_id: request.referenceId,
      }
    );

    if (error) throw error;

    return true;
  }

  // --------------------------------------------------
  // STOCK ON HAND
  // --------------------------------------------------

  async getStockOnHand(
    request: StockLookupRequest
  ): Promise<number> {

    const { data, error } = await this.supabase.rpc(
      "get_stock_on_hand",
      {
        p_company_id: request.companyId,
        p_warehouse_id: request.warehouseId,
        p_item_id: request.itemId,
      }
    );

    if (error) throw error;

    return Number(data ?? 0);
  }

  // --------------------------------------------------
  // AVAILABLE STOCK
  // --------------------------------------------------

  async getAvailableStock(
    request: StockLookupRequest
  ): Promise<number> {

    const { data, error } = await this.supabase.rpc(
      "get_available_stock",
      {
        p_company_id: request.companyId,
        p_warehouse_id: request.warehouseId,
        p_item_id: request.itemId,
      }
    );

    if (error) throw error;

    return Number(data ?? 0);
  }

  // --------------------------------------------------
  // RECALCULATE STOCK
  // --------------------------------------------------

  async recalculateBalance(
    companyId: string,
    warehouseId: string,
    itemId: string
  ) {

    const { error } = await this.supabase.rpc(
      "recalculate_inventory_balance",
      {
        p_company_id: companyId,
        p_warehouse_id: warehouseId,
        p_item_id: itemId,
      }
    );

    if (error) throw error;

    return true;
  }

  // --------------------------------------------------
  // INVENTORY BALANCE
  // --------------------------------------------------

  async getInventoryBalance(
    companyId: string,
    warehouseId?: string
  ) {

    let query = this.supabase
      .from("inventory_balance")
      .select("*")
      .eq("company_id", companyId);

    if (warehouseId) {
      query = query.eq("warehouse_id", warehouseId);
    }

    const { data, error } = await query
      .order("item_id");

    if (error) throw error;

    return data;
  }

  // --------------------------------------------------
  // INVENTORY HISTORY
  // --------------------------------------------------

  async getInventoryHistory(
    companyId: string,
    itemId: string,
    warehouseId?: string
  ) {

    let query = this.supabase
      .from("inventory_transaction")
      .select("*")
      .eq("company_id", companyId)
      .eq("item_id", itemId);

    if (warehouseId) {
      query = query.eq("warehouse_id", warehouseId);
    }

    const { data, error } = await query
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return data;
  }

  // --------------------------------------------------
  // STOCK RESERVATION (Future)
  // --------------------------------------------------

  async reserveStock() {
    throw new Error(
      "reserveStock() not implemented."
    );
  }

  async releaseReservation() {
    throw new Error(
      "releaseReservation() not implemented."
    );
  }

  // --------------------------------------------------
  // STOCK ADJUSTMENT (Future)
  // --------------------------------------------------

  async adjustStock() {
    throw new Error(
      "adjustStock() not implemented."
    );
  }
}