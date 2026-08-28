import { SupabaseClient } from "npm:@supabase/supabase-js@2";

import {
  PurchaseOrderRequest,
  GoodsReceiptRequest,
} from "./types.ts";

import {
  DocumentType,
  generateDocumentNumber,
} from "../common/document-service.ts";

import { InventoryService } from "../inventory/service.ts";

export class PurchaseService {

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly inventoryService: InventoryService
  ) {}

  //--------------------------------------------------
  // CREATE PURCHASE ORDER
  //--------------------------------------------------

  async createPurchaseOrder(
    request: PurchaseOrderRequest,
    companyId: string
  ) {

    const documentNumber =
      await generateDocumentNumber(
        this.supabase,
        companyId,
        DocumentType.PURCHASE_ORDER
      );

    const { data, error } =
      await this.supabase
        .from("purchase_order")
        .insert({

          company_id: companyId,

          purchase_order_number: documentNumber,

          supplier_id: request.supplierId,

          order_date: request.orderDate,

          expected_date: request.expectedDate,

          warehouse_id: request.warehouseId,

          currency_code: request.currencyCode,

          remarks: request.remarks,

          status: "DRAFT",

        })
        .select()
        .single();

    if (error) throw error;

    for (let i = 0; i < request.items.length; i++) {

      const item = request.items[i];

      const { error: lineError } =
        await this.supabase
          .from("purchase_order_item")
          .insert({

            purchase_order_id: data.id,

            line_no: i + 1,

            item_id: item.itemId,

            ordered_quantity: item.orderedQuantity,

            unit_price: item.unitPrice,

            discount_percent:
              item.discountPercent ?? 0,

            tax_percent:
              item.taxPercent ?? 0,

            remarks: item.remarks,

          });

      if (lineError) throw lineError;

    }

    return data;

  }

  //--------------------------------------------------
  // APPROVE PURCHASE ORDER
  //--------------------------------------------------

  async approvePurchaseOrder(
    purchaseOrderId: string
  ) {

    const { error } =
      await this.supabase
        .from("purchase_order")
        .update({

          status: "APPROVED",

          approved_at: new Date().toISOString(),

        })
        .eq("id", purchaseOrderId);

    if (error) throw error;

    return true;

  }

  //--------------------------------------------------
  // RECEIVE GOODS
  //--------------------------------------------------

  async receiveGoods(
    request: GoodsReceiptRequest,
    companyId: string
  ) {

    const grnNumber =
      await generateDocumentNumber(
        this.supabase,
        companyId,
        DocumentType.GOODS_RECEIPT
      );

    const { data: receipt, error } =
      await this.supabase
        .from("goods_receipt")
        .insert({

          company_id: companyId,

          purchase_order_id:
            request.purchaseOrderId,

          warehouse_id:
            request.warehouseId,

          goods_receipt_number:
            grnNumber,

          receipt_date:
            request.receivedDate,

          remarks:
            request.remarks,

          status: "POSTED",

        })
        .select()
        .single();

    if (error) throw error;

    for (const line of request.items) {

      await this.supabase
        .from("goods_receipt_item")
        .insert({

          goods_receipt_id: receipt.id,

          purchase_order_item_id:
            line.purchaseOrderItemId,

          item_id: line.itemId,

          accepted_quantity:
            line.receivedQuantity,

          unit_cost:
            line.unitCost,

        });

      await this.inventoryService.receiveStock({

        companyId,

        warehouseId:
          request.warehouseId,

        itemId:
          line.itemId,

        quantity:
          line.receivedQuantity,

        unitCost:
          line.unitCost,

        referenceType:
          "GOODS_RECEIPT",

        referenceId:
          receipt.id,

        remarks:
          "Purchase Receipt",

      });

    }

    return receipt;

  }

  //--------------------------------------------------
  // CANCEL PURCHASE ORDER
  //--------------------------------------------------

  async cancelPurchaseOrder(
    purchaseOrderId: string
  ) {

    const { error } =
      await this.supabase
        .from("purchase_order")
        .update({

          status: "CANCELLED",

        })
        .eq("id", purchaseOrderId);

    if (error) throw error;

    return true;

  }

  //--------------------------------------------------
  // GET PURCHASE ORDER
  //--------------------------------------------------

  async getPurchaseOrder(
    purchaseOrderId: string
  ) {

    const { data, error } =
      await this.supabase
        .from("purchase_order")
        .select(`
          *,
          purchase_order_item(*)
        `)
        .eq("id", purchaseOrderId)
        .single();

    if (error) throw error;

    return data;

  }

  //--------------------------------------------------
  // LIST PURCHASE ORDERS
  //--------------------------------------------------

  async listPurchaseOrders(
    companyId: string
  ) {

    const { data, error } =
      await this.supabase
        .from("purchase_order")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", {
          ascending: false,
        });

    if (error) throw error;

    return data;

  }

}