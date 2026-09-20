import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * A reliable bottom safe-area inset for reserving space above the phone's
 * system navigation bar.
 *
 * Under Expo SDK 54 edge-to-edge, the app draws behind the Android navigation
 * bar, so bottom content must be inset by its height. But on some Android
 * devices/OEMs `react-native-safe-area-context` reports `insets.bottom` as ~0
 * (e.g. Samsung One UI with a 3-button nav bar, or before edge-to-edge
 * settles) — which left the tab bar and other bottom-region content clipped
 * behind the nav bar across the app.
 *
 * Logic:
 *   - iOS always reports its true home-indicator inset, so it's used directly.
 *   - Android: use whichever is LARGER — the reported inset or a 48dp floor.
 *     48dp is the height of a standard 3-button navigation bar. Some Android
 *     devices/OEMs report the bottom inset as 0 OR as a too-small partial value
 *     (e.g. ~24) even with a full nav bar present, either of which left content
 *     clipped. Flooring at 48 guarantees the nav bar is always cleared. On
 *     gesture-nav phones (which keep only a thin ~16dp indicator) this adds a
 *     little extra space at the bottom — an acceptable trade for never hiding
 *     content behind the system bar.
 */
const ANDROID_MIN_BOTTOM_INSET = 48;

export function useBottomInset(): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'android') return insets.bottom;
  return Math.max(insets.bottom, ANDROID_MIN_BOTTOM_INSET);
}
