// Native Vercel Serverless Function (Node.js runtime)
// Parses the multipart upload manually with busboy so it works reliably on Vercel.
import Busboy from "busboy";
import { analyzeCV } from "../server/analyze.js";

const ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Tell Vercel NOT to parse the body — we need the raw stream for busboy.
export const config = {
  api: {
    bodyParser: false,
  },
};

// Parse a single uploaded file ("cv" field) from the request stream.
function parseUpload(req) {
  return new Promise((resolve, reject) => {
    let busboy;
    try {
      busboy = Busboy({
        headers: req.headers,
        limits: { fileSize: MAX_SIZE, files: 1 },
      });
    } catch (err) {
      return reject(new Error("Invalid upload request."));
    }

    let fileInfo = null;
    let tooLarge = false;
    let badType = false;

    busboy.on("file", (_name, stream, info) => {
      const { filename, mimeType } = info;

      if (!ALLOWED_MIMES.includes(mimeType)) {
        badType = true;
        stream.resume(); // drain & ignore
        return;
      }

      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("limit", () => {
        tooLarge = true;
        stream.resume();
      });
      stream.on("end", () => {
        if (!tooLarge) {
          fileInfo = {
            originalname: filename,
            mimetype: mimeType,
            buffer: Buffer.concat(chunks),
          };
        }
      });
    });

    busboy.on("error", (err) => reject(err));

    busboy.on("finish", () => {
      if (tooLarge) {
        return reject(Object.assign(new Error("File too large. Maximum size is 5MB."), { statusCode: 400 }));
      }
      if (badType || !fileInfo) {
        return reject(Object.assign(new Error("Invalid file type. Please upload a PDF, DOC, or DOCX file."), { statusCode: 400 }));
      }
      resolve(fileInfo);
    });

    req.pipe(busboy);
  });
}

export default async function handler(req, res) {
  // CORS (same-origin in production, but harmless to include)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const file = await parseUpload(req);
    const result = await analyzeCV(file);
    return res.status(200).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    console.error("Analysis error:", err);
    return res.status(status).json({
      error: err.message || "An unexpected error occurred during analysis.",
    });
  }
}
