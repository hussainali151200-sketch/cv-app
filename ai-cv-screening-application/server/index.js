import "dotenv/config";
import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { analyzeCV } from "./analyze.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Multer config: accept only PDF, DOC, DOCX up to 5MB ---
const ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Reject the file; we check req.file below
      cb(null, false);
    }
  },
});

// --- POST /api/analyze ---
app.post("/api/analyze", upload.single("cv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Invalid file type. Please upload a PDF, DOC, or DOCX file.",
      });
    }

    const result = await analyzeCV(req.file);
    return res.json(result);
  } catch (err) {
    // Multer errors
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large. Maximum size is 5MB.",
      });
    }

    console.error("Analysis error:", err);
    return res.status(500).json({
      error: err.message || "An unexpected error occurred during analysis.",
    });
  }
});

// --- Health check ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`✅ CV Screening API running on http://localhost:${PORT}`);
});
