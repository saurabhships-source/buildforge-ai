"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const EXAMPLE_PROMPTS = [
  "A SaaS landing page for a project management tool with dark theme, hero section, features grid, and pricing cards",
  "An e-commerce product page for luxury sneakers with image gallery, size selector, and add to cart",
  "A personal portfolio for a UI/UX designer with animated hero, case studies, and contact form",
  "A restaurant website with full-screen food photography, reservation form, and menu section",
];

const WS_URL = "ws://127.0.0.1:8000/ws/generate";
type Status = "idle" | "connecting" | "streaming" | "done" | "error";

export default function BuildForgePage() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [activeExample, setActiveExample] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const htmlBufferRef = useRef<string>("");

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  useEffect(() => {
    if (!iframeRef.current || !previewHtml) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open(); doc.write(previewHtml); doc.close();
  }, [previewHtml]);

  const connectAndGenerate = useCallback(() => {
    if (!prompt.trim()) return;
    if (wsRef.current) wsRef.current.close();
    setStatus("connecting");
    setErrorMsg("");
    htmlBufferRef.current = "";
    setPreviewHtml("");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => { setStatus("streaming"); ws.send(JSON.stringify({ prompt: prompt.trim() })); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chunk") { htmlBufferRef.current += data.content; setPreviewHtml(htmlBufferRef.current); }
        else if (data.type === "done") { setStatus("done"); ws.close(); }
        else if (data.type === "error") { setErrorMsg(data.message || "Generation failed."); setStatus("error"); ws.close(); }
      } catch { htmlBufferRef.current += event.data; setPreviewHtml(htmlBufferRef.current); }
    };
    ws.onerror = () => { setErrorMsg("WebSocket connection failed. Make sure your backend is running at ws://127.0.0.1:8000"); setStatus("error"); };
    ws.onclose = () => { if (status === "streaming") setStatus("done"); };
  }, [prompt, status]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") connectAndGenerate();
  };

  const isGenerating = status === "connecting" || status === "streaming";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { font-size: 16px; }
        body {
          font-family: 'Manrope', sans-serif;
          background: #080c14;
          color: #f0f2f8;
          height: 100vh; width: 100vw; overflow: hidden;
        }

        :root {
          --orange:     #ff6b2b;
          --orange-lt:  #ff8c55;
          --orange-glow:rgba(255,107,43,0.22);
          --orange-dim: rgba(255,107,43,0.1);
          --orange-border: rgba(255,107,43,0.4);
          --blue:       #4f9eff;
          --blue-dim:   rgba(79,158,255,0.1);
          --green:      #3ddcaa;
          --bg:         #080c14;
          --panel:      #0d1220;
          --surface:    #131b2e;
          --surface2:   #192338;
          --border:     #1e2a42;
          --border-hi:  #2a3a58;
          --text:       #f0f2f8;
          --text-dim:   #c8d0e8;
          --muted:      #7a8ab0;
          --mono:       'JetBrains Mono', monospace;
          --display:    'Syne', sans-serif;
          --body:       'Manrope', sans-serif;
        }

        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gradShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-6px); }
        }

        ::-webkit-scrollbar       { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2a42; border-radius: 4px; }

        /* ── LOGO ── */
        .logo-text {
          font-family: var(--display);
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: -0.04em;
          background: linear-gradient(90deg, #ff6b2b, #ff9f60, #ff6b2b);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradShift 4s ease infinite;
        }
        .logo-ai {
          font-family: var(--display);
          font-weight: 600;
          font-size: 1rem;
          color: var(--blue);
          margin-left: 5px;
          -webkit-text-fill-color: var(--blue);
        }

        /* ── TEXTAREA ── */
        .prompt-area {
          background: transparent;
          border: none; outline: none;
          color: #f0f2f8;
          font-family: var(--body);
          font-size: 1rem;
          font-weight: 500;
          line-height: 1.75;
          resize: none;
          width: 100%;
          min-height: 148px;
          max-height: 280px;
          overflow-y: auto;
          caret-color: var(--orange);
        }
        .prompt-area::placeholder { color: #2e3d5c; }

        .prompt-wrap {
          border: 1px solid var(--border);
          border-radius: 14px;
          background: var(--surface);
          padding: 18px;
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .prompt-wrap:focus-within {
          border-color: var(--orange-border);
          box-shadow: 0 0 0 3px var(--orange-glow), 0 4px 24px rgba(255,107,43,0.08);
        }

        /* ── GENERATE BUTTON ── */
        .gen-btn {
          width: 100%; border: none; border-radius: 12px;
          font-family: var(--display); font-weight: 700; font-size: 1.08rem;
          padding: 16px 20px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.22s;
          position: relative; overflow: hidden;
        }
        .gen-btn.ready {
          background: linear-gradient(135deg, #ff6b2b 0%, #e8450a 100%);
          color: #fff;
          box-shadow: 0 4px 24px rgba(255,107,43,0.45), 0 1px 0 rgba(255,255,255,0.12) inset;
        }
        .gen-btn.ready::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .gen-btn.ready:hover { box-shadow: 0 6px 36px rgba(255,107,43,0.6); transform: translateY(-1px); }
        .gen-btn.ready:hover::after { opacity: 1; animation: shimmer 1.2s linear infinite; }
        .gen-btn.ready:active { transform: translateY(0); }
        .gen-btn.disabled {
          background: var(--surface2);
          color: #2e3d5c;
          cursor: not-allowed;
        }

        /* ── EXAMPLE CHIPS ── */
        .ex-chip {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px; padding: 13px 16px;
          text-align: left; cursor: pointer;
          transition: all 0.18s; width: 100%;
          display: flex; align-items: flex-start; gap: 10px;
        }
        .ex-chip:hover {
          border-color: var(--orange-border);
          background: var(--surface2);
          box-shadow: 0 2px 16px var(--orange-glow);
        }
        .ex-chip.active {
          border-color: var(--orange-border);
          background: var(--orange-dim);
          box-shadow: 0 2px 16px var(--orange-glow);
        }
        .ex-chip:hover .chip-arrow, .ex-chip.active .chip-arrow { color: var(--orange-lt); }

        .chip-arrow { color: var(--orange); font-size: 1.1rem; flex-shrink: 0; line-height: 1.5; }
        .chip-text  { font-family: var(--body); font-size: 0.9rem; color: var(--text-dim); line-height: 1.55; font-weight: 500; }
        .ex-chip.active .chip-text { color: #e0e8ff; }

        /* ── NAV ── */
        .nav-btn {
          border-radius: 8px; padding: 7px 18px;
          font-family: var(--body); font-weight: 600; font-size: 0.95rem;
          cursor: pointer; transition: all 0.15s; border: 1px solid transparent;
        }
        .nav-btn.active  { background: var(--surface2); border-color: var(--border-hi); color: #f0f2f8; }
        .nav-btn.passive { background: transparent; color: var(--muted); }
        .nav-btn.passive:hover { color: var(--text-dim); }

        /* ── SECTION LABEL ── */
        .sec-label {
          font-family: var(--mono); font-size: 0.72rem; font-weight: 500;
          letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted);
        }

        /* ── TIP ROW ── */
        .tip-row {
          font-family: var(--body); font-size: 0.9rem; font-weight: 500;
          color: var(--text-dim); line-height: 1.55;
          padding-left: 14px;
          border-left: 2px solid var(--border-hi);
        }

        /* ── GRID BG ── */
        .grid-bg {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(79,158,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79,158,255,0.04) 1px, transparent 1px);
          background-size: 52px 52px;
        }

        /* ── STATUS DOT ── */
        .sdot {
          width: 9px; height: 9px; border-radius: 50%;
          display: inline-block; flex-shrink: 0;
        }

        /* ── PREVIEW EMPTY ── */
        .empty-icon {
          animation: float 3.5s ease-in-out infinite;
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--bg)" }}>

        {/* ══ TOP BAR ══════════════════════════════ */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: "60px", padding: "0 28px", flexShrink: 0,
          borderBottom: "1px solid var(--border)",
          background: "rgba(8,12,20,0.97)", backdropFilter: "blur(14px)", zIndex: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span className="logo-text">BuildForge</span>
              <span className="logo-ai">AI</span>
            </div>
            <nav style={{ display: "flex", gap: "4px" }}>
              {(["Builder", "Templates", "Docs"] as const).map((item, i) => (
                <button key={item} className={`nav-btn ${i === 0 ? "active" : "passive"}`}>{item}</button>
              ))}
            </nav>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            {status !== "idle" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--mono)", fontSize: "0.82rem", color: "var(--muted)" }}>
                <span className="sdot" style={{
                  background: isGenerating ? "var(--orange)" : status === "done" ? "var(--green)" : status === "error" ? "#ff4d6a" : "#444",
                  boxShadow: isGenerating ? "0 0 12px var(--orange)" : status === "done" ? "0 0 10px var(--green)" : "none",
                  animation: isGenerating ? "blink 1s ease-in-out infinite" : "none",
                }} />
                <span style={{ color: isGenerating ? "var(--orange-lt)" : status === "done" ? "var(--green)" : status === "error" ? "#ff4d6a" : "var(--muted)" }}>
                  {status === "connecting" && "Connecting…"}
                  {status === "streaming" && "Generating…"}
                  {status === "done" && "Complete ✓"}
                  {status === "error" && "Error"}
                </span>
              </div>
            )}
            <div style={{
              width: "37px", height: "37px", borderRadius: "50%",
              background: "linear-gradient(135deg,#ff6b2b,#c93500)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--display)", fontWeight: 800, fontSize: "1rem", color: "#fff",
              cursor: "pointer", boxShadow: "0 2px 14px rgba(255,107,43,0.4)",
            }}>B</div>
          </div>
        </header>

        {/* ══ BODY ══════════════════════════════════ */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ══ LEFT PANEL ═════════════════════════ */}
          <aside style={{
            width: "430px", minWidth: "390px",
            display: "flex", flexDirection: "column",
            background: "var(--panel)", borderRight: "1px solid var(--border)",
            overflow: "hidden",
          }}>

            {/* Panel header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 24px 14px", borderBottom: "1px solid var(--border)",
            }}>
              <span className="sec-label">✦ Prompt</span>
              <kbd style={{
                fontFamily: "var(--mono)", fontSize: "0.78rem",
                background: "var(--surface2)", border: "1px solid var(--border-hi)",
                borderRadius: "6px", padding: "4px 10px", color: "var(--muted)",
              }}>⌘ Enter</kbd>
            </div>

            {/* Scroll body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "22px", display: "flex", flexDirection: "column", gap: "18px" }}>

              {/* Textarea */}
              <div className="prompt-wrap">
                <textarea
                  ref={textareaRef}
                  className="prompt-area"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isGenerating}
                  placeholder={"Describe the website you want to build…\n\ne.g. A SaaS landing page for a project management tool with dark theme, animated hero, and pricing section"}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "0.75rem", color: "var(--muted)" }}>
                    {prompt.length > 0 ? `${prompt.length} chars` : "Start typing…"}
                  </span>
                  {prompt.length > 0 && (
                    <button onClick={() => setPrompt("")} disabled={isGenerating} style={{ background: "none", border: "none", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: "0.75rem", cursor: "pointer" }}>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Generate button */}
              <button
                className={`gen-btn ${isGenerating || !prompt.trim() ? "disabled" : "ready"}`}
                onClick={connectAndGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <span style={{ width: "20px", height: "20px", border: "2.5px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.75s linear infinite", flexShrink: 0 }} />
                    {status === "connecting" ? "Connecting…" : "Forging Website…"}
                  </>
                ) : (
                  <>
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Generate Website
                  </>
                )}
              </button>

              {/* Error */}
              {status === "error" && errorMsg && (
                <div style={{
                  background: "rgba(255,77,106,0.08)", border: "1px solid rgba(255,77,106,0.3)",
                  borderRadius: "12px", padding: "16px 18px",
                  fontFamily: "var(--body)", fontSize: "0.925rem", color: "#ff8099", lineHeight: "1.6",
                }}>
                  <div style={{ fontWeight: 700, marginBottom: "5px", color: "#ff4d6a" }}>⚠ Connection Error</div>
                  {errorMsg}
                </div>
              )}

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                <span style={{ fontFamily: "var(--mono)", fontSize: "0.72rem", letterSpacing: "0.12em", color: "var(--muted)" }}>EXAMPLES</span>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              </div>

              {/* Examples */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button key={i} className={`ex-chip ${activeExample === i ? "active" : ""}`} onClick={() => { setPrompt(ex); setActiveExample(i); }} disabled={isGenerating}>
                    <span className="chip-arrow">→</span>
                    <span className="chip-text">{ex}</span>
                  </button>
                ))}
              </div>

              {/* Tips */}
              <div style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "12px", padding: "18px",
              }}>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: "0.72rem", fontWeight: 500,
                  letterSpacing: "0.12em", color: "var(--blue)", marginBottom: "14px",
                }}>✦ TIPS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    "Be specific about colors, theme, and visual style",
                    "Mention sections: hero, features, pricing, footer",
                    "Include your target audience and desired tone",
                  ].map((tip, i) => <div key={i} className="tip-row">{tip}</div>)}
                </div>
              </div>

            </div>
          </aside>

          {/* ══ RIGHT PANEL ════════════════════════ */}
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#070b12", position: "relative" }}>
            <div className="grid-bg" />

            {/* Preview bar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 26px", borderBottom: "1px solid var(--border)",
              background: "rgba(8,12,20,0.96)", flexShrink: 0, zIndex: 5,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span className="sec-label">◈ Preview</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["#ff5f57", "#ffbd2e", "#28ca41"].map(c => (
                    <div key={c} style={{ width: "11px", height: "11px", borderRadius: "50%", background: c, opacity: 0.75 }} />
                  ))}
                </div>
              </div>

              <div style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "8px", padding: "8px 24px",
                fontFamily: "var(--mono)", fontSize: "0.82rem",
                color: status === "idle" ? "#2e3d5c" : "var(--text-dim)",
                minWidth: "300px", textAlign: "center",
              }}>
                {status === "idle" ? "about:blank" : "buildforge://preview"}
              </div>

              {previewHtml ? (
                <button
                  onClick={() => {
                    const blob = new Blob([previewHtml], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = "buildforge-output.html"; a.click();
                  }}
                  style={{
                    background: "var(--surface2)", border: "1px solid var(--border-hi)",
                    borderRadius: "8px", padding: "8px 18px",
                    color: "var(--text-dim)", cursor: "pointer",
                    fontFamily: "var(--body)", fontWeight: 600, fontSize: "0.9rem",
                    display: "flex", alignItems: "center", gap: "7px",
                    transition: "all 0.15s", boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "var(--border-hi)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.5)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.borderColor = "var(--border-hi)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)"; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Export HTML
                </button>
              ) : <div style={{ width: "130px" }} />}
            </div>

            {/* Content */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

              {/* EMPTY STATE */}
              {!previewHtml && status === "idle" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "20px", animation: "fadeUp 0.6s ease both", position: "relative", zIndex: 2 }}>
                  {/* Glow orb */}
                  <div style={{ position: "relative", marginBottom: "4px" }}>
                    <div style={{
                      position: "absolute", inset: "-20px",
                      background: "radial-gradient(circle, rgba(255,107,43,0.18) 0%, transparent 70%)",
                      borderRadius: "50%",
                    }} />
                    <div className="empty-icon" style={{
                      width: "90px", height: "90px", borderRadius: "24px",
                      background: "linear-gradient(135deg, rgba(255,107,43,0.18) 0%, rgba(79,158,255,0.1) 100%)",
                      border: "1px solid rgba(255,107,43,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 0 40px rgba(255,107,43,0.15)",
                      position: "relative",
                    }}>
                      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="1.4">
                        <defs>
                          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#ff6b2b" />
                            <stop offset="100%" stopColor="#4f9eff" />
                          </linearGradient>
                        </defs>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  </div>

                  <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "1.65rem", color: "#f0f2f8", letterSpacing: "-0.04em", textAlign: "center" }}>
                    Your site will appear here
                  </div>
                  <div style={{ fontFamily: "var(--body)", fontSize: "1rem", fontWeight: 500, color: "var(--muted)", textAlign: "center", maxWidth: "360px", lineHeight: 1.7 }}>
                    Describe what you want to build on the left,<br />then hit <span style={{ color: "var(--orange-lt)", fontWeight: 600 }}>Generate</span> to watch it come to life.
                  </div>

                  {/* Feature pills */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                    {["⚡ Instant preview", "🎨 Custom styling", "📦 Export HTML"].map(f => (
                      <span key={f} style={{
                        fontFamily: "var(--body)", fontSize: "0.85rem", fontWeight: 600,
                        color: "var(--text-dim)",
                        background: "var(--surface)", border: "1px solid var(--border-hi)",
                        borderRadius: "100px", padding: "6px 14px",
                      }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* LOADING STATE */}
              {!previewHtml && isGenerating && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "18px", position: "relative", zIndex: 2 }}>
                  <div style={{ position: "relative", width: "72px", height: "72px" }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "radial-gradient(circle, rgba(255,107,43,0.25) 0%, transparent 70%)",
                      borderRadius: "50%", animation: "blink 1.5s ease-in-out infinite",
                    }} />
                    <div style={{
                      width: "72px", height: "72px", borderRadius: "50%",
                      border: "3px solid var(--border)", borderTopColor: "var(--orange)",
                      animation: "spin 0.85s linear infinite",
                    }} />
                  </div>
                  <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "1.35rem", color: "#f0f2f8", letterSpacing: "-0.02em" }}>Forging your website…</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "0.88rem", color: "var(--muted)" }}>This usually takes 10–30 seconds</div>
                </div>
              )}

              {/* IFRAME */}
              {previewHtml && (
                <div style={{ position: "absolute", inset: 0 }}>
                  <iframe
                    ref={iframeRef}
                    title="BuildForge Preview"
                    sandbox="allow-scripts allow-same-origin"
                    style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
                  />
                  {isGenerating && (
                    <div style={{
                      position: "absolute", bottom: "20px", right: "20px",
                      background: "rgba(8,12,20,0.94)", border: "1px solid var(--border-hi)",
                      borderRadius: "10px", padding: "10px 18px",
                      fontFamily: "var(--mono)", fontSize: "0.85rem", color: "var(--text-dim)",
                      backdropFilter: "blur(10px)",
                      display: "flex", alignItems: "center", gap: "9px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                    }}>
                      <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "var(--orange)", boxShadow: "0 0 12px var(--orange)", animation: "blink 1s ease-in-out infinite", flexShrink: 0 }} />
                      Streaming HTML…
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
