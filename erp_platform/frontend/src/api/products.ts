const API_BASE_URL = "/api";

export interface Product {
  id: string;
  sku: string | null;
  style_code: string | null;
  name: string;
  category_id: string | null;
  description: string | null;
  fabric: string | null;
  fabric_composition: string | null;
  gsm: number | null;
  color: string | null;
  size: string | null;
  fit: string | null;
  unit: string;
  purchase_price: number;
  selling_price: number;
  is_active: boolean;
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/products`);

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return response.json();
}
export interface CreateProductPayload {
  sku: string;
  style_code: string;
  name: string;
  fabric: string;
  color: string;
  size: string;
  fit: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  is_active: boolean;
}

export async function createProduct(
  product: CreateProductPayload
): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error(`Failed to create product: ${response.status}`);
  }

  return response.json();
}

export async function updateProduct(
  productId: string,
  product: CreateProductPayload
): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error(`Failed to create product: ${response.status}`);
  }

  return response.json();
}
