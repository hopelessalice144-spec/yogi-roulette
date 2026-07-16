/**
 * DOM-sink hardening — strip HTML for any dynamic text (XSS defense-in-depth).
 */
const HTML_ESCAPE = /[&<>"'`/=]/g;
const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
  '/': '&#47;',
  '=': '&#61;',
};

/** Escape user-controlled strings before display (React children preferred). */
export function sanitizeText(input) {
  if (input == null) return '';
  return String(input).replace(HTML_ESCAPE, (ch) => ESCAPE_MAP[ch] ?? ch);
}

/** Reject strings that still contain angle brackets after trim. */
export function assertPlainText(input) {
  const s = String(input ?? '');
  return !/[<>]/.test(s);
}
