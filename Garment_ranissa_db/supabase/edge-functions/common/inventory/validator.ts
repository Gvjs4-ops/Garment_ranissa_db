import {
  validateRequest,
  validateRequired,
  validateUUID,
  validatePositiveNumber,
} from "../common/validation.ts";

import {
  InventoryMovementRequest,
  InventoryTransferRequest,
  StockLookupRequest,
} from "./types.ts";

import { InventoryService } from "./service.ts";

export class InventoryValidator {

  constructor(
    private readonly inventoryService: InventoryService
  ) {}

  //--------------------------------------------------
  // RECEIVE STOCK
  //--------------------------------------------------

  async validateReceiveStock(
    request: InventoryMovementRequest
  ) {

    const validation = validateRequest([

      validateRequired(request.companyId, "Company"),

      validateRequired(request.warehouseId, "Warehouse"),

      validateRequired(request.itemId, "Item"),

      validateRequired(request.referenceType, "Reference Type"),

      validateRequired(request.referenceId, "Reference Id"),

      validateUUID(request.companyId, "Company"),

      validateUUID(request.warehouseId, "Warehouse"),

      validateUUID(request.itemId, "Item"),

      validateUUID(request.referenceId, "Reference Id"),

      validatePositiveNumber(request.quantity, "Quantity"),

      validatePositiveNumber(request.unitCost, "Unit Cost"),

    ]);

    if (!validation.valid) {
      return validation;
    }

    return validation;

  }

  //--------------------------------------------------
  // ISSUE STOCK
  //--------------------------------------------------

  async validateIssueStock(
    request: InventoryMovementRequest
  ) {

    const validation =
      await this.validateReceiveStock(request);

    if (!validation.valid) {
      return validation;
    }

    const available =
      await this.inventoryService.getAvailableStock({

        companyId: request.companyId,

        warehouseId: request.warehouseId,

        itemId: request.itemId,

      });

    if (available < request.quantity) {

      validation.valid = false;

      validation.errors.push(
        "Insufficient stock available."
      );

    }

    return validation;

  }

  //--------------------------------------------------
  // TRANSFER
  //--------------------------------------------------

  async validateTransfer(

    request: InventoryTransferRequest

  ) {

    const validation = validateRequest([

      validateUUID(
        request.companyId,
        "Company"
      ),

      validateUUID(
        request.fromWarehouseId,
        "Source Warehouse"
      ),

      validateUUID(
        request.toWarehouseId,
        "Destination Warehouse"
      ),

      validateUUID(
        request.itemId,
        "Item"
      ),

      validateUUID(
        request.referenceId,
        "Reference Id"
      ),

      validatePositiveNumber(
        request.quantity,
        "Quantity"
      ),

      validatePositiveNumber(
        request.unitCost,
        "Unit Cost"
      )

    ]);

    if (!validation.valid) {

      return validation;

    }

    if (
      request.fromWarehouseId ===
      request.toWarehouseId
    ) {

      validation.valid = false;

      validation.errors.push(
        "Source and destination warehouse cannot be the same."
      );

    }

    const available =
      await this.inventoryService.getAvailableStock({

        companyId: request.companyId,

        warehouseId: request.fromWarehouseId,

        itemId: request.itemId

      });

    if (available < request.quantity) {

      validation.valid = false;

      validation.errors.push(
        "Insufficient stock available for transfer."
      );

    }

    return validation;

  }

  //--------------------------------------------------
  // STOCK LOOKUP
  //--------------------------------------------------

  async validateLookup(

    request: StockLookupRequest

  ) {

    return validateRequest([

      validateUUID(
        request.companyId,
        "Company"
      ),

      validateUUID(
        request.warehouseId,
        "Warehouse"
      ),

      validateUUID(
        request.itemId,
        "Item"
      )

    ]);

  }

}