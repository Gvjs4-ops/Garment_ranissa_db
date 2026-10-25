//const API_BASE_URL = "/api";
import { API_BASE_URL } from "../config/api";
import { apiFetch } from "../api/apiClient";
//-------------Exporting interfaces------------
export interface Company {
  id: string;
  company_code: string;
  name: string;
  legal_name: string | null;
  trade_name: string | null;
  business_type: string | null;
  industry: string | null;
  tax_id: string | null;
  registration_number: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  currency_code: string | null;
  timezone: string | null;
  fiscal_year_start_month: number | null;
  is_active: boolean;
}
export interface CompanyUpdatePayload {
  display_name: string;
  legal_name: string | null;
  trade_name: string | null;
  business_type: string | null;
  industry: string | null;
  tax_id: string | null;
  registration_number: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  currency_code: string | null;
  timezone: string | null;
  fiscal_year_start_month: number;
}
export interface SalesOrderCreate {
  company_id: string;
  customer_id: string;
  order_date: string;
}

export interface SalesOrderItem {
  id: string;
  product_id: string | null;

  sku?: string | null;
  style_code?: string | null;
  product_name?: string | null;
  color?: string | null;
  size?: string | null;

  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  total_amount: number;
  customer_id: string;
  customer_name: string | null;
  items?: SalesOrderItem[];
}

export interface SalesProduct {
  id: string;
  sku: string | null;
  style_code: string | null;
  product_name: string;
  color: string | null;
  size: string | null;
  selling_price: number;
}

export interface SalesOrderItemCreate {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface SalesOrderItemUpdate {
  quantity?: number;
  unit_price?: number;
}


export interface SalesOrderUpdate {
  customer_id?: string;
  order_date?: string;
  status?: string;
}


export interface SalesCustomer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  gst_number: string | null;
  credit_limit: number;
  is_active: boolean;
}

export interface CustomerCreate {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  gst_number?: string;
  credit_limit?: number;
}

export interface CustomerUpdate {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tax_number?: string | null;
  gst_number?: string | null;
  credit_limit?: number;
  is_active?: boolean;
}

//----------------------Async functions-------------------
export async function fetchCompanies(): Promise<Company[]> {
  return apiFetch(`${API_BASE_URL}/sales/companies`);
}
//  if (!response.ok) {
//    throw new Error(
//      `Failed to fetch companies: ${response.status}`
//    );
//  }
//
//  return response.json();
//}

export async function updateCompany(
  companyId: string,
  payload: CompanyUpdatePayload
): Promise<Company> {
  return apiFetch(`${API_BASE_URL}/sales/companies/${companyId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
//export async function fetchSalesOrders(): Promise<SalesOrder[]> {
//  const response = await fetch(
//    `${API_BASE_URL}/sales/orders`
//  );
//
//  if (!response.ok) {
//    throw new Error(
//      `Failed to fetch sales orders: ${response.status}`
//    );
//  }
//
//  return response.json();
//}

export async function fetchSalesOrders(): Promise<SalesOrder[]> {
  return apiFetch<SalesOrder[]>(
    `${API_BASE_URL}/sales/orders`
  );
}

//export async function fetchSalesOrder(
//  orderId: string
//): Promise<SalesOrder> {
//  const response = await fetch(
//    `${API_BASE_URL}/sales/orders/${orderId}`
//  );
//
//  if (!response.ok) {
//    throw new Error(
//      `Failed to fetch sales order: ${response.status}`
//    );
//  }
//
//  return response.json();
//}

export async function fetchSalesOrder(
  orderId: string
): Promise<SalesOrder> {
  return apiFetch<SalesOrder>(
    `${API_BASE_URL}/sales/orders/${orderId}`
  );
}

export async function createSalesOrderItem(
  orderId: string,
  payload: SalesOrderItemCreate
) {
  return apiFetch(
    `${API_BASE_URL}/sales/orders/${orderId}/items`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateSalesOrderItem(
  orderId: string,
  itemId: string,
  payload: SalesOrderItemUpdate
) {
  return apiFetch(
    `${API_BASE_URL}/sales/orders/${orderId}/items/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateSalesOrder(
  orderId: string,
  payload: SalesOrderUpdate
) {
  return apiFetch(
    `${API_BASE_URL}/sales/orders/${orderId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteSalesOrder(
  orderId: string
) {
  return apiFetch(
    `${API_BASE_URL}/sales/orders/${orderId}`,
    {
      method: "DELETE",
    }
  );
}

export async function deleteSalesOrderItem(
  orderId: string,
  itemId: string
) {
  return apiFetch(
    `${API_BASE_URL}/sales/orders/${orderId}/items/${itemId}`,
    {
      method: "DELETE",
    }
  );
}

export interface SalesOrderAvailabilityItem {
  sales_order_item_id: string;
  product_id: string;
  product_name: string | null;
  sku: string | null;
  color: string | null;
  size: string | null;
  ordered_quantity: number;
  quantity_on_hand: number;
  quantity_reserved: number;
  available_quantity: number;
  shortage_quantity: number;
  status: "AVAILABLE" | "SHORTAGE";
}

export interface SalesOrderAvailability {
  order_id: string;
  order_number: string;
  order_status: string;
  can_fulfill_completely: boolean;
  items: SalesOrderAvailabilityItem[];
}

export async function fetchSalesOrderAvailability(
  orderId: string
): Promise<SalesOrderAvailability> {
  return apiFetch<SalesOrderAvailability>(
    `${API_BASE_URL}/sales/orders/${orderId}/availability`
  );
}

export async function approveSalesOrder(
  orderId: string
) {
  return apiFetch(
    `${API_BASE_URL}/sales/orders/${orderId}/approve`,
    {
      method: "POST",
    }
  );
}

export async function fetchSalesProducts(): Promise<SalesProduct[]> {
  return apiFetch<SalesProduct[]>(
    `${API_BASE_URL}/sales/products`
  );
}

export async function fetchSalesCustomers(): Promise<SalesCustomer[]> {
  return apiFetch<SalesCustomer[]>(
    `${API_BASE_URL}/sales/customers`
  );
}

export async function createSalesOrder(
  payload: SalesOrderCreate
): Promise<SalesOrder> {
  return apiFetch<SalesOrder>(
    `${API_BASE_URL}/sales/orders`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function fetchCustomers(): Promise<Customer[]> {
  return apiFetch<Customer[]>(
    `${API_BASE_URL}/sales/customers`
  );
}

export async function createCustomer(
  payload: CustomerCreate
): Promise<Customer> {
  return apiFetch<Customer>(
    `${API_BASE_URL}/sales/customers`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateCustomer(
  customerId: string,
  payload: CustomerUpdate
): Promise<Customer> {
  return apiFetch<Customer>(
    `${API_BASE_URL}/sales/customers/${customerId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function deactivateCustomer(
  customerId: string
): Promise<Customer> {
  return updateCustomer(customerId, {
    is_active: false,
  });
}
