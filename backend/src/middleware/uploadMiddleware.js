import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const documentsDir = path.join(__dirname, "..", "uploads", "documents");

function sanitizeName(name) {
  return String(name || "file")
    .replaceAll(/[^\w.\-() ]/g, "_")
    .slice(0, 120);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, documentsDir),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const base = sanitizeName(file.originalname);
    cb(null, `${ts}_${base}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Unsupported file type. Allowed: pdf, jpeg, png, webp"));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.uploadMaxBytes },
});

