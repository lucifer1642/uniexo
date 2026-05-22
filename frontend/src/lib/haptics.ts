/**
 * Haptic feedback utility for mobile web.
 * Uses the Vibration API with graceful fallbacks.
 * Only works on Android Chrome and some mobile browsers.
 * iOS Safari requires native app context for haptics.
 */

const canVibrate = () =>
  typeof navigator !== 'undefined' && 'vibrate' in navigator;

export const haptics = {
  /** Ultra-light tap — selection, toggle */
  light() {
    if (canVibrate()) navigator.vibrate(8);
  },

  /** Medium tap — button press, card tap */
  medium() {
    if (canVibrate()) navigator.vibrate(20);
  },

  /** Heavy tap — important action, submit */
  heavy() {
    if (canVibrate()) navigator.vibrate(40);
  },

  /** Success pattern — booking confirmed, payment success */
  success() {
    if (canVibrate()) navigator.vibrate([10, 40, 15]);
  },

  /** Error pattern — validation fail, payment error */
  error() {
    if (canVibrate()) navigator.vibrate([40, 25, 40]);
  },

  /** Selection change — filter, tab switch */
  selection() {
    if (canVibrate()) navigator.vibrate(5);
  },

  /** Notification — new alert arrived */
  notification() {
    if (canVibrate()) navigator.vibrate([15, 50, 10, 50, 15]);
  },
};
