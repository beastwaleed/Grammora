import React, { useState, useEffect, useCallback } from 'react';
import { PenPill } from './PenPill';
import { WritingToolbar } from './WritingToolbar';
import { ResultPreviewCard } from './ResultPreviewCard';
import {
  SelectionSnapshot,
  validateSelectionSnapshot,
  executeReplacement,
} from '../adapters/replacement';
import { calculateFloatingPosition, FloatingPosition } from '../adapters/coordinates';
import { WritingActionType } from '../lib/mock-ai';
import { executeAIAction } from '../lib/api';

export type CompanionView = 'HIDDEN' | 'PEN' | 'TOOLBAR' | 'PREVIEW';

interface FloatingWritingCompanionProps {
  snapshot: SelectionSnapshot | null;
  onClose: () => void;
}

export const FloatingWritingCompanion: React.FC<FloatingWritingCompanionProps> = ({
  snapshot,
  onClose,
}) => {
  const [view, setView] = useState<CompanionView>('PEN');
  const [selectedAction, setSelectedAction] = useState<WritingActionType>('grammar');
  const [position, setPosition] = useState<FloatingPosition>({ top: 0, left: 0, placement: 'bottom' });
  const [suggestedText, setSuggestedText] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Recalculate position whenever snapshot or view changes
  useEffect(() => {
    if (!snapshot) {
      setView('HIDDEN');
      return;
    }

    const width = view === 'PREVIEW' ? 320 : view === 'TOOLBAR' ? 440 : 36;
    const height = view === 'PREVIEW' ? 220 : view === 'TOOLBAR' ? 44 : 36;

    const coords = calculateFloatingPosition(
      snapshot.element,
      snapshot.startOffset,
      snapshot.endOffset,
      width,
      height
    );
    setPosition(coords);
    setView((prev) => (prev === 'HIDDEN' ? 'PEN' : prev));
  }, [snapshot, view]);

  // Execute AI action (local mock in Phase 2)
  const executeAction = useCallback(async (action: WritingActionType) => {
    if (!snapshot) return;

    setSelectedAction(action);
    setLoading(true);
    setError(null);
    setSuggestedText(null);
    setView('PREVIEW');

    // Validate that selection is still valid before processing
    if (!validateSelectionSnapshot(snapshot)) {
      setError('Selection has changed. Please highlight the text again.');
      setLoading(false);
      return;
    }

    try {
      const response = await executeAIAction(snapshot.originalText, action);

      // Re-verify after latency
      if (!validateSelectionSnapshot(snapshot)) {
        setError('Selection changed while processing.');
        setLoading(false);
        return;
      }

      setSuggestedText(response.result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate transformation.');
    } finally {
      setLoading(false);
    }
  }, [snapshot]);

  // Apply suggestion to target editor
  const handleApply = useCallback(() => {
    if (!snapshot || !suggestedText) return;

    const result = executeReplacement(snapshot, suggestedText);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to replace selected text.');
    }
  }, [snapshot, suggestedText, onClose]);

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleRetry = useCallback(() => {
    executeAction(selectedAction);
  }, [executeAction, selectedAction]);

  if (!snapshot || view === 'HIDDEN') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 2147483647,
        pointerEvents: 'auto',
      }}
      className="font-sans antialiased text-content-main select-none"
    >
      {view === 'PEN' && (
        <PenPill onClick={() => setView('TOOLBAR')} />
      )}

      {view === 'TOOLBAR' && (
        <WritingToolbar
          onSelectAction={(action) => executeAction(action)}
          onClose={handleDismiss}
        />
      )}

      {view === 'PREVIEW' && (
        <ResultPreviewCard
          action={selectedAction}
          originalText={snapshot.originalText}
          suggestedText={suggestedText}
          loading={loading}
          error={error}
          onApply={handleApply}
          onDismiss={handleDismiss}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
};

