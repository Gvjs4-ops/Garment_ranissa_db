const API_BASE_URL = "/api";

//-------------Exporting interfaces------------
export interface Company {
  id: string;
  name: string;
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
  customer_name: string;
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


export interface SalesOrderCreate {
  customer_id: string;
  order_date: string;
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
  credit_limit: number;
  is_active: boolean;
}

export interface CustomerCreate {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  credit_limit?: number;
}

export interface CustomerUpdate {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  tax_number?: string | null;
  credit_limit?: number;
  is_active?: boolean;
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
  const response = await fetch(
    `${API_BASE_URL}/sales/companies`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch companies: ${response.status}`
    );
  }

  return response.json();
}

export async function fetchSalesOrders(): Promise<SalesOrder[]> {
  const response = await fetch(
    `${API_BASE_URL}/sales/orders`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sales orders: ${response.status}`
    );
  }

  return response.json();
}

export async function fetchSalesOrder(
  orderId: string
): Promise<SalesOrder> {
  const response = await fetch(
    `${API_BASE_URL}/sales/orders/${orderId}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sales order: ${response.status}`
    );
  }

  return response.json();
}

export async function createSalesOrderItem(
  orderId: string,
  payload: SalesOrderItemCreate
) {
  const response = await fetch(
    `${API_BASE_URL}/sales/orders/${orderId}/items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create sales order item");
  }

  return response.json();
}

export async function updateSalesOrderItem(
  orderId: string,
  itemId: string,
  payload: SalesOrderItemUpdate
) {
  const response = await fetch(
    `${API_BASE_URL}/sales/orders/${orderId}/items/${itemId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update sales order item");
  }

  return response.json();
}

export async function updateSalesOrder(
  orderId: string,
  payload: SalesOrderUpdate
) {
  const response = await fetch(
    `${API_BASE_URL}/sales/orders/${orderId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to update sales order: ${response.status}`
    );
  }

  return response.json();
}

export async function deleteSalesOrderItem(
  orderId: string,
  itemId: string
) {
  const response = await fetch(
    `${API_BASE_URL}/sales/orders/${orderId}/items/${itemId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete sales order item");
  }

  return response.json();
}

export async function fetchSalesProducts(): Promise<SalesProduct[]> {
  const response = await fetch(
    `${API_BASE_URL}/sales/products`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}

export async function fetchSalesCustomers(): Promise<SalesCustomer[]> {
  const response = await fetch(
    `${API_BASE_URL}/sales/customers`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch customers");
  }

  return response.json();
}


export async function createSalesOrder(
  payload: SalesOrderCreate
) {
  const response = await fetch(
    `${API_BASE_URL}/sales/orders`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to create sales order: ${response.status}`
    );
  }

  return response.json();
}

export async function fetchCustomers(): Promise<Customer[]> {
  const response = await fetch(
    `${API_BASE_URL}/sales/customers`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch customers: ${response.status}`
    );
  }

  return response.json();
}

export async function createCustomer(
  payload: CustomerCreate
): Promise<Customer> {
  const response = await fetch(
    `${API_BASE_URL}/sales/customers`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to create customer: ${response.status}`
    );
  }

  return response.json();
}

export async function updateCustomer(
  customerId: string,
  payload: CustomerUpdate
): Promise<Customer> {
  const response = await fetch(
    `${API_BASE_URL}/sales/customers/${customerId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to update customer: ${response.status}`
    );
  }

  return response.json();
}

export async function deactivateCustomer(
  customerId: string
): Promise<Customer> {
  return updateCustomer(customerId, {
    is_active: false,
  });
}
