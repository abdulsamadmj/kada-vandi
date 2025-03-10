export interface SupabaseVendor {
  id: string;
  business_name: string;
  user_id: string;
}

export interface SupabaseUser {
  id: string;
  name: string;
}

export interface SupabaseProduct {
  id: string;
  name: string;
  inventory_count: number;
}

export interface SupabaseOrderItem {
  quantity: number;
  price: number;
  product_id: string;
  products: SupabaseProduct;
}

export interface SupabaseOrder {
  id: string;
  status: string;
  total_amount: number;
  order_date: string;
  delivery_address?: {
    label: string;
    address: string;
  };
  vendors: SupabaseVendor | null;
  users: SupabaseUser | null;
  order_items: SupabaseOrderItem[];
} 