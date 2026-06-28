import { useEffect, useState } from 'react';
import { api } from './api';

/**
 * Default minimum wholesale quantity — the fallback shown before the server
 * config loads (and if it fails). The authoritative value is set by the
 * super admin and fetched via useWholesaleMinQty(); the server re-validates
 * at checkout.
 */
export const DEFAULT_WHOLESALE_MIN_QTY = 20;

/** @deprecated Prefer useWholesaleMinQty(). Kept as the fallback default. */
export const MIN_WHOLESALE_QTY = DEFAULT_WHOLESALE_MIN_QTY;

let cached: number | null = null;
let inFlight: Promise<number> | null = null;

async function fetchMinQty(): Promise<number> {
  if (cached != null) return cached;
  if (!inFlight) {
    inFlight = api
      .getPublicConfig()
      .then((res) => {
        const n = Number(res.data?.wholesaleMinQty);
        cached =
          Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULT_WHOLESALE_MIN_QTY;
        return cached;
      })
      .catch(() => {
        cached = DEFAULT_WHOLESALE_MIN_QTY;
        return cached;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/**
 * The admin-configured wholesale minimum quantity. Returns the default
 * immediately, then updates once the server config resolves.
 */
export function useWholesaleMinQty(): number {
  const [qty, setQty] = useState<number>(cached ?? DEFAULT_WHOLESALE_MIN_QTY);
  useEffect(() => {
    let active = true;
    void fetchMinQty().then((n) => {
      if (active) setQty(n);
    });
    return () => {
      active = false;
    };
  }, []);
  return qty;
}
