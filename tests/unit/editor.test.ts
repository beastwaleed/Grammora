import { describe, it, expect, beforeEach } from 'vitest';
import {
  inspectEditor,
  isElementExcluded,
  getEditorText,
} from '../../extension/adapters/editor';

describe('Grammora Editor Adapter Unit Tests', () => {
  describe('isElementExcluded', () => {
    it('should exclude elements with data-grammora-ignore="true"', () => {
      const el = document.createElement('textarea');
      el.setAttribute('data-grammora-ignore', 'true');
      expect(isElementExcluded(el)).toBe(true);
    });

    it('should exclude sensitive autocomplete fields', () => {
      const ccEl = document.createElement('input');
      ccEl.setAttribute('autocomplete', 'cc-number');
      expect(isElementExcluded(ccEl)).toBe(true);

      const otpEl = document.createElement('input');
      otpEl.setAttribute('autocomplete', 'one-time-code');
      expect(isElementExcluded(otpEl)).toBe(true);
    });

    it('should exclude password and cvv fields by name or id heuristics', () => {
      const passInput = document.createElement('input');
      passInput.name = 'user_password_confirmation';
      expect(isElementExcluded(passInput)).toBe(true);

      const cvvInput = document.createElement('input');
      cvvInput.id = 'payment-cvv';
      expect(isElementExcluded(cvvInput)).toBe(true);
    });

    it('should NOT exclude normal text fields', () => {
      const normalInput = document.createElement('input');
      normalInput.type = 'text';
      normalInput.name = 'comment_body';
      expect(isElementExcluded(normalInput)).toBe(false);

      const textarea = document.createElement('textarea');
      textarea.name = 'description';
      expect(isElementExcluded(textarea)).toBe(false);
    });
  });

  describe('inspectEditor', () => {
    it('should identify normal textarea as eligible', () => {
      const el = document.createElement('textarea');
      const result = inspectEditor(el);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('textarea');
      expect(result?.isEligible).toBe(true);
    });

    it('should identify text input as eligible', () => {
      const el = document.createElement('input');
      el.type = 'text';
      const result = inspectEditor(el);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('input');
      expect(result?.isEligible).toBe(true);
    });

    it('should reject password input as ineligible', () => {
      const el = document.createElement('input');
      el.type = 'password';
      const result = inspectEditor(el);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('input');
      expect(result?.isEligible).toBe(false);
    });

    it('should reject non-editable elements', () => {
      const div = document.createElement('div');
      const result = inspectEditor(div);
      expect(result).toBeNull();
    });
  });

  describe('getEditorText', () => {
    it('should get value from textarea and input', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'Hello Grammora';
      expect(getEditorText(textarea)).toBe('Hello Grammora');

      const input = document.createElement('input');
      input.value = 'Testing input';
      expect(getEditorText(input)).toBe('Testing input');
    });
  });
});
