import express from "express";
import multer from "multer";
import cors from "cors";
import { analyzeCV } from "../server/analyze.js";

const app = express();

app.use(cors());
app.use(express.json());

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
      cb(null, false);
    }
  },
});

app.post(["/api/analyze", "/analyze"], upload.single("cv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Invalid file type. Please upload a PDF, DOC, or DOCX file.",
      });
    }

    const result = await analyzeCV(req.file);
    return res.json(result);
  } catch (err) {
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

// Vercel serverless functions automatically pass (req, res) to an exported Express app
export default app;
