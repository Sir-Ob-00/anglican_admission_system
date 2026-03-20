import validator from "validator";

export function requireFields(body, fields) {
  const missing = fields.filter((f) => body?.[f] == null || String(body[f]).trim() === "");
  return missing;
}

export function isEmail(value) {
  return validator.isEmail(String(value || ""));
}

export function normalizeEmail(value) {
  return validator.normalizeEmail(String(value || "")) || String(value || "").toLowerCase();
}

export function safeTrim(value) {
  return String(value || "").trim();
}
