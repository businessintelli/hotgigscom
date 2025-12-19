import { useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export interface DraftAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number; // milliseconds to wait before auto-saving
  enabled?: boolean; // whether auto-save is enabled
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

/**
 * Hook for auto-saving draft data with debouncing
 * @param options Configuration options for auto-save
 * @returns Object with manual save function and saving state
 */
export function useDraftAutoSave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
  onSaveStart,
  onSaveSuccess,
  onSaveError,
}: DraftAutoSaveOptions<T>) {
  const debouncedData = useDebounce(data, delay);
  const isFirstRender = useRef(true);
  const isSaving = useRef(false);
  const lastSavedData = useRef<T | null>(null);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (isSaving.current) return;

    try {
      isSaving.current = true;
      onSaveStart?.();
      await onSave(data);
      lastSavedData.current = data;
      onSaveSuccess?.();
    } catch (error) {
      onSaveError?.(error as Error);
    } finally {
      isSaving.current = false;
    }
  }, [data, onSave, onSaveStart, onSaveSuccess, onSaveError]);

  // Auto-save effect
  useEffect(() => {
    // Skip first render to avoid saving empty/initial data
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Skip if auto-save is disabled
    if (!enabled) return;

    // Skip if data hasn't changed
    if (JSON.stringify(debouncedData) === JSON.stringify(lastSavedData.current)) {
      return;
    }

    // Skip if already saving
    if (isSaving.current) return;

    // Auto-save
    const autoSave = async () => {
      try {
        isSaving.current = true;
        onSaveStart?.();
        await onSave(debouncedData);
        lastSavedData.current = debouncedData;
        onSaveSuccess?.();
      } catch (error) {
        onSaveError?.(error as Error);
      } finally {
        isSaving.current = false;
      }
    };

    autoSave();
  }, [debouncedData, enabled, onSave, onSaveStart, onSaveSuccess, onSaveError]);

  return {
    saveNow,
    isSaving: isSaving.current,
  };
}
