'use client';

import { useCallback } from 'react';
import { haptics } from '@/lib/haptics';

/**
 * React hook for haptic feedback.
 * Wraps the haptics utility with useCallback for stable references.
 */
export function useHapticFeedback() {
  const tap = useCallback(() => haptics.light(), []);
  const press = useCallback(() => haptics.medium(), []);
  const submit = useCallback(() => haptics.heavy(), []);
  const success = useCallback(() => haptics.success(), []);
  const error = useCallback(() => haptics.error(), []);
  const selection = useCallback(() => haptics.selection(), []);
  const notification = useCallback(() => haptics.notification(), []);

  return { tap, press, submit, success, error, selection, notification };
}
