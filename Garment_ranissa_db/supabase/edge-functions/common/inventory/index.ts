import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { getUserContext } from "../common/auth.ts";
import {
  success,
  error,
  serverError,
} from "../common/response.ts";

import { InventoryService } from "./service.ts";
import { InventoryValidator } from "./validator.ts";

serve(async (req: Request): Promise<Response> => {

  try {

    //--------------------------------------------------
    // AUTHENTICATION
    //--------------------------------------------------

    const { supabase, user } =
      await getUserContext(
        req.headers.get("Authorization")
      );

    //--------------------------------------------------
    // REQUEST
    //--------------------------------------------------

    const body = await req.json();

    const action = body.action;

    const inventoryService =
      new InventoryService(supabase);

    const validator =
      new InventoryValidator(
        inventoryService
      );

    //--------------------------------------------------
    // RECEIVE STOCK
    //--------------------------------------------------

    if (action === "receive") {

      body.companyId = user.companyId;

      const validation =
        await validator.validateReceiveStock(body);

      if (!validation.valid) {

        return error(
          "Validation Failed",
          400,
          validation.errors
        );

      }

      await inventoryService.receiveStock(body);

      return success(
        null,
        "Stock received successfully."
      );

    }

    //--------------------------------------------------
    // ISSUE STOCK
    //--------------------------------------------------

    if (action === "issue") {

      body.companyId = user.companyId;

      const validation =
        await validator.validateIssueStock(body);

      if (!validation.valid) {

        return error(
          "Validation Failed",
          400,
          validation.errors
        );

      }

      await inventoryService.issueStock(body);

      return success(
        null,
        "Stock issued successfully."
      );

    }

    //--------------------------------------------------
    // TRANSFER STOCK
    //--------------------------------------------------

    if (action === "transfer") {

      body.companyId = user.companyId;

      const validation =
        await validator.validateTransfer(body);

      if (!validation.valid) {

        return error(
          "Validation Failed",
          400,
          validation.errors
        );

      }

      await inventoryService.transferStock(body);

      return success(
        null,
        "Stock transferred successfully."
      );

    }

    //--------------------------------------------------
    // STOCK BALANCE
    //--------------------------------------------------

    if (action === "balance") {

      const data =
        await inventoryService.getInventoryBalance(
          user.companyId,
          body.warehouseId
        );

      return success(data);

    }

    //--------------------------------------------------
    // STOCK ON HAND
    //--------------------------------------------------

    if (action === "stock") {

      const qty =
        await inventoryService.getStockOnHand({

          companyId: user.companyId,

          warehouseId: body.warehouseId,

          itemId: body.itemId,

        });

      return success({
        quantity: qty,
      });

    }

    //--------------------------------------------------
    // AVAILABLE STOCK
    //--------------------------------------------------

    if (action === "available") {

      const qty =
        await inventoryService.getAvailableStock({

          companyId: user.companyId,

          warehouseId: body.warehouseId,

          itemId: body.itemId,

        });

      return success({
        quantity: qty,
      });

    }

    //--------------------------------------------------
    // INVENTORY HISTORY
    //--------------------------------------------------

    if (action === "history") {

      const data =
        await inventoryService.getInventoryHistory(

          user.companyId,

          body.itemId,

          body.warehouseId

        );

      return success(data);

    }

    //--------------------------------------------------
    // INVALID ACTION
    //--------------------------------------------------

    return error(
      "Invalid inventory action.",
      400
    );

  } catch (err) {

    return serverError(err);

  }

});