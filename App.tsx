import React, { useEffect, useState, useRef } from "react";

type Quote = { id: string; text: string; category: string };

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function injectStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById("quotegen-styles")) return;
  const css = `:root{--bg:#f6f8fb;--card:#ffffff;--muted:#6b7280;--accent:#0ea5a4}
*{box-sizing:border-box}
body{margin:0;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;background:var(--bg);color:#0f172a}
.app-root{max-width:1100px;margin:18px auto;padding:16px}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.brand h1{margin:0;font-size:20px}
.container{display:flex;gap:18px}
.left{flex:1;min-width:320px}
.right{width:420px}
.card{background:var(--card);border-radius:12px;padding:14px;box-shadow:0 6px 22px rgba(16,24,40,0.06);margin-bottom:14px}
.controls .row{display:flex;gap:8px;align-items:center}
.input,textarea,select{padding:10px;border-radius:10px;border:1px solid #e6e9f2;background:transparent}
textarea{min-height:80px}
.btn{padding:8px 12px;border-radius:10px;border:0;background:#111827;color:white;cursor:pointer;font-weight:600}
.btn.ghost{background:transparent;color:#111827;border:1px solid #e6e9f2}
.btn.primary{background:var(--accent)}
.quotes-list .quote-item{padding:10px;border-radius:10px;border:1px solid #f1f3f8;margin-bottom:8px}
.quote-item.active{border-color:rgba(14,165,164,0.15);box-shadow:0 6px 12px rgba(14,165,164,0.06)}
.qtext{font-size:14px}
.meta{display:flex;justify-content:space-between;align-items:center}
.cat{font-size:12px;color:var(--muted)}
.meta-actions .icon{border:0;background:transparent;cursor:pointer;margin-left:6px;font-size:16px}
.meta-actions .danger{color:#ef4444}
.preview .quote-card{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:28px;border-radius:12px;background:linear-gradient(135deg,#fff,#f7fbff);width:100%}
.preview .quote-text{font-size:20px;font-weight:700;line-height:1.25}
.preview .quote-cat{color:var(--muted);font-size:13px}
.muted{color:var(--muted);padding:12px}
.footer{text-align:center;color:var(--muted);margin-top:12px;font-size:13px}
@media(max-width:900px){.container{flex-direction:column}.right{width:100%}.app-root{padding:12px}}`;
  const style = document.createElement("style");
  style.id = "quotegen-styles";
  style.innerHTML = css;
  document.head.appendChild(style);
}

export default function App(): JSX.Element {
  // inject CSS so there's no external styles.css dependency
  useEffect(() => {
    injectStyles();
  }, []);

  const DEFAULT_QUOTES: Quote[] = [
    {
      id: uid(),
      text: "Hidup adalah perjalanan, bukan tujuan.",
      category: "motivasi",
    },
    {
      id: uid(),
      text: "Cinta adalah bahasa yang semua orang mengerti.",
      category: "cinta",
    },
    {
      id: uid(),
      text: "Barangsiapa bertakwa kepada Allah, niscaya Dia akan memberi jalan keluar.",
      category: "islami",
    },
  ];

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      const raw = localStorage.getItem("quotes_db_v2");
      if (raw) return JSON.parse(raw) as Quote[];
    } catch (e) {}
    return DEFAULT_QUOTES;
  });

  useEffect(() => {
    localStorage.setItem("quotes_db_v2", JSON.stringify(quotes));
  }, [quotes]);

  const [current, setCurrent] = useState<Quote | null>(quotes[0] ?? null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [premium, setPremium] = useState(
    () => localStorage.getItem("quotegen_premium") === "1"
  );

  useEffect(() => {
    if (!current && quotes.length) setCurrent(quotes[0]);
  }, [quotes, current]);

  function addQuote(text: string, category: string) {
    const t = text.trim();
    if (!t) return;
    const q: Quote = {
      id: uid(),
      text: t,
      category: category.trim() || "lainnya",
    };
    setQuotes((s) => [q, ...s]);
    setCurrent(q);
  }

  function removeQuote(id: string) {
    if (!confirm("Hapus quote ini?")) return;
    setQuotes((s) => s.filter((q) => q.id !== id));
    if (current?.id === id) setCurrent(quotes[0] ?? null);
  }

  function getRandom() {
    const list = filteredQuotes();
    if (list.length === 0) return;
    setCurrent(list[Math.floor(Math.random() * list.length)]);
  }

  function filteredQuotes(): Quote[] {
    return quotes.filter((q) => {
      const matchCategory =
        categoryFilter === "all" || q.category === categoryFilter;
      const matchSearch = q.text.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }

  // generate image (1080x1080) and return dataURL
  function generateImageDataURL(
    q: Quote,
    options: { noWatermark?: boolean; size?: number } = {}
  ) {
    const size = options.size ?? 1080;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // background gradient
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, "#fdf2f8");
    g.addColorStop(1, "#eef2ff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // decorative circles
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.globalAlpha = 0.06;
      const r = Math.floor(size * (0.08 + Math.random() * 0.12));
      ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // text
    let fontSize = Math.floor(size / 18);
    ctx.fillStyle = "#0f172a";
    ctx.textBaseline = "top";

    const maxWidth = size - 140;
    const words = q.text.split(" ");
    const lines: string[] = [];
    let line = "";
    ctx.font = `700 ${fontSize}px sans-serif`;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      if (ctx.measureText(testLine).width > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    if (line.trim()) lines.push(line.trim());

    while (lines.length * (fontSize * 1.15) > size * 0.6 && fontSize > 18) {
      fontSize = Math.max(18, Math.floor(fontSize * 0.9));
      ctx.font = `700 ${fontSize}px sans-serif`;
    }

    const lineHeight = Math.floor(fontSize * 1.2);
    const totalHeight = lines.length * lineHeight;
    let startY = Math.floor(size / 2 - totalHeight / 2);
    const startX = 70;
    ctx.fillStyle = "#0f172a";
    ctx.font = `700 ${fontSize}px sans-serif`;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], startX, startY + i * lineHeight, maxWidth);
    }

    ctx.font = `500 ${Math.max(14, Math.floor(fontSize / 2))}px sans-serif`;
    ctx.fillStyle = "#475569";
    ctx.fillText(
      `#${q.category}`,
      startX,
      startY + lines.length * lineHeight + 18
    );

    if (!options.noWatermark) {
      ctx.font = `600 14px sans-serif`;
      ctx.fillStyle = "rgba(15,23,42,0.6)";
      ctx.textAlign = "right";
      ctx.fillText("QuoteGen • yoursite.com", size - 20, size - 28);
      ctx.textAlign = "left";
    }

    return canvas.toDataURL("image/png");
  }

  function downloadImage(q: Quote) {
    const data = generateImageDataURL(q, { noWatermark: premium });
    if (!data) return;
    const a = document.createElement("a");
    a.href = data;
    a.download = `quote-${q.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function buyPremium() {
    if (
      confirm(
        "Beli premium (demo)? Ini hanya simulasi untuk unlock on this browser."
      )
    ) {
      localStorage.setItem("quotegen_premium", "1");
      setPremium(true);
      alert(
        "Premium unlocked (simulasi). Download tanpa watermark aktif pada browser ini."
      );
    }
  }

  function exportQuotes() {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(quotes));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "quotes_export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function importQuotesFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(String(ev.target?.result));
        if (Array.isArray(imported)) {
          const norm: Quote[] = imported.map((q) => ({
            id: uid(),
            text: q.text || q.quote || "",
            category: q.category || "lainnya",
          }));
          setQuotes((s) => [...norm, ...s]);
          alert("Quotes imported!");
        } else alert("Format file tidak sesuai.");
      } catch (err) {
        alert("Gagal baca file: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.currentTarget.value = "";
  }

  const categories = [
    "all",
    ...Array.from(new Set(quotes.map((q) => q.category))),
  ];

  return (
    <div className="app-root">
      <header className="top">
        <div className="brand">
          <h1>✨ QuoteGen</h1>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            aesthetic quotes • siap posting
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost" onClick={() => setShowAdd((s) => !s)}>
            ✚ Tambah Quote
          </button>
          <button className="btn" onClick={exportQuotes}>
            ⤓ Export
          </button>
          <label
            className="btn ghost"
            style={{ position: "relative", overflow: "hidden" }}
          >
            ↴ Import
            <input
              type="file"
              accept=".json"
              onChange={importQuotesFile}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                opacity: 0,
                width: "100%",
                height: "100%",
                cursor: "pointer",
              }}
            />
          </label>
        </div>
      </header>

      <main className="container">
        <section className="left">
          {showAdd && (
            <div className="card add-form">
              <AddForm
                onAdd={(t, c) => {
                  addQuote(t, c);
                  setShowAdd(false);
                }}
                onCancel={() => setShowAdd(false)}
              />
            </div>
          )}

          <div className="card controls">
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                className="input"
                placeholder="Cari quotes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input"
                style={{ width: 160 }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button className="btn primary" onClick={getRandom}>
                🎲 Random
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                Hasil: <strong>{filteredQuotes().length}</strong>
              </div>
              <div>
                Premium: <strong>{premium ? "Unlocked" : "Locked"}</strong>
              </div>
            </div>
          </div>

          <div className="card quotes-list">
            {filteredQuotes().length === 0 && (
              <div className="muted">Tidak ada quotes</div>
            )}
            {filteredQuotes().map((q) => (
              <div
                key={q.id}
                className={`quote-item ${current?.id === q.id ? "active" : ""}`}
              >
                <div className="qtext">"{q.text}"</div>
                <div className="meta">
                  <span className="cat">#{q.category}</span>
                  <div className="meta-actions">
                    <button className="icon" onClick={() => setCurrent(q)}>
                      🔍
                    </button>
                    <button className="icon" onClick={() => downloadImage(q)}>
                      ⬇️
                    </button>
                    <button
                      className="icon danger"
                      onClick={() => removeQuote(q.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card small muted">
            <div>
              <strong>Monetisasi (placeholder)</strong>
            </div>
            <div
              style={{
                marginTop: 8,
                padding: 12,
                border: "1px dashed #e6e9f2",
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              AdSense Slot — letakkan skrip Google AdSense di index.html saat
              live
            </div>
            <div style={{ marginTop: 8 }}>
              <button className="btn ghost" onClick={buyPremium}>
                {premium ? "✅ Premium aktif" : "Beli Premium (Demo)"}
              </button>
            </div>
          </div>
        </section>

        <section className="right card preview">
          {current ? (
            <>
              <div className="quote-card">
                <p className="quote-text">"{current.text}"</p>
                <p className="quote-cat">#{current.category}</p>
              </div>

              <div
                className="preview-actions"
                style={{ marginTop: 12, display: "flex", gap: 8 }}
              >
                <button className="btn" onClick={() => downloadImage(current)}>
                  ⬇️ Download Image
                </button>
                <button
                  className="btn ghost"
                  onClick={() =>
                    navigator.clipboard?.writeText(
                      `"${current.text}" — #${current.category}`
                    )
                  }
                >
                  ↗️ Copy
                </button>
              </div>
            </>
          ) : (
            <div className="muted">Pilih quote untuk preview</div>
          )}
        </section>
      </main>

      <footer className="footer muted">
        © {new Date().getFullYear()} QuoteGen — demo
      </footer>
    </div>
  );
}

function AddForm({
  onAdd,
  onCancel,
}: {
  onAdd: (t: string, c: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) {
          onAdd(text.trim(), cat.trim());
          setText("");
          setCat("");
        }
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <textarea
          placeholder="Tulis quote..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          placeholder="Kategori (motivasi, islami, cinta)"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn primary" type="submit">
            Simpan
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Batal
          </button>
        </div>
      </div>
    </form>
  );
}
