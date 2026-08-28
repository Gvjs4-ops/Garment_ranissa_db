import { SupabaseClient } from "npm:@supabase/supabase-js@2";

export enum DocumentType {
  PURCHASE_ORDER = "PURCHASE_ORDER",
  GOODS_RECEIPT = "GOODS_RECEIPT",
  SALES_ORDER = "SALES_ORDER",
  DELIVERY_NOTE = "DELIVERY_NOTE",
  PRODUCTION_ORDER = "PRODUCTION_ORDER",
  MATERIAL_ISSUE = "MATERIAL_ISSUE",
  PRODUCTION_RECEIPT = "PRODUCTION_RECEIPT",
  STOCK_TRANSFER = "STOCK_TRANSFER",
  STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT",
  COST_SHEET = "COST_SHEET",
  JOURNAL_ENTRY = "JOURNAL_ENTRY",
  QUALITY_INSPECTION = "QUALITY_INSPECTION"
}

export enum DocumentStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  OPEN = "OPEN",
  APPROVED = "APPROVED",
  POSTED = "POSTED",
  COMPLETED = "COMPLETED",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED"
}

export async function generateDocumentNumber(
  supabase: SupabaseClient,
  companyId: string,
  documentType: DocumentType,
  financialYear?: string
): Promise<string> {

  const fy =
    financialYear ??
    `${new Date().getFullYear()}`;

  const { data, error } = await supabase.rpc(
    "generate_document_number",
    {
      p_company_id: companyId,
      p_document_type: documentType,
      p_financial_year: fy,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}

export function isEditable(
  status: DocumentStatus
): boolean {

  return [
    DocumentStatus.DRAFT,
    DocumentStatus.OPEN,
    DocumentStatus.PENDING
  ].includes(status);

}

export function isApprovable(
  status: DocumentStatus
): boolean {

  return status === DocumentStatus.DRAFT;

}

export function isPostable(
  status: DocumentStatus
): boolean {

  return status === DocumentStatus.APPROVED;

}

export function isCancellable(
  status: DocumentStatus
): boolean {

  return [
    DocumentStatus.DRAFT,
    DocumentStatus.PENDING,
    DocumentStatus.APPROVED
  ].includes(status);

}

export function isDeletable(
  status: DocumentStatus
): boolean {

  return status === DocumentStatus.DRAFT;

}

export function assertEditable(
  status: DocumentStatus
): void {

  if (!isEditable(status)) {
    throw new Error(
      `Document cannot be edited in '${status}' status.`
    );
  }

}

export function assertApprovable(
  status: DocumentStatus
): void {

  if (!isApprovable(status)) {
    throw new Error(
      `Document cannot be approved from '${status}' status.`
    );
  }

}

export function assertPostable(
  status: DocumentStatus
): void {

  if (!isPostable(status)) {
    throw new Error(
      `Document cannot be posted from '${status}' status.`
    );
  }

}

export function assertCancellable(
  status: DocumentStatus
): void {

  if (!isCancellable(status)) {
    throw new Error(
      `Document cannot be cancelled from '${status}' status.`
    );
  }

}

export function assertDeletable(
  status: DocumentStatus
): void {

  if (!isDeletable(status)) {
    throw new Error(
      `Document cannot be deleted in '${status}' status.`
    );
  }

}