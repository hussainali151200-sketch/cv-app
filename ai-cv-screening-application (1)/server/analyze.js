import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { createClient } from "@supabase/supabase-js";

// ─── Constants ────────────────────────────────────────────────
const KEYWORDS = [
  "customer support",
  "customer service",
  "communication",
  "call support",
  "problem solving",
  "crm",
  "ticketing",
  "email support",
  "live chat",
  "client handling",
];

const MIN_KEYWORD_MATCH = 5;
const KEYWORD_WEIGHT = 0.6;
const AI_WEIGHT = 0.4;
const MATCH_THRESHOLD = 5;

const AI_API_URL = "https://api.openai.com/v1/chat/completions";
const AI_MODEL = "gpt-4o-mini";

// ─── Supabase client (server-side only) ─────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const aiApiKey = process.env.AI_API_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// ─── Text normalization ───────────────────────────────────────
export function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // remove special characters
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

// ─── Extract text from file ───────────────────────────────────
async function extractText(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  // Support both memoryStorage (file.buffer) and diskStorage (file.path)
  const buffer = file.buffer || (await fs.readFile(file.path));

  // Clean up temp file after reading if disk storage was used
  const cleanup = async () => {
    if (file.path) {
      await fs.unlink(file.path).catch(() => {});
    }
  };

  try {
    if (ext === ".pdf") {
      // pdf-parse v2 API: instantiate PDFParse, call getText(), then destroy()
      const parser = new PDFParse({ data: buffer });
      try {
        const data = await parser.getText();
        await cleanup();
        return data.text;
      } finally {
        await parser.destroy().catch(() => {});
      }
    }

    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      await cleanup();
      return result.value;
    }

    if (ext === ".doc") {
      // mammoth handles .docx only; .doc is binary and hard to parse in Node.
      // We'll attempt a best-effort text extraction from the raw buffer.
      await cleanup();
      throw new Error(
        "Legacy .doc files are not fully supported. Please convert to .docx or .pdf."
      );
    }

    await cleanup();
    throw new Error("Unsupported file format.");
  } catch (err) {
    await cleanup();
    throw err;
  }
}

// ─── Keyword matching ─────────────────────────────────────────
function matchKeywords(normalizedText) {
  const matched = [];
  const missed = [];

  for (const kw of KEYWORDS) {
    if (normalizedText.includes(kw)) {
      matched.push(kw);
    } else {
      missed.push(kw);
    }
  }

  return { matched, missed, score: matched.length };
}

// ─── AI Evaluation ────────────────────────────────────────────
async function evaluateWithAI(normalizedText) {
  if (!aiApiKey) {
    console.warn("⚠️  AI_API_KEY not set. Falling back to aiScore = 0.");
    return { score: 0, reason: "AI evaluation unavailable (no API key configured)." };
  }

  const prompt = `You are an expert HR recruiter.

Analyze the following CV for the position of Customer Support Representative.

Job Requirements:

Strong communication skills
Experience in customer support or customer service
Call handling experience
CRM or ticketing tools experience
Problem-solving ability
Email or chat support experience
Instructions:

Score the CV from 0 to 10 based on relevance to this role.
Consider real experience, not just keyword mentions.
Be realistic and strict.
Give reasoning in 2 short lines.
Return ONLY valid JSON in this format:
{
"score": number,
"reason": "short explanation"
}

CV TEXT:
${normalizedText}`;

  try {
    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: "You are an expert HR recruiter. You ONLY respond with valid JSON, no markdown, no code fences." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`AI API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response (handle markdown code fences)
    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }

    const parsed = JSON.parse(jsonStr);

    if (typeof parsed.score !== "number" || parsed.score < 0 || parsed.score > 10) {
      throw new Error("Invalid AI score value.");
    }

    return {
      score: parsed.score,
      reason: parsed.reason || "No reason provided.",
    };
  } catch (err) {
    console.error("AI evaluation failed:", err.message);
    return { score: 0, reason: `AI evaluation failed: ${err.message}` };
  }
}

// ─── Store result in Supabase ─────────────────────────────────
async function storeResult(record) {
  if (!supabase) {
    console.warn("⚠️  Supabase not configured. Skipping database storage.");
    return null;
  }

  try {
    const { error } = await supabase.from("cv_evaluations").insert(record);
    if (error) {
      console.error("Supabase insert error:", error.message);
    }
  } catch (err) {
    console.error("Supabase error:", err.message);
  }
}

// ─── Main analysis pipeline ───────────────────────────────────
export async function analyzeCV(file) {
  // 1. Extract text
  let rawText;
  try {
    rawText = await extractText(file);
  } catch (err) {
    throw new Error(`Text extraction failed: ${err.message}`);
  }

  if (!rawText || rawText.trim().length === 0) {
    throw new Error("Could not extract any text from the uploaded file. The file may be empty, scanned/image-based, or corrupted.");
  }

  // 2. Normalize
  const normalized = normalizeText(rawText);

  // 3. Keyword matching
  const keywordResult = matchKeywords(normalized);
  const keywordScore = keywordResult.score;

  // 4. AI Evaluation
  const aiResult = await evaluateWithAI(normalized);
  const aiScore = aiResult.score;

  // 5. Final score
  const finalScore = keywordScore * KEYWORD_WEIGHT + aiScore * AI_WEIGHT;
  const decision = finalScore >= MATCH_THRESHOLD ? "MATCH" : "NOT MATCH";

  // 6. Store in Supabase
  const record = {
    file_name: file.originalname,
    keyword_score: keywordScore,
    ai_score: aiScore,
    final_score: Math.round(finalScore * 100) / 100,
    decision,
    ai_reason: aiResult.reason || "",
  };

  await storeResult(record);

  return {
    keywordScore,
    aiScore,
    finalScore: Math.round(finalScore * 100) / 100,
    decision,
    aiReason: aiResult.reason,
    keywordMatched: keywordResult.matched,
    keywordMissed: keywordResult.missed,
    totalKeywords: KEYWORDS.length,
  };
}
