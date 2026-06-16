import { useState, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface AnalysisResult {
  keywordScore: number;
  aiScore: number;
  finalScore: number;
  decision: "MATCH" | "NOT MATCH";
  aiReason: string;
  keywordMatched: string[];
  keywordMissed: string[];
  totalKeywords: number;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    setError(null);
    setResult(null);

    if (!f) return;

    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowed.includes(f.type)) {
      setError("Invalid file type. Please upload a PDF, DOC, or DOCX file.");
      return;
    }

    if (f.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }

    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] || null);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("cv", file);

      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isMatch = result?.decision === "MATCH";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-200">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">CV Screening Gateway</h1>
              <p className="text-xs text-slate-500">Customer Support Representative</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Title Section */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Upload your CV to check if you're a match
          </h2>
          <p className="mt-3 text-slate-500">
            We'll analyze your CV against the Customer Support Representative role requirements.
          </p>
        </div>

        {/* Upload Area */}
        {!result && (
          <div className="space-y-6">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
                dragOver
                  ? "border-blue-400 bg-blue-50/50"
                  : file
                    ? "border-green-300 bg-green-50/30"
                    : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
                className="hidden"
              />

              {file ? (
                <div className="space-y-2">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                    <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="font-medium text-slate-800">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Choose a different file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Drag & drop your CV here</p>
                    <p className="text-sm text-slate-400">or click to browse</p>
                  </div>
                  <p className="text-xs text-slate-400">PDF, DOC, or DOCX — Max 5MB</p>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className={`w-full rounded-xl py-3.5 text-center font-semibold text-white transition-all duration-200 ${
                !file || loading
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-indigo-700 active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing your CV...
                </span>
              ) : (
                "Analyze My CV"
              )}
            </button>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="space-y-6">
            {/* Decision Banner */}
            <div
              className={`rounded-2xl p-8 text-center ${
                isMatch
                  ? "bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200"
                  : "bg-gradient-to-br from-red-50 to-rose-100 border border-red-200"
              }`}
            >
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
                  isMatch ? "bg-emerald-500" : "bg-red-500"
                }`}
              >
                {isMatch ? (
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3
                className={`text-2xl font-bold ${
                  isMatch ? "text-emerald-800" : "text-red-800"
                }`}
              >
                {isMatch ? "🎉 Your CV is a match, proceed!" : "Your CV is not a match"}
              </h3>
              <p className={`mt-2 ${isMatch ? "text-emerald-600" : "text-red-600"}`}>
                {isMatch
                  ? "Your profile aligns well with the Customer Support Representative role."
                  : "Your profile doesn't meet the minimum requirements for this role at this time."}
              </p>
            </div>

            {/* Score Details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="mb-4 text-lg font-semibold text-slate-800">Score Breakdown</h4>

              {/* Final Score Gauge */}
              <div className="mb-6 flex items-center justify-center">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={isMatch ? "#10b981" : "#ef4444"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(result.finalScore / 10) * 264} 264`}
                    />
                  </svg>
                  <span className={`absolute text-2xl font-bold ${isMatch ? "text-emerald-600" : "text-red-500"}`}>
                    {result.finalScore}
                  </span>
                </div>
              </div>

              {/* Sub-scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-blue-50 p-4 text-center">
                  <p className="text-sm font-medium text-blue-600">Keyword Score</p>
                  <p className="mt-1 text-2xl font-bold text-blue-800">
                    {result.keywordScore}<span className="text-base font-normal text-blue-500">/{result.totalKeywords}</span>
                  </p>
                  <p className="mt-1 text-xs text-blue-500">60% weight</p>
                </div>
                <div className="rounded-xl bg-violet-50 p-4 text-center">
                  <p className="text-sm font-medium text-violet-600">AI Score</p>
                  <p className="mt-1 text-2xl font-bold text-violet-800">
                    {result.aiScore}<span className="text-base font-normal text-violet-500">/10</span>
                  </p>
                  <p className="mt-1 text-xs text-violet-500">40% weight</p>
                </div>
              </div>

              {/* AI Reason */}
              {result.aiReason && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">AI Reasoning</p>
                  <p className="mt-1 text-sm text-slate-600">{result.aiReason}</p>
                </div>
              )}

              {/* Keyword Details */}
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Matched Keywords ({result.keywordMatched.length}/{result.totalKeywords})
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.keywordMatched.map((kw) => (
                      <span key={kw} className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {kw}
                      </span>
                    ))}
                    {result.keywordMatched.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No keywords matched</span>
                    )}
                  </div>
                </div>

                {result.keywordMissed.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Missed Keywords ({result.keywordMissed.length})
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.keywordMissed.map((kw) => (
                        <span key={kw} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 line-through">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Try Again Button */}
            <button
              onClick={handleReset}
              className="w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 text-center font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]"
            >
              Analyze Another CV
            </button>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
          <h4 className="text-sm font-semibold text-slate-700">How it works</h4>
          <ul className="mt-3 space-y-2">
            {[
              "Upload your CV in PDF, DOC, or DOCX format (max 5MB)",
              "We extract and analyze your CV text for 10 key Customer Support keywords (minimum 5 required)",
              "AI evaluates your experience and relevance to the role",
              "Combined keyword score (60%) + AI score (40%) determines if you're a match",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center">
        <p className="text-xs text-slate-400">CV Screening Gateway &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
