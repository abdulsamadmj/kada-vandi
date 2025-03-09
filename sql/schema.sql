-- Enable extensions required for UUID generation and geographic data
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table (both customers and vendors)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Vendors table (linked to users)
CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  business_name text NOT NULL,
  location geography(Point,4326),
  contact text,
  created_at timestamp DEFAULT now(),
  CONSTRAINT fk_vendor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products table (inventory managed by vendors)
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  inventory_count integer DEFAULT 0,
  expiration_date date,
  CONSTRAINT fk_product_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Orders table (records customer orders)
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  status text NOT NULL,
  total_amount numeric,
  order_date timestamp DEFAULT now(),
  delivery_time timestamp,
  CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Order Items table (details of products in each order)
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Payments table (records payment details for orders)
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL,
  amount numeric NOT NULL,
  payment_date timestamp DEFAULT now(),
  CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Tracking table (real-time vendor tracking details)
CREATE TABLE tracking (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  eta timestamp,
  CONSTRAINT fk_tracking_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_tracking_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Reviews table (customer feedback on vendors/orders)
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamp DEFAULT now(),
  CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Alerts table (custom notifications for customers)
CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  alert_type text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  CONSTRAINT fk_alert_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Preferences table (customer alerts/preferences for vendors/products)
CREATE TABLE preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamp DEFAULT now(),
  CONSTRAINT fk_preference_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Demand Predictions table (AI-based demand prediction data)
CREATE TABLE demand_predictions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL,
  predicted_demand numeric,
  prediction_date timestamp DEFAULT now(),
  CONSTRAINT fk_demand_prediction_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);
