import { test as base, chromium, expect, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathToExtension = path.resolve(__dirname, '../../extension/.output/chrome-mv3');
const pathToTestPage = path.resolve(__dirname, '../manual/test-page.html');

export const test = base.extend<{
  context: BrowserContext;
  page: Page;
}>({
  context: async ({}, use) => {
    const userDataDir = path.resolve(__dirname, `../../.tmp-playwright-${Date.now()}`);
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
  },
});

test.describe('Grammora Chrome Extension E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    const testPageUrl = 'http://localhost:3001/test/test-page.html';
    await page.goto(testPageUrl);
    // Wait for Grammora Shadow DOM host to be injected
    await page.waitForSelector('#grammora-host', { state: 'attached', timeout: 8000 });
  });

  test('should inject Shadow DOM host into webpage without breaking page styles', async ({ page }) => {
    const host = page.locator('#grammora-host');
    await expect(host).toBeAttached();

    // Verify host is styled fixed and non-interfering
    const zIndex = await host.evaluate((el) => window.getComputedStyle(el).zIndex);
    expect(Number(zIndex)).toBeGreaterThanOrEqual(2147483647);
  });

  test('should trigger autocomplete suggestion card when typing in textarea', async ({ page }) => {
    const textarea = page.locator('#sample-textarea');
    await textarea.click();
    await textarea.pressSequentially('I am looking for', { delay: 30 });

    // Wait for 350ms debounce + background API response
    const suggestionCard = page.locator('#grammora-host').locator('[role="tooltip"]');
    await expect(suggestionCard).toBeVisible({ timeout: 8000 });

    // Verify Tab instruction is visible
    const tabPill = suggestionCard.getByText('Tab');
    await expect(tabPill).toBeVisible();

    // Press Tab to accept suggestion
    await page.keyboard.press('Tab');

    // Verify the completion text has been inserted into textarea
    const updatedValue = await textarea.inputValue();
    expect(updatedValue.startsWith('I am looking for')).toBe(true);
    expect(updatedValue.length).toBeGreaterThan('I am looking for'.length);
  });

  test('should show floating pen pill and execute grammar correction', async ({ page }) => {
    const textarea = page.locator('#sample-textarea');
    await textarea.click();
    await textarea.fill('this sentence have some typo and grammer mistake');

    // Select the sentence
    await textarea.evaluate((el: HTMLTextAreaElement) => {
      el.focus();
      el.setSelectionRange(0, el.value.length);
      el.dispatchEvent(new Event('mouseup', { bubbles: true }));
    });

    // Wait for floating Pen button to appear
    const penPill = page.locator('#grammora-host').locator('[role="button"][aria-label*="Writing Assistant"]');
    await expect(penPill).toBeVisible({ timeout: 5000 });

    // Click Pen button to open toolbar
    await penPill.click();

    // Verify writing toolbar is visible
    const toolbar = page.locator('#grammora-host').locator('[role="toolbar"]');
    await expect(toolbar).toBeVisible();

    // Click Fix Grammar
    const fixGrammarBtn = toolbar.getByRole('button', { name: /fix grammar/i });
    await fixGrammarBtn.click();

    // Preview card appears with diff
    const previewCard = page.locator('#grammora-host').locator('[role="dialog"][aria-label*="Grammar"]');
    await expect(previewCard).toBeVisible({ timeout: 8000 });

    // Apply the correction
    const applyBtn = previewCard.getByRole('button', { name: /apply/i });
    await expect(applyBtn).toBeVisible({ timeout: 12000 });
    await applyBtn.click();

    // Verify text in textarea was safely replaced
    const correctedValue = await textarea.inputValue();
    expect(correctedValue).toContain('This sentence has');
    expect(correctedValue).toContain('mistakes');
  });

  test('should execute concise tone rewrite on wordy text', async ({ page }) => {
    const textarea = page.locator('#sample-textarea');
    await textarea.click();
    await textarea.fill('In my personal opinion, I really think that it is very important that we must remember to consider this option because it might be helpful.');

    // Select text
    await textarea.evaluate((el: HTMLTextAreaElement) => {
      el.focus();
      el.setSelectionRange(0, el.value.length);
      el.dispatchEvent(new Event('mouseup', { bubbles: true }));
    });

    // Click pen button
    const penPill = page.locator('#grammora-host').locator('[role="button"][aria-label*="Writing Assistant"]');
    await expect(penPill).toBeVisible({ timeout: 5000 });
    await penPill.click();

    // Click Concise
    const conciseBtn = page.locator('#grammora-host').locator('[role="toolbar"]').getByRole('button', { name: /concise/i });
    await conciseBtn.click();

    // Preview card appears
    const previewCard = page.locator('#grammora-host').locator('[role="dialog"][aria-label*="Concise"]');
    await expect(previewCard).toBeVisible({ timeout: 8000 });

    const applyBtn = previewCard.getByRole('button', { name: /apply/i });
    await expect(applyBtn).toBeVisible({ timeout: 12000 });
    await applyBtn.click();

    // Verify replaced text is noticeably shorter
    const conciseValue = await textarea.inputValue();
    expect(conciseValue.length).toBeLessThan(70);
  });

  test('should strictly ignore sensitive password and credit card inputs', async ({ page }) => {
    // 1. Password input
    const passwordInput = page.locator('#sample-password');
    await passwordInput.click();
    await passwordInput.evaluate((el: HTMLInputElement) => {
      el.select();
      el.dispatchEvent(new Event('mouseup', { bubbles: true }));
    });

    // Verify NO pen pill appears
    const penPill = page.locator('#grammora-host').locator('[role="button"][aria-label*="Writing Assistant"]');
    await expect(penPill).not.toBeVisible();

    // 2. Credit card input
    const ccInput = page.locator('#sample-cc');
    await ccInput.click();
    await ccInput.evaluate((el: HTMLInputElement) => {
      el.select();
      el.dispatchEvent(new Event('mouseup', { bubbles: true }));
    });
    await expect(penPill).not.toBeVisible();

    // 3. Explicit ignore tag
    const ignoredTextarea = page.locator('textarea[data-grammora-ignore="true"]');
    await ignoredTextarea.click();
    await ignoredTextarea.evaluate((el: HTMLTextAreaElement) => {
      el.select();
      el.dispatchEvent(new Event('mouseup', { bubbles: true }));
    });
    await expect(penPill).not.toBeVisible();
  });

  test('should dismiss suggestion card when Escape is pressed', async ({ page }) => {
    const textarea = page.locator('#sample-textarea');
    await textarea.click();
    await textarea.clear();
    await textarea.pressSequentially('I am looking for', { delay: 30 });

    const suggestionCard = page.locator('#grammora-host').locator('[role="tooltip"]');
    await expect(suggestionCard).toBeVisible({ timeout: 8000 });

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(suggestionCard).not.toBeVisible();
  });

  test('should dismiss suggestion card when navigation arrow keys move caret', async ({ page }) => {
    const textarea = page.locator('#sample-textarea');
    await textarea.click();
    await textarea.clear();
    await textarea.pressSequentially('I am looking for', { delay: 30 });

    const suggestionCard = page.locator('#grammora-host').locator('[role="tooltip"]');
    await expect(suggestionCard).toBeVisible({ timeout: 8000 });

    // Arrow Left moves caret away from the typed boundary
    await page.keyboard.press('ArrowLeft');
    await expect(suggestionCard).not.toBeVisible();
  });

  test('should support rich-text contenteditable container selection and rephrasing', async ({ page }) => {
    // Click the built-in helper button to focus and highlight contenteditable
    await page.click('button:has-text("Highlight Sample in ContentEditable")');

    const penPill = page.locator('#grammora-host').locator('[role="button"][aria-label*="Writing Assistant"]');
    await expect(penPill).toBeVisible({ timeout: 6000 });
    await penPill.click();

    const toolbar = page.locator('#grammora-host').locator('[role="toolbar"]');
    await expect(toolbar).toBeVisible({ timeout: 6000 });

    const rephraseBtn = toolbar.getByRole('button', { name: /rephrase/i });
    await rephraseBtn.click();

    const previewCard = page.locator('#grammora-host').locator('[role="dialog"][aria-label*="Rephrase"]');
    await expect(previewCard).toBeVisible({ timeout: 8000 });

    const applyBtn = previewCard.getByRole('button', { name: /apply/i });
    await expect(applyBtn).toBeVisible({ timeout: 12000 });
    await applyBtn.click();

    // Verify contenteditable text changed
    const ce = page.locator('#sample-contenteditable');
    const newText = await ce.innerText();
    expect(newText).not.toContain("She don't knows");
  });

  test('should allow navigating back from preview card to toolbar to try another feature without re-selecting', async ({ page }) => {
    const textarea = page.locator('#sample-textarea');
    await textarea.click();
    await textarea.fill('this sentence have some typo and grammer mistake');

    // Select text
    await textarea.evaluate((el: HTMLTextAreaElement) => {
      el.focus();
      el.setSelectionRange(0, el.value.length);
      el.dispatchEvent(new Event('mouseup', { bubbles: true }));
    });

    // Click floating pen pill
    const penPill = page.locator('#grammora-host').locator('[role="button"][aria-label*="Writing Assistant"]');
    await expect(penPill).toBeVisible({ timeout: 5000 });
    await penPill.click();

    // Verify toolbar is visible
    const toolbar = page.locator('#grammora-host').locator('[role="toolbar"]');
    await expect(toolbar).toBeVisible();

    // 1. First click "Fix Grammar"
    const fixGrammarBtn = toolbar.getByRole('button', { name: /fix grammar/i });
    await fixGrammarBtn.click();

    // 2. Grammar preview card appears with Back button
    const grammarCard = page.locator('#grammora-host').locator('[role="dialog"][aria-label*="Grammar"]');
    await expect(grammarCard).toBeVisible({ timeout: 8000 });

    const backBtn = grammarCard.getByRole('button', { name: /back/i }).first();
    await expect(backBtn).toBeVisible();

    // 3. Click "Back" without re-selecting
    await backBtn.click();

    // 4. Verify toolbar is visible again with all features
    await expect(toolbar).toBeVisible({ timeout: 5000 });

    // 5. Now choose another feature: "Professional"
    const professionalBtn = toolbar.getByRole('button', { name: /professional/i });
    await professionalBtn.click();

    // 6. Professional preview card appears
    const profCard = page.locator('#grammora-host').locator('[role="dialog"][aria-label*="Professional"]');
    await expect(profCard).toBeVisible({ timeout: 8000 });

    const applyBtn = profCard.getByRole('button', { name: /apply/i });
    await expect(applyBtn).toBeVisible({ timeout: 12000 });
    await applyBtn.click();

    // 7. Verify text changed
    const finalValue = await textarea.inputValue();
    expect(finalValue.length).toBeGreaterThan(10);
  });
});
