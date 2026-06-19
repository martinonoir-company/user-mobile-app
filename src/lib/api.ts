/**
 * Martinonoir API Client (mobile)
 *
 * Mirrors user-frontend/src/lib/api.ts one-for-one, with two native-specific
 * additions:
 *  1. Token lifecycle is driven by expo-secure-store via token-store.ts.
 *  2. 401 responses trigger an automatic refresh, with a single-flight lock
 *     so many in-flight requests don't each kick off their own refresh.
 */
import Constants from 'expo-constants';
import { tokenStore } from './token-store';
import {
  ApiError,
  AuthResponse,
  Category,
  CheckoutInput,
  Order,
  PaginatedOrders,
  PaginatedProducts,
  Product,
  QuoteContext,
  QuoteItem,
  QuoteResult,
  ServerCartItem,
  StockLevel,
  UserProfile,
  WishlistItem,
} from './api-types';

const API_BASE =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'https://api.martinonoir.com/api/v1';

type OnUnauthorized = () => void;

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshInFlight: Promise<boolean> | null = null;
  private onUnauthorized: OnUnauthorized | null = null;

  setTokens(access: string | null, refresh: string | null) {
    this.accessToken = access;
    this.refreshToken = refresh;
  }

  setOnUnauthorized(fn: OnUnauthorized | null) {
    this.onUnauthorized = fn;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !isRetry && this.refreshToken && !path.startsWith('/auth/')) {
      const refreshed = await this.ensureRefreshed();
      if (refreshed) {
        return this.request<T>(path, options, true);
      }
      this.onUnauthorized?.();
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        statusCode: response.status,
        message: response.statusText,
        error: 'Network Error',
        correlationId: 'unknown',
      }));
      throw error;
    }

    // DELETEs sometimes return 204 no content.
    if (response.status === 204) return undefined as T;
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) return undefined as T;
    return response.json();
  }

  /**
   * Single-flight refresh. Concurrent callers share the same in-flight promise,
   * so we never hit /auth/refresh more than once per refresh cycle.
   */
  private ensureRefreshed(): Promise<boolean> {
    if (this.refreshInFlight) return this.refreshInFlight;
    const rt = this.refreshToken;
    if (!rt) return Promise.resolve(false);

    this.refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        });
        if (!res.ok) return false;
        const body = (await res.json()) as { data: AuthResponse };
        this.accessToken = body.data.accessToken;
        this.refreshToken = body.data.refreshToken;
        await tokenStore.save(body.data.accessToken, body.data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
  }

  // ── Auth ──

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    countryCode: string;
  }) {
    return this.request<{ data: AuthResponse }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    return this.request<{ data: AuthResponse }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async refresh(refreshToken: string) {
    return this.request<{ data: AuthResponse }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(refreshToken: string) {
    return this.request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async forgotPassword(email: string) {
    return this.request<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async verifyEmail(token: string) {
    return this.request<void>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification(email: string) {
    return this.request<void>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // ── Products ──

  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    featured?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('categoryId', params.category);
    if (params?.featured) searchParams.set('isFeatured', 'true');

    const qs = searchParams.toString();
    return this.request<{ data: PaginatedProducts }>(`/products${qs ? `?${qs}` : ''}`);
  }

  async getProductBySlug(slug: string) {
    return this.request<{ data: Product }>(`/products/slug/${slug}`);
  }

  async getProductById(id: string) {
    return this.request<{ data: Product }>(`/products/${id}`);
  }

  // ── Quote ──

  async getQuote(items: QuoteItem[], context: QuoteContext) {
    return this.request<{ data: QuoteResult }>('/orders/quote', {
      method: 'POST',
      body: JSON.stringify({ items, context }),
    });
  }

  // ── Orders ──

  async checkout(data: CheckoutInput) {
    return this.request<{ data: Order }>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Validate a marketing-agent code at checkout. */
  async validateAgentCode(
    code: string,
  ): Promise<{ ok: true; agentName: string } | { ok: false; error: string }> {
    try {
      const res = await this.request<{
        data: { agentId: string; code: string; agentName: string };
      }>('/agents/validate-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      return { ok: true, agentName: res.data.agentName };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Could not verify code',
      };
    }
  }

  async getMyOrders(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return this.request<{ data: PaginatedOrders }>(`/orders/mine${qs ? `?${qs}` : ''}`);
  }

  async getOrder(id: string) {
    return this.request<{ data: Order }>(`/orders/${id}`);
  }

  async getOrderByNumber(orderNumber: string) {
    return this.request<{ data: Order }>(`/orders/number/${orderNumber}`);
  }

  // ── Payments ──
  // The app never talks to a payment provider directly. It calls our
  // server, which mediates all Paystack communication.

  /**
   * Begin payment for an order. The server reads the authoritative amount
   * from the order, calls Paystack, and returns the hosted-checkout URL.
   */
  async initiatePayment(input: {
    orderId: string;
    channel?: 'STOREFRONT' | 'MOBILE' | 'POS';
    customerEmail?: string;
    customerName?: string;
    callbackUrl?: string;
  }) {
    return this.request<{
      data: {
        paymentId: string;
        merchantReference: string;
        checkoutUrl?: string;
        status: string;
        amount: number;
        currency: string;
      };
    }>('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({ channel: 'MOBILE', ...input }),
    });
  }

  /**
   * Ask the server to reconcile a payment with the provider and return
   * the current status. Called after the hosted checkout closes.
   */
  async reconcilePayment(merchantReference: string) {
    return this.request<{
      data: {
        paymentId: string;
        merchantReference: string;
        status: string;
        amount: number;
        currency: string;
        failureReason?: string | null;
      };
    }>(`/payments/reconcile/${merchantReference}`, { method: 'POST' });
  }

  // ── Shipping ──

  async getShippingRates(input: {
    country: string;
    state: string;
    weightKg: number;
    currency: string;
    subtotal: number;
  }) {
    return this.request<{
      data: Array<{
        carrier: string;
        service: string;
        estimatedDays: { min: number; max: number };
        rate: number;
        currency: string;
      }>;
    }>('/shipping/rates', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async trackShipment(trackingNumber: string) {
    return this.request<{
      data: {
        trackingNumber: string;
        carrier: string;
        currentStatus: string;
        events: Array<{ timestamp: string; status: string; location: string; description: string }>;
      };
    }>(`/shipping/track/${trackingNumber}`);
  }

  // ── Inventory ──

  async getStockLevel(variantId: string) {
    return this.request<{ data: StockLevel }>(`/inventory/levels/${variantId}`);
  }

  // ── Categories ──

  async getCategories() {
    return this.request<{ data: Category[] }>('/categories');
  }

  async getCategoryTree() {
    return this.request<{ data: Category[] }>('/categories/tree');
  }

  async getCategoryBySlug(slug: string) {
    return this.request<{ data: Category }>(`/categories/slug/${slug}`);
  }

  // ── Wishlist ──

  async getWishlist() {
    return this.request<{ data: WishlistItem[] }>('/wishlist');
  }

  async getWishlistCount() {
    return this.request<{ data: { count: number } }>('/wishlist/count');
  }

  async checkWishlisted(productIds: string[]) {
    const qs = productIds.join(',');
    return this.request<{ data: { wishlisted: string[] } }>(`/wishlist/check?productIds=${qs}`);
  }

  async addToWishlist(productId: string, variantId?: string) {
    return this.request<{ data: WishlistItem }>('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId, variantId }),
    });
  }

  async removeFromWishlist(productId: string) {
    return this.request<{ message: string }>(`/wishlist/${productId}`, {
      method: 'DELETE',
    });
  }

  async clearWishlist() {
    return this.request<{ message: string }>('/wishlist', {
      method: 'DELETE',
    });
  }

  // ── Cart (authenticated only) ──

  async getCart() {
    return this.request<{ data: ServerCartItem[] }>('/cart');
  }

  async getCartCount() {
    return this.request<{ data: { count: number } }>('/cart/count');
  }

  async addToCart(variantId: string, quantity: number) {
    return this.request<{ data: ServerCartItem }>('/cart', {
      method: 'POST',
      body: JSON.stringify({ variantId, quantity }),
    });
  }

  async updateCartQuantity(variantId: string, quantity: number) {
    return this.request<{ data: ServerCartItem | null }>(`/cart/${variantId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(variantId: string) {
    return this.request<{ message: string }>(`/cart/${variantId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request<{ message: string }>('/cart', {
      method: 'DELETE',
    });
  }

  async mergeCart(items: { variantId: string; quantity: number }[]) {
    return this.request<{ data: ServerCartItem[] }>('/cart/merge', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  // ── Account ──

  async getProfile() {
    return this.request<{ data: UserProfile }>('/account/profile');
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    countryCode?: string;
  }) {
    return this.request<{ data: UserProfile }>('/account/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/account/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }
}

export const api = new ApiClient();
export default api;
export * from './api-types';
