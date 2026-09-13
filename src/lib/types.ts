export type ProductStatus = "active" | "hidden" | "sold_out";
export type OrderStatus = "new" | "confirmed" | "completed" | "cancelled";
export type QuestionStatus = "waiting" | "answered";

export type InterestKind =
  | "viewed_shop"
  | "viewed_product"
  | "asked"
  | "saved"
  | "added_to_cart"
  | "checkout_started"
  | "ordered";

export type Business = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  owner_name: string | null;
  whatsapp: string | null;
  instagram: string | null;
  tiktok: string | null;
  location: string | null;
  currency: string;
  logo_image_id: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  business_id: string;
  name: string;
  position: number;
};

export type Product = {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_minor: number;
  compare_at_minor: number | null;
  status: ProductStatus;
  stock: number | null;
  created_at: string;
  updated_at: string;
};

export type ProductOption = {
  id: string;
  product_id: string;
  label: string;
  in_stock: number;
  position: number;
};

/** A product plus the things every list view needs, resolved in one query. */
export type ProductCard = Product & {
  image_id: string | null;
  category_name: string | null;
  views: number;
  questions: number;
  orders: number;
};

export type Customer = {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  instagram: string | null;
  note: string | null;
  created_at: string;
  last_seen_at: string;
};

export type Question = {
  id: string;
  business_id: string;
  product_id: string | null;
  customer_id: string;
  body: string;
  status: QuestionStatus;
  created_at: string;
  answered_at: string | null;
};

export type Order = {
  id: string;
  business_id: string;
  customer_id: string;
  reference: string;
  status: OrderStatus;
  total_minor: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name_at_time: string;
  option_label: string | null;
  unit_minor: number;
  qty: number;
};

export type CartLine = {
  id: string;
  product_id: string;
  option_id: string | null;
  option_label: string | null;
  qty: number;
  name: string;
  price_minor: number;
  status: ProductStatus;
  image_id: string | null;
};
