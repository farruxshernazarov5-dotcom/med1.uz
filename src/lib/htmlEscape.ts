// HTML escaping helper to prevent stored XSS in print/PDF templates.
// Use whenever interpolating untrusted DB-derived strings into raw HTML.
export const esc = (s: any): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
