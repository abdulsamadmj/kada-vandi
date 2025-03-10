export interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
}

export interface Order {
  id: string;
  status: string;
  total_amount: number;
  order_date: string;
  vendor_name?: string;
  customer_name?: string;
  delivery_address?: {
    label: string;
    address: string;
  };
  items: OrderItem[];
}

interface OrderCardProps {
  order: Order;
  isVendor: boolean;
  onAccept?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, newStatus: string) => void;
}

export function OrderCard(props: OrderCardProps): JSX.Element;
export function getStatusColor(status: string): string; 