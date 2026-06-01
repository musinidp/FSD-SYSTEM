import React, { useState } from "react";
import { Sparkles, Code, FileText, Clipboard, Check, Terminal, Cpu, ArrowRight, BookOpen, Layers } from "lucide-react";

interface AICodeAssistantProps {
  currentLobbyCode: string | null;
}

export default function AICodeAssistant({ currentLobbyCode }: AICodeAssistantProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [contextType, setContextType] = useState<string>("Python Backend Code");
  const [loading, setLoading] = useState<boolean>(false);
  const [output, setOutput] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const templates = [
    {
      title: "SQLite State Sync",
      desc: "Python loop utilizing sqlite3 matching operations ledger structure",
      prompt: `Write a robust Python sqlite3 handler script. It should define the 'operations_ledger' table structure matching our schema, provide safe transactional checkouts (TOC) and handover calculations (HOC), verify LP and ALP ids, and cleanly close connection handles.`,
      context: "Python Backend Code"
    },
    {
      title: "Pandas Lobby report",
      desc: "Pandas analytics script aggregating active trip files to Excel Sheets",
      prompt: `Generate a Python script using pandas. It reads 'railway_fsd_master.db' database tables, maps LP/ALP names, computes the duration of active vs completed runs, count incidents of physical damage vs charging failures, and outputs a formatted spreadsheet summary.`,
      context: "Pandas Reports"
    },
    {
      title: "FastAPI REST Server",
      desc: "Python web server with Pydantic payload validations & routers",
      prompt: `Create a FastAPI modular server file in Python. Write Pydantic model state declarations for Lobby, Device, and Operations Ledger, implement PUT/POST routes for sign-on TOC, return status JSONs, and write exception handling for dual checkouts.`,
      context: "FastAPI Endpoints"
    },
    {
      title: "API Documentation",
      desc: "Complete OpenAPI Swagger specifications of state-machine endpoints",
      prompt: `Provide complete OpenAPI/Swagger specifications for an Indian Railways FSD system. Document routes: GET /api/fsd/lobbies, POST /api/fsd/controllers, POST /api/fsd/operations/toc (Takeover), and POST /api/fsd/operations/hoc (Handover). Specify JSON parameters and response envelopes.`,
      context: "API Documentation"
    }
  ];

  const handleGenerate = async (finalPrompt: string, selectedContext: string) => {
    setLoading(true);
    setErrorMsg("");
    setOutput("");
    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          context: selectedContext
        })
      });
      const data = await response.json();
      if (response.ok) {
        setOutput(data.output || "No output returned.");
      } else {
        setErrorMsg(data.error || "An error occurred during output generation.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to connect to full-stack server backend. Check secret config.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Bespoke aesthetic micro-parser for custom colored coding screens
  const renderMessageContent = (text: string) => {
    if (!text) return null;

    // Split text by markdown code blocks ```
    const segments = text.split(/(```[\s\S]*?```)/g);

    return segments.map((seg, idx) => {
      if (seg.startsWith("```")) {
        // Code Block
        const lines = seg.split("\n");
        const headingLine = lines[0];
        const lang = headingLine.replace("```", "").trim() || "python";
        const codeContent = lines.slice(1, -1).join("\n");

        return (
          <div key={idx} className="my-5 rounded-lg overflow-hidden border border-rail-border bg-[#030611]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#0c1226] border-b border-rail-border">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-rail-glow" />
                <span className="font-mono text-xs uppercase tracking-wider text-slate-300 font-semibold">
                  Source Snippet ({lang})
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(codeContent);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition font-mono text-[10px]"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">COPIED</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3 h-3" />
                    <span>COPY CODE</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto font-mono text-xs text-slate-100 leading-relaxed max-h-[450px]">
              {codeContent}
            </pre>
          </div>
        );
      } else {
        // Plain Text - split by headers or standard list items to add subtle styles
        const lines = seg.split("\n");
        return (
          <div key={idx} className="space-y-2.5 text-slate-300 font-sans text-sm leading-relaxed">
            {lines.map((line, lIdx) => {
              if (line.trim().startsWith("###")) {
                return (
                  <h4 key={lIdx} className="text-base font-semibold text-white pt-3 font-display tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-rail-glow rounded-sm"></span>
                    {line.replace("###", "").trim()}
                  </h4>
                );
              }
              if (line.trim().startsWith("##")) {
                return (
                  <h3 key={lIdx} className="text-lg font-bold text-rail-glow pt-4 font-display">
                    {line.replace("##", "").trim()}
                  </h3>
                );
              }
              if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
                return (
                  <li key={lIdx} className="ml-4 list-disc text-slate-300 text-sm">
                    {line.replace(/^[-*]\s*/, "")}
                  </li>
                );
              }
              return line.trim() ? <p key={lIdx}>{line}</p> : <div key={lIdx} className="h-1" />;
            })}
          </div>
        );
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ai-developer-workspace">
      {/* Left Input panel (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        <div className="bg-rail-panel rounded-xl border border-rail-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rail-accent/15 rounded-lg border border-rail-accent/20">
              <Sparkles className="w-5 h-5 text-rail-glow animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-white">AI FSD Code Generator</h3>
              <p className="text-xs text-slate-400">Gemini model sequence optimized for Railway FSD logic</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Asset Framework Target Context
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["Python Backend Code", "Pandas Reports", "FastAPI Endpoints", "API Documentation"].map((ctx) => (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => setContextType(ctx)}
                    className={`px-3 py-2 rounded-lg border text-left transition text-xs font-mono font-medium ${
                      contextType === ctx
                        ? "bg-rail-accent/20 border-rail-accent text-white shadow-md shadow-rail-accent/10"
                        : "bg-rail-dark/40 border-rail-border text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {ctx === "Python Backend Code" && <Code className="w-3.5 h-3.5 inline mr-1.5 text-rail-accent" />}
                    {ctx === "Pandas Reports" && <Layers className="w-3.5 h-3.5 inline mr-1.5 text-emerald-400" />}
                    {ctx === "FastAPI Endpoints" && <Cpu className="w-3.5 h-3.5 inline mr-1.5 text-[#f59e0b]" />}
                    {ctx === "API Documentation" && <FileText className="w-3.5 h-3.5 inline mr-1.5 text-pink-400" />}
                    {ctx}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Enter Custom Prompt Request
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your FSD operational logic requirements (e.g. Write a script to calculate detonator box checkout limits based on lobby size)..."
                className="w-full h-32 px-4 py-3 rounded-lg border border-rail-border bg-[#030712] text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-rail-glow focus:border-rail-glow font-sans leading-relaxed"
              />
            </div>

            <button
              onClick={() => handleGenerate(prompt, contextType)}
              disabled={loading || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-linear-to-r from-rail-accent to-[#7209b7] hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-800 text-white font-medium rounded-lg shadow-lg hover:shadow-rail-accent/25 transition disabled:cursor-not-allowed text-sm"
              id="btn-generate-fsd-code"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>ANALYZING SYSTEM SCHEMA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-rail-glow" />
                  <span>GENERATE {contextType.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Templates Quick Select */}
        <div className="bg-rail-panel rounded-xl border border-rail-border p-5">
          <h4 className="font-display font-semibold text-sm text-slate-300 mb-3 uppercase tracking-wider font-mono">
            Structured FSD Templates
          </h4>
          <div className="flex flex-col gap-2.5">
            {templates.map((templ, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(templ.prompt);
                  setContextType(templ.context);
                }}
                className="p-3 bg-rail-dark/40 hover:bg-rail-dark/80 rounded-lg border border-rail-border/60 hover:border-rail-accent text-left group transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-display text-xs font-semibold group-hover:text-rail-glow transition">
                    {templ.title}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 group-hover:text-rail-glow transition" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{templ.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Terminal Output (7 cols) */}
      <div className="lg:col-span-7 flex flex-col">
        <div className="bg-rail-panel rounded-xl border border-rail-border flex-1 flex flex-col min-h-[480px]">
          {/* Header Panel */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-rail-border bg-rail-dark/40">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-glow"></div>
              <span className="font-mono text-xs uppercase tracking-wider font-semibold text-slate-300">
                LOBBY DEV CONSOLE TERMINAL
              </span>
            </div>
            {output && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-mono hover:text-white text-slate-400 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">COPIED TO CLIPBOARD</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>COPY ALL RESPONSE</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Terminal Body */}
          <div className="flex-1 p-5 overflow-y-auto max-h-[640px] bg-rail-dark/25 font-mono">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center gap-3.5 py-24">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-rail-accent/10 border-t-rail-glow animate-spin"></div>
                  <Sparkles className="w-5 h-5 text-rail-glow absolute top-3.5 left-3.5 animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs uppercase tracking-widest text-[#00f5d4] font-semibold">Gemini Developer AI Thinking...</p>
                  <p className="text-[10px] text-slate-400 font-sans">Compiling FSD schema contexts, aligning SQLite vectors, and drafting Python scripts...</p>
                </div>
              </div>
            )}

            {!loading && !output && !errorMsg && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 px-8">
                <Terminal className="w-12 h-12 text-slate-600 mb-4 animate-bounce" />
                <h4 className="text-sm font-display font-medium text-slate-300 mb-1">Awaiting AI Query Parameters</h4>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-sans">
                  Select an FSD helper template on the left or compose a custom prompt. Gemini AI will generate fully certified Python code or API specs optimized for South Central Railway operations.
                </p>
                {currentLobbyCode && (
                  <div className="mt-4 px-3 py-1.5 bg-rail-accent/10 border border-rail-accent/25 rounded-md text-[11px] text-rail-glow font-mono font-medium">
                    ACTIVE ENVIRONMENT REFERENCE KEY: LOBBY {currentLobbyCode}
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-lg bg-red-950/40 border border-red-900 text-red-300 text-xs flex gap-3 leading-relaxed">
                <span className="font-bold">SYSTEM ERROR:</span>
                <div>
                  <p className="font-semibold">{errorMsg}</p>
                  <p className="font-sans text-[10px] text-red-400 mt-1">Verify that your Gemini API Key is configured in Settings &gt; Secrets. Lazy load verification complete.</p>
                </div>
              </div>
            )}

            {!loading && output && (
              <div className="space-y-4">
                {renderMessageContent(output)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
