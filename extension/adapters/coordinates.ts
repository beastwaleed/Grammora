/**
 * Coordinate utilities for positioning floating UI elements relative to
 * text selections inside textareas, inputs, and contenteditable elements.
 */

export interface FloatingPosition {
  top: number;
  left: number;
  placement: 'bottom' | 'top';
}

const MIRROR_PROPERTIES = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'MozTabSize',
] as const;

/**
 * Calculates absolute viewport coordinates for the end of a selection in a textarea or input.
 */
function getTextareaSelectionCoordinates(
  element: HTMLTextAreaElement | HTMLInputElement,
  position: number
): { top: number; left: number; height: number } {
  if (typeof document === 'undefined') {
    return { top: 0, left: 0, height: 20 };
  }

  const isInput = element.tagName === 'INPUT';
  const rect = element.getBoundingClientRect();

  // Create mirror div
  const mirror = document.createElement('div');
  mirror.id = 'grammora-caret-position-mirror';
  document.body.appendChild(mirror);

  const style = mirror.style;
  const computed = window.getComputedStyle(element);

  style.whiteSpace = isInput ? 'nowrap' : 'pre-wrap';
  if (!isInput) {
    style.wordWrap = 'break-word';
  }

  style.position = 'absolute';
  style.visibility = 'hidden';
  style.top = '0px';
  style.left = '-9999px';

  // Copy geometry and typography styles
  for (const prop of MIRROR_PROPERTIES) {
    // @ts-ignore
    style[prop] = computed[prop];
  }

  // Handle scroll offset
  mirror.textContent = element.value.substring(0, position);

  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  mirror.appendChild(span);

  const spanOffsetTop = span.offsetTop;
  const spanOffsetLeft = span.offsetLeft;
  const lineHeight = parseInt(computed.lineHeight, 10) || parseInt(computed.fontSize, 10) * 1.2 || 20;

  document.body.removeChild(mirror);

  return {
    top: rect.top - element.scrollTop + spanOffsetTop,
    left: rect.left - element.scrollLeft + spanOffsetLeft,
    height: lineHeight,
  };
}

/**
 * Computes optimal floating coordinates near the active selection.
 * Ensures the popup remains inside the visible viewport boundaries.
 */
export function calculateFloatingPosition(
  element: HTMLElement,
  selectionStart: number,
  selectionEnd: number,
  floatingWidth: number = 280,
  floatingHeight: number = 160
): FloatingPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 12;

  let targetTop: number;
  let targetLeft: number;
  let targetHeight: number;

  if (element.isContentEditable) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      let rangeRect = range.getBoundingClientRect();

      // In Chrome contenteditable, collapsed ranges frequently return (0, 0, 0, 0)
      if (rangeRect.width === 0 && rangeRect.height === 0 && rangeRect.left === 0 && rangeRect.top === 0) {
        const clientRects = range.getClientRects();
        if (clientRects.length > 0) {
          rangeRect = clientRects[clientRects.length - 1];
        }
      }

      // If still zero, temporarily insert zero-width marker to calculate precise cursor rect
      if (rangeRect.width === 0 && rangeRect.height === 0 && rangeRect.left === 0 && rangeRect.top === 0) {
        try {
          const marker = document.createElement('span');
          marker.textContent = '\u200B';
          const clonedRange = range.cloneRange();
          clonedRange.insertNode(marker);
          rangeRect = marker.getBoundingClientRect();
          marker.parentNode?.removeChild(marker);
        } catch {
          rangeRect = element.getBoundingClientRect();
        }
      }

      // Fallback if measurement failed
      if (rangeRect.left === 0 && rangeRect.top === 0) {
        rangeRect = element.getBoundingClientRect();
      }

      targetTop = rangeRect.bottom;
      targetLeft = rangeRect.left;
      targetHeight = rangeRect.height || 20;
    } else {
      const rect = element.getBoundingClientRect();
      targetTop = rect.bottom;
      targetLeft = rect.left;
      targetHeight = 20;
    }
  } else if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    try {
      const coords = getTextareaSelectionCoordinates(element, selectionEnd);
      targetTop = coords.top + coords.height;
      targetLeft = coords.left;
      targetHeight = coords.height;
    } catch {
      const rect = element.getBoundingClientRect();
      targetTop = rect.bottom;
      targetLeft = rect.left;
      targetHeight = 20;
    }
  } else {
    const rect = element.getBoundingClientRect();
    targetTop = rect.bottom;
    targetLeft = rect.left;
    targetHeight = 20;
  }

  // Determine vertical placement: prefer bottom, flip to top if near bottom boundary
  let placement: 'bottom' | 'top' = 'bottom';
  let top = targetTop + 8;

  if (top + floatingHeight > viewportHeight - padding) {
    // Flip above selection
    top = targetTop - targetHeight - floatingHeight - 8;
    placement = 'top';
  }

  // Ensure top does not go offscreen
  if (top < padding) {
    top = padding;
  }

  // Clamp horizontal position within viewport
  let left = targetLeft;
  if (left + floatingWidth > viewportWidth - padding) {
    left = viewportWidth - floatingWidth - padding;
  }
  if (left < padding) {
    left = padding;
  }

  return {
    top: Math.round(top),
    left: Math.round(left),
    placement,
  };
}

