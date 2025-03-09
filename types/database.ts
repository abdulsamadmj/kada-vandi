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