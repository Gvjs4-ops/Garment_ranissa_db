import { apiFetch } from "./apiClient";

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
  return apiFetch("/api/products");
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
  return apiFetch("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function updateProduct(
  productId: string,
  product: CreateProductPayload
): Promise<Product> {
  return apiFetch(`/api/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}
