// Shared with user-frontend/src/lib/api.ts — keep in sync.

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string | null;
  category: Category | null;
  attributes: Record<string, unknown> | null;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  variants: ProductVariant[];
  media: ProductMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  retailPriceNgn: string;
  retailPriceUsd: string;
  wholesalePriceNgn: string;
  wholesalePriceUsd: string;
  compareAtPriceNgn: string | null;
  compareAtPriceUsd: string | null;
  costPriceNgn: string | null;
  weightKg: string | null;
  isActive: boolean;
  trackInventory: boolean;
  options: Record<string, string>;
  barcode: string | null;
  sortOrder: number;
}

export interface ProductMedia {
  id: string;
  url: string;
  /** Server-side field name is `altText`. */
  alt?: string;
  altText?: string;
  type?: string;
  mediaType?: 'IMAGE' | 'VIDEO';
  sortOrder: number;
  /**
   * NULL → product-level. Non-null → media specific to this variant,
   * shown when the variant is selected on the PDP.
   */
  variantId?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  alias?: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface QuoteItem {
  variantId: string;
  sku: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  compareAtPrice?: number;
  weightKg?: number;
}

export interface QuoteContext {
  currency: string;
  country: string;
  state: string;
  couponCode?: string;
  shippingMethod?: string;
  /** Sales channel — lets the server reject channel-scoped coupons. */
  channel?: 'STOREFRONT' | 'MOBILE' | 'POS';
}

export interface QuoteResult {
  currency: string;
  lines: Array<{
    variantId: string;
    sku: string;
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    lineSubtotal: number;
    lineDiscount: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discountTotal: number;
  coupon?: { code: string; discountType: string; discountAmount: number };
  /** Server-attached variant-scoped promotion. Customer never typed this. */
  autoApply?: { code: string; discountType: string; discountAmount: number };
  shippingTotal: number;
  shippingMethod?: { carrier: string; service: string; estimatedDays: { min: number; max: number }; rate: number };
  availableShippingRates: Array<{ carrier: string; service: string; estimatedDays: { min: number; max: number }; rate: number; currency: string }>;
  taxTotal: number;
  grandTotal: number;
  savings: number;
  itemCount: number;
}

export interface CheckoutInput {
  items: Array<{ variantId: string; quantity: number }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
    phone?: string;
  };
  currency?: string;
  paymentMethod?: string;
  couponCode?: string;
  customerNote?: string;
  guestEmail?: string;
  idempotencyKey?: string;
  /** Marketing-agent referral code captured at checkout. */
  agentCode?: string;
  /** When true, skip AAJ shipping — no fee, no delivery booked. */
  shippingOptOut?: boolean;
}

export interface ShippingTrackingEvent {
  dateTime: string;
  /** 0=LABEL_CREATED, 1=PICKED_UP, 2=IN_TRANSIT, 3=OUT_FOR_DELIVERY, 4=DELIVERED. */
  status: number;
  scanType: string;
  description: string;
  location: string;
}

export interface ShippingTracking {
  orderNumber?: string;
  trackingNumber: string | null;
  status: number | null;
  description: string;
  etaDays?: number;
  etaDate?: string;
  events: ShippingTrackingEvent[];
  labelUrl?: string | null;
  optedOut: boolean;
  pending: boolean;
}

export interface ShippingState {
  orderId: string;
  orderNumber: string;
  optedOut: boolean;
  bookingId: string | null;
  trackingId: string | null;
  labelUrl: string | null;
  status: number | null;
  progress: number;
  lastError: string | null;
  retryCount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  channel: string;
  currency: string;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  shippingAddress: Record<string, string>;
  items: OrderItem[];
  statusHistory: Array<{ fromStatus: string; toStatus: string; reason: string; createdAt: string }>;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  options: Record<string, string>;
}

export interface PaginatedOrders {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface StockLevel {
  variantId: string;
  warehouseCode: string;
  onHand: number;
  reserved: number;
}

export interface ServerCartItem {
  id: string;
  variantId: string | null;
  productId: string | null;
  productName: string;
  productSlug: string;
  variantName: string | null;
  sku: string;
  quantity: number;
  priceNgn: number;
  priceUsd: number;
  currentPriceNgn: number | null;
  currentPriceUsd: number | null;
  priceChanged: boolean;
  unavailable: boolean;
  options: Record<string, string> | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  variantId?: string;
  note?: string;
  product: Product;
  variant?: ProductVariant;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  countryCode: string;
  preferredCurrency: 'NGN' | 'USD';
  emailVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  correlationId: string;
}
