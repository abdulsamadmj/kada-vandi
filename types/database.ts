export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  inventory_count: number;
  expiration_date: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RecentProduct {
  name: string;
  price: number;
}

export interface Vendor {
  id: string;
  business_name: string;
  contact: string;
  distance_meters: number;
  is_active: boolean;
  avg_rating: number;
  review_count: number;
  recent_products: RecentProduct[];
}

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
} 