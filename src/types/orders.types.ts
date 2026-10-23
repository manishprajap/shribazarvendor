// types/orders.types.ts

export type OrderStatus =
  | 'new'
  | 'confirmed'   // API returns this — treated same as "new"
  | 'pending'
  | 'processing'
  | 'picked'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'picked'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'
  | 'rejected'
  | '';

export interface DeliveryBoy {
  id: number;
  name: string;
  phone?: string;
}

export interface Product {
  id?: number;
  name?: string;
  title?: string;
  image?: string;
  photo?: string;
  img?: string;
  price?: number;
  selling_price?: number;
  sale_price?: number;
}

export interface OrderProduct {
  id?: number;
  product_id?: number;
  product_name?: string;   // ← API returns this directly
  name?: string;           // fallback
  product?: Product;
  quantity?: number;
  qty?: number;
  price?: number;
  amount?: number;
  unit_price?: number;
  sale_price?: number;
  product_price?: number;
}

export interface Order {
  id: number;

  // customer fields — API uses customer_* keys
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;

  // billing fields — kept for backward compat
  billing_name?: string;
  billing_email?: string;
  billing_phone?: string;
  billing_city?: string;
  billing_address?: string;
  billing_subtotal?: number;
  billing_tax?: number;
  billing_total?: number;

  // address
  shipping_address?: string;

  // amounts
  amount?: number;
  vendor_subtotal?: number;

  // payment
  payment_method?: string;
  payment_gateway?: string;
  payment_status?: string;
  cod?: number;
  txn_id?: string | null;

  // order status — "confirmed" == "new" for display purposes
  status: OrderStatus;

  // delivery
  dstatus?: DeliveryStatus;
  delivery_status?: string;
  delivery_boy_id?: number | null;
  delivery_boy?: DeliveryBoy | null;

  // timestamps
  picked_at?: string | null;
  delivered_at?: string | null;
  created_at?: string;
  updated_at?: string;
  created_at_formatted?: string;

  // items — API returns "items" key
  items?: OrderProduct[];
  order_products?: OrderProduct[];
  orderProducts?: OrderProduct[];
}

export type StatusFilterValue =
  | ''
  | 'new'
  | 'confirmed'   // ← added
  | 'pending'
  | 'processing'
  | 'delivered'
  | 'cancelled';

export type DStatusFilterValue =
  | ''
  | 'assigned'
  | 'accepted'
  | 'picked'
  | 'on_the_way';