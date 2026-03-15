import { useState, useEffect } from "react";

const MOODS = [
  { score: 5, emoji: "◎", label: "最高", color: "#a8d8a8" },
  { score: 4, emoji: "○", label: "良い", color: "#b8d4e8" },
  { score: 3, emoji: "△", label: "普通", color: "#d4c8b8" },
  { score: 2, emoji: "▽", label: "微妙", color: "#e8c8a8" },
  { score: 1, emoji: "×", label: "辛い", color: "#e8a8a8" },
];

const STORAGE_KEY = "diary_v1";

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function save(entries) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch {}
}

async function callClaude(prompt) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(errText || "AI request failed");
  }
  const d = await res.json();
  return d.content?.[0]?.text || "";
}

async function analyzeEntry(text) {
  const raw = await callClaude(
    `以下の日記テキストを分析してください。JSONのみ返してください（コードブロック不要）。
形式: {"feeling":"一言で感情","comment":"共感コメント40字以内","tags":["タグ1","タグ2","タグ3"]}

日記: ${text}`
  );
  return JSON.parse(raw.replace(/```[a-z]*|```/g, "").trim());
}

async function proofreadJapanese(text) {
  return await callClaude(
    `以下の日記文章を、意味を変えずに自然で読みやすい日本語に校正してください。
修正した文章のみを返してください（説明や前置きは不要です）。

文章:
${text}`
  );
}

async function translateToEnglish(text) {
  return await callClaude(
    `以下の日記文章を自然な英語に翻訳してください。
日記らしいカジュアルで自然な文体にしてください。
翻訳文のみを返してください（説明や前置きは不要です）。

文章:
${text}`
  );
}

function fmt(iso) {
  const d = new Date(iso);
  const days = "日月火水木金土";
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")} ${days[d.getDay()]}`;
}

const S = {
  app: {
    minHeight: "100vh",
    background: "#0e0e0e",
    color: "#d4cfc8",
    fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
    fontSize: "14px",
    lineHeight: 1.8,
  },
  header: {
    borderBottom: "1px solid #222",
    padding: "20px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    background: "#0e0e0e",
    zIndex: 10,
  },
  logo: {
    fontSize: "13px",
    letterSpacing: "0.3em",
    color: "#666",
    textTransform: "uppercase",
    fontWeight: 300,
    cursor: "pointer",
  },
  btn: (active) => ({
    background: "none",
    border: `1px solid ${active ? "#d4cfc8" : "#333"}`,
    color: active ? "#d4cfc8" : "#555",
    padding: "6px 16px",
    borderRadius: "2px",
    fontSize: "12px",
    cursor: "pointer",
    letterSpacing: "0.1em",
    fontFamily: "inherit",
    transition: "all 0.15s",
  }),
  btnPrimary: {
    background: "#d4cfc8",
    border: "1px solid #d4cfc8",
    color: "#0e0e0e",
    padding: "8px 24px",
    borderRadius: "2px",
    fontSize: "13px",
    cursor: "pointer",
    letterSpacing: "0.1em",
    fontFamily: "inherit",
    fontWeight: 500,
  },
  btnAI: (loading) => ({
    background: "none",
    border: "1px solid #2a2a2a",
    color: loading ? "#333" : "#666",
    padding: "6px 14px",
    borderRadius: "2px",
    fontSize: "11px",
    cursor: loading ? "default" : "pointer",
    letterSpacing: "0.1em",
    fontFamily: "inherit",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  }),
  wrap: {
    maxWidth: "680px",
    margin: "0 auto",
    padding: "40px 24px",
  },
  card: {
    borderBottom: "1px solid #1a1a1a",
    padding: "24px 0",
    cursor: "pointer",
  },
  input: {
    background: "none",
    border: "none",
    borderBottom: "1px solid #333",
    color: "#d4cfc8",
    fontSize: "22px",
    fontFamily: "inherit",
    width: "100%",
    outline: "none",
    padding: "8px 0",
    letterSpacing: "0.02em",
    marginBottom: "32px",
  },
  textarea: {
    background: "none",
    border: "none",
    color: "#c8c3bc",
    fontSize: "14px",
    fontFamily: "inherit",
    width: "100%",
    outline: "none",
    resize: "none",
    lineHeight: 2,
    minHeight: "240px",
    letterSpacing: "0.03em",
  },
  tag: (active) => ({
    display: "inline-block",
    padding: "2px 10px",
    border: `1px solid ${active ? "#888" : "#2a2a2a"}`,
    borderRadius: "2px",
    fontSize: "11px",
    color: active ? "#bbb" : "#555",
    cursor: "pointer",
    marginRight: "6px",
    marginBottom: "6px",
    letterSpacing: "0.05em",
    background: "none",
    fontFamily: "inherit",
    transition: "all 0.15s",
  }),
  moodBtn: (m, selected) => ({
    background: "none",
    border: `1px solid ${selected ? m.color : "#222"}`,
    color: selected ? m.color : "#444",
    padding: "8px 14px",
    borderRadius: "2px",
    fontSize: "18px",
    cursor: "pointer",
    transition: "all 0.15s",
    lineHeight: 1,
  }),
  aiBox: {
    marginTop: "24px",
    padding: "20px",
    border: "1px solid #1e1e1e",
    borderRadius: "2px",
    background: "#111",
  },
  proofBox: {
    marginTop: "12px",
    padding: "16px 20px",
    border: "1px solid #1e2a1e",
    borderRadius: "2px",
    background: "#0d130d",
    color: "#8ab88a",
    fontSize: "13px",
    lineHeight: 2,
    whiteSpace: "pre-wrap",
    letterSpacing: "0.03em",
  },
  enBox: {
    marginTop: "12px",
    padding: "16px 20px",
    border: "1px solid #1a1e2a",
    borderRadius: "2px",
    background: "#0d0f14",
    color: "#8a9ab8",
    fontSize: "13px",
    lineHeight: 2,
    whiteSpace: "pre-wrap",
    letterSpacing: "0.03em",
    fontFamily: "Georgia, serif",
  },
  searchInput: {
    background: "none",
    border: "none",
    borderBottom: "1px solid #222",
    color: "#888",
    fontSize: "13px",
    fontFamily: "inherit",
    padding: "6px 0",
    outline: "none",
    width: "100%",
    letterSpacing: "0.05em",
  },
  sectionLabel: (color) => ({
    fontSize: "10px",
    color: color || "#444",
    letterSpacing: "0.3em",
    marginTop: "24px",
    marginBottom: "4px",
  }),
  applyBtn: {
    background: "none",
    border: "1px solid #2a3a2a",
    color: "#6a8a6a",
    padding: "5px 14px",
    borderRadius: "2px",
    fontSize: "11px",
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.1em",
    marginTop: "10px",
  },
  divider: {
    borderTop: "1px solid #1a1a1a",
    margin: "32px 0",
  },
};

function Spinner() {
  return (
    <span style={{
      display: "inline-block",
      width: "10px",
      height: "10px",
      border: "1px solid #333",
      borderTop: "1px solid #888",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
  );
}

export default function App() {
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", mood: null, tagInput: "" });
  const [analyzing, setAnalyzing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiErr, setAiErr] = useState("");
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterMood, setFilterMood] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofResult, setProofResult] = useState("");
  const [transLoading, setTransLoading] = useState(false);
  const [transResult, setTransResult] = useState("");

  useEffect(() => { setEntries(load()); }, []);
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const allTags = [...new Set(entries.flatMap(e => e.tags || []))];
  const filtered = entries
    .filter(e => {
      const q = search.toLowerCase();
      return (
        (!q || (e.title + e.body).toLowerCase().includes(q)) &&
        (!filterTag || (e.tags || []).includes(filterTag)) &&
        (filterMood === null || e.mood === filterMood)
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  function startWrite() {
    setForm({ title: "", body: "", mood: null, tagInput: "" });
    setAiData(null); setAiErr("");
    setProofResult(""); setTransResult("");
    setView("write");
  }

  async function handleProofread() {
    if (!form.body.trim() || proofLoading) return;
    setProofLoading(true); setProofResult("");
    try { setProofResult(await proofreadJapanese(form.body)); }
    catch { setProofResult("校正に失敗しました。"); }
    setProofLoading(false);
  }

  async function handleTranslate() {
    if (!form.body.trim() || transLoading) return;
    setTransLoading(true); setTransResult("");
    try { setTransResult(await translateToEnglish(form.body)); }
    catch { setTransResult("翻訳に失敗しました。"); }
    setTransLoading(false);
  }

  function applyProofread() {
    if (proofResult) { setForm(f => ({ ...f, body: proofResult })); setProofResult(""); }
  }

  async function handleSave() {
    if (!form.body.trim()) return;
    setAnalyzing(true); setAiErr("");
    let analysis = null;
    try { analysis = await analyzeEntry(form.body); }
    catch { setAiErr("AI分析に失敗しました"); }
    setAnalyzing(false);

    const manualTags = form.tagInput.split(/[,、\s]+/).map(t => t.trim()).filter(Boolean);
    const tags = [...new Set([...manualTags, ...(analysis?.tags || [])])];
    const entry = {
      id: String(Date.now()),
      date: new Date().toISOString(),
      title: form.title || "無題",
      body: form.body,
      mood: form.mood,
      tags,
      analysis,
    };
    const next = [entry, ...entries];
    setEntries(next); save(next);
    setAiData(analysis); setSelected(entry); setView("detail");
  }

  function handleDelete(id) {
    const next = entries.filter(e => e.id !== id);
    setEntries(next); save(next); setView("list");
  }

  const mood = (score) => MOODS.find(m => m.score === score);
  const hasBody = form.body.trim().length > 0;

  return (
    <div style={S.app}>
      <header style={S.header}>
        <span style={S.logo} onClick={() => setView("list")}>diary</span>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#444", letterSpacing: "0.1em" }}>{entries.length} entries</span>
          {view !== "write" && <button style={S.btnPrimary} onClick={startWrite}>+ 書く</button>}
        </div>
      </header>

      <div style={S.wrap}>

        {/* ── LIST ── */}
        {view === "list" && (
          <>
            <div style={{ marginBottom: "32px" }}>
              <input style={S.searchInput} placeholder="検索..." value={search} onChange={e => setSearch(e.target.value)} />
              {entries.length > 0 && (
                <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
                  {MOODS.map(m => {
                    const cnt = entries.filter(e => e.mood === m.score).length;
                    if (!cnt) return null;
                    return (
                      <button key={m.score} onClick={() => setFilterMood(filterMood === m.score ? null : m.score)}
                        style={{ ...S.moodBtn(m, filterMood === m.score), fontSize: "13px", padding: "4px 12px" }}>
                        {m.emoji} <span style={{ fontSize: "11px", marginLeft: "4px", color: "#555" }}>{cnt}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {allTags.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  {allTags.map(t => (
                    <button key={t} style={S.tag(filterTag === t)} onClick={() => setFilterTag(filterTag === t ? "" : t)}>{t}</button>
                  ))}
                </div>
              )}
            </div>

            {filtered.length === 0 && (
              <div style={{ color: "#333", textAlign: "center", paddingTop: "80px", letterSpacing: "0.1em" }}>
                {entries.length === 0 ? "まだ何も書かれていません" : "該当する記録がありません"}
              </div>
            )}
            {filtered.map(e => (
              <div key={e.id} style={S.card} onClick={() => { setSelected(e); setAiData(e.analysis); setView("detail"); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#444", letterSpacing: "0.15em", marginRight: "12px" }}>{fmt(e.date)}</span>
                    {e.mood && <span style={{ color: mood(e.mood)?.color, fontSize: "15px" }}>{mood(e.mood)?.emoji}</span>}
                  </div>
                  {e.analysis?.feeling && <span style={{ fontSize: "11px", color: "#555", fontStyle: "italic" }}>{e.analysis.feeling}</span>}
                </div>
                <div style={{ fontSize: "16px", color: "#ccc", marginBottom: "8px", fontWeight: 400 }}>{e.title}</div>
                <div style={{ color: "#555", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.body}</div>
                {(e.tags || []).length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    {e.tags.map(t => <span key={t} style={{ ...S.tag(false), cursor: "default" }}>{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── WRITE ── */}
        {view === "write" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
              <span style={{ fontSize: "11px", color: "#444", letterSpacing: "0.2em" }}>{fmt(new Date().toISOString())}</span>
              <button style={S.btn(false)} onClick={() => setView("list")}>キャンセル</button>
            </div>

            <input style={S.input} placeholder="タイトル" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

            <textarea style={S.textarea} placeholder="今日はどんな一日でしたか..."
              value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} autoFocus />

            {/* ── AI TOOLS ── */}
            {hasBody && (
              <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
                <button style={S.btnAI(proofLoading)} onClick={handleProofread} disabled={proofLoading}>
                  {proofLoading ? <Spinner /> : "✦"} 日本語を校正する
                </button>
                <button style={S.btnAI(transLoading)} onClick={handleTranslate} disabled={transLoading}>
                  {transLoading ? <Spinner /> : "✦"} 英語に翻訳する
                </button>
              </div>
            )}

            {/* Proofread result */}
            {proofResult && (
              <div>
                <div style={S.sectionLabel("#4a6a4a")}>PROOFREAD — 校正結果</div>
                <div style={S.proofBox}>{proofResult}</div>
                <button style={S.applyBtn} onClick={applyProofread}>↑ この文章を本文に反映する</button>
              </div>
            )}

            {/* Translation result */}
            {transResult && (
              <div>
                <div style={S.sectionLabel("#4a5a6a")}>TRANSLATION — 英語訳</div>
                <div style={S.enBox}>{transResult}</div>
              </div>
            )}

            <div style={S.divider} />

            {/* Mood */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", color: "#444", letterSpacing: "0.2em", marginBottom: "12px" }}>MOOD</div>
              <div style={{ display: "flex", gap: "8px" }}>
                {MOODS.map(m => (
                  <button key={m.score} style={S.moodBtn(m, form.mood === m.score)}
                    onClick={() => setForm(f => ({ ...f, mood: f.mood === m.score ? null : m.score }))}
                    title={m.label}>{m.emoji}</button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: "40px" }}>
              <div style={{ fontSize: "11px", color: "#444", letterSpacing: "0.2em", marginBottom: "8px" }}>TAGS</div>
              <input style={{ ...S.searchInput, fontSize: "13px" }} placeholder="タグ（カンマ区切り）"
                value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))} />
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button style={{ ...S.btnPrimary, opacity: !hasBody || analyzing ? 0.4 : 1 }}
                onClick={handleSave} disabled={!hasBody || analyzing}>
                {analyzing ? "AI分析中..." : "保存する"}
              </button>
              {analyzing && <span style={{ fontSize: "11px", color: "#444" }}>感情を分析しています...</span>}
            </div>
            {aiErr && <div style={{ marginTop: "12px", fontSize: "12px", color: "#e8a8a8" }}>{aiErr}</div>}
          </div>
        )}

        {/* ── DETAIL ── */}
        {view === "detail" && selected && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
              <button style={S.btn(false)} onClick={() => setView("list")}>← 一覧</button>
              <button style={{ ...S.btn(false), color: "#e8a8a8", borderColor: "#2a1a1a" }}
                onClick={() => { if (window.confirm("削除しますか？")) handleDelete(selected.id); }}>削除</button>
            </div>

            <div style={{ fontSize: "11px", color: "#444", letterSpacing: "0.2em", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              {fmt(selected.date)}
              {selected.mood && <span style={{ color: mood(selected.mood)?.color }}>{mood(selected.mood)?.emoji} {mood(selected.mood)?.label}</span>}
            </div>

            <h1 style={{ fontSize: "22px", fontWeight: 400, color: "#ccc", marginBottom: "32px", letterSpacing: "0.02em" }}>
              {selected.title}
            </h1>

            <div style={{ color: "#a8a398", lineHeight: 2.1, whiteSpace: "pre-wrap", letterSpacing: "0.03em" }}>
              {selected.body}
            </div>

            {(selected.tags || []).length > 0 && (
              <div style={{ marginTop: "32px" }}>
                {selected.tags.map(t => <span key={t} style={{ ...S.tag(false), cursor: "default" }}>{t}</span>)}
              </div>
            )}

            {(aiData || selected.analysis) && (
              <div style={S.aiBox}>
                <div style={{ fontSize: "10px", color: "#444", letterSpacing: "0.3em", marginBottom: "16px" }}>AI ANALYSIS</div>
                {(aiData || selected.analysis).feeling && (
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", color: "#555", marginRight: "8px" }}>感情</span>
                    <span style={{ color: "#bbb", fontStyle: "italic" }}>{(aiData || selected.analysis).feeling}</span>
                  </div>
                )}
                {(aiData || selected.analysis).comment && (
                  <div style={{ color: "#888", fontSize: "13px", lineHeight: 1.9, borderLeft: "2px solid #222", paddingLeft: "14px" }}>
                    {(aiData || selected.analysis).comment}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
