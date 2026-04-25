// Mirror of user-frontend/src/lib/price.ts — all minor units (kobo for NGN, cents for USD).

export function formatPrice(minorUnits: number | string, currency: string = 'NGN'): string {
  const amount = typeof minorUnits === 'string' ? parseInt(minorUnits, 10) : minorUnits;

  if (currency === 'USD') {
    return `$${(amount / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `\u20A6${(amount / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function getVariantPrice(
  variant: { retailPriceNgn: string; retailPriceUsd: string },
  currency: string = 'NGN',
): string {
  return currency === 'USD'
    ? formatPrice(variant.retailPriceUsd, 'USD')
    : formatPrice(variant.retailPriceNgn, 'NGN');
}

export function getVariantPriceMinor(
  variant: { retailPriceNgn: string; retailPriceUsd: string },
  currency: string = 'NGN',
): number {
  return currency === 'USD'
    ? parseInt(variant.retailPriceUsd, 10)
    : parseInt(variant.retailPriceNgn, 10);
}

export function getStartingPrice(
  variants: Array<{ retailPriceNgn: string; retailPriceUsd: string }>,
  currency: string = 'NGN',
): string {
  if (variants.length === 0) return '\u2014';
  const prices = variants.map((v) =>
    currency === 'USD' ? parseInt(v.retailPriceUsd, 10) : parseInt(v.retailPriceNgn, 10),
  );
  const min = Math.min(...prices);
  const prefix = variants.length > 1 ? 'From ' : '';
  return `${prefix}${formatPrice(min, currency)}`;
}
