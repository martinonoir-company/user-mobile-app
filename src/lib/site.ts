import Constants from 'expo-constants';

/**
 * Base URL of the public web storefront. Shared/deep links point here so a
 * recipient can open the product in any browser (and, if they have the app,
 * the web page links back to the store). Configured via app.json `extra.siteUrl`.
 */
export const SITE_URL =
  (Constants.expoConfig?.extra as { siteUrl?: string } | undefined)?.siteUrl ??
  'https://martinonoir.com';

/** Public web URL for a product's detail page, by slug. */
export function productUrl(slug: string): string {
  return `${SITE_URL}/product/${slug}`;
}
