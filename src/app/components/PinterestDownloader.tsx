import { useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { Download, Image as ImageIcon, Loader2, ExternalLink, Check, X as XIcon, Upload, FileSpreadsheet } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { HomepageNav } from "./shared/HomepageNav";
import { C, serif, sans } from "./homepage/v8/primitives";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

type PinImage = { id: string; url: string; alt?: string };
type Board = {
  inputUrl: string;
  status: "pending" | "fetching" | "ok" | "error";
  name?: string;
  url?: string;
  source?: string;
  images: PinImage[];
  error?: string;
};

const TARGET_LONG_EDGE = 2048;

// Try a direct browser fetch first (fast path, when Pinterest's CDN happens
// to serve a permissive ACAO header). On CORS / non-2xx failure, fall back
// to our same-origin proxy on the edge function.
async function fetchAsBlob(url: string): Promise<Blob> {
  try {
    const direct = await fetch(url, { mode: "cors", credentials: "omit" });
    if (direct.ok) return await direct.blob();
  } catch {
    // CORS or network — fall through to proxy.
  }
  const proxied = `${API}/pinterest-image-proxy?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxied, {
    headers: { Authorization: `Bearer ${publicAnonKey}` },
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  return await res.blob();
}

async function clampTo2048(blob: Blob): Promise<{ blob: Blob; ext: string }> {
  if (!/^image\/(jpeg|png|webp)$/i.test(blob.type || "")) {
    return { blob, ext: extFromMime(blob.type) };
  }
  const bitmap = await createImageBitmap(blob).catch(() => null);
  if (!bitmap) return { blob, ext: extFromMime(blob.type) };

  const { width, height } = bitmap;
  const longEdge = Math.max(width, height);
  if (longEdge <= TARGET_LONG_EDGE) {
    bitmap.close?.();
    return { blob, ext: extFromMime(blob.type) };
  }
  const scale = TARGET_LONG_EDGE / longEdge;
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) { bitmap.close?.(); return { blob, ext: extFromMime(blob.type) }; }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const out = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  return out ? { blob: out, ext: "jpg" } : { blob, ext: extFromMime(blob.type) };
}

function extFromMime(mime: string): string {
  if (!mime) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

function safeBoardSlug(name: string, fallback: string = "board"): string {
  const cleaned = (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return cleaned || fallback;
}

// Pull URLs out of any pasted/uploaded source. Returns boards (Pinterest
// page URLs we'll feed through the backend) and directImages (i.pinimg.com
// CDN URLs we can download in the browser without any API call). Excel
// columns from existing scrapes commonly contain the latter; users can
// also mix both.
function classifyPinterestUrls(rawText: string): { boards: string[]; directImages: string[] } {
  const re = /https?:\/\/[^\s,;'"<>()\]\[]+/gi;
  const boards: string[] = [];
  const directImages: string[] = [];
  const seenBoard = new Set<string>();
  const seenImg = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(rawText)) !== null) {
    const url = m[0].replace(/[.,;:)]+$/, "");
    let host = "";
    try { host = new URL(url).host.toLowerCase(); } catch { continue; }
    if (host.endsWith("pinimg.com")) {
      // Treat as a direct image only if the path actually looks like a pin
      // file (hash.{jpg|png|...}). Avatars and UI assets get filtered by
      // the same isPinImage check the backend uses.
      if (/[a-f0-9]{8,}\.(?:jpg|jpeg|png|gif|webp)$/i.test(url) && !/\/avatars\//i.test(url) && !seenImg.has(url)) {
        seenImg.add(url);
        directImages.push(url);
      }
    } else if (/(^|\.)pinterest\.[a-z.]+$|(^|\.)pin\.it$/i.test(host)) {
      if (!seenBoard.has(url)) {
        seenBoard.add(url);
        boards.push(url);
      }
    }
  }
  return { boards, directImages };
}

// Bump every i.pinimg.com URL up to its `originals/` size so we always
// pull the highest-quality copy. Pinterest serves the same image at many
// sizes via the size segment immediately after the host.
function upgradeToOriginals(url: string): string {
  try {
    const u = new URL(url);
    if (!u.host.endsWith("pinimg.com")) return url;
    u.pathname = u.pathname.replace(
      /^\/(originals|236x|474x|736x|2048x|orig|\d+x|\d+x\d+)\//,
      "/originals/",
    );
    return u.toString();
  } catch {
    return url;
  }
}

export function PinterestDownloader() {
  const [singleUrl, setSingleUrl] = useState("");
  const [pasted, setPasted] = useState("");
  const [boards, setBoards] = useState<Board[]>([]);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState({ done: 0, total: 0, failed: 0 });
  const [selected, setSelected] = useState<Record<string, boolean>>({}); // key = `${boardIdx}:${pinId}`
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalImages = useMemo(
    () => boards.reduce((acc, b) => acc + (b.images?.length || 0), 0),
    [boards],
  );
  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected],
  );

  const [uploadedFileName, setUploadedFileName] = useState("");

  const onFileChosen = async (file: File) => {
    setError("");
    try {
      const buf = await file.arrayBuffer();
      const lower = (file.name || "").toLowerCase();
      let text = "";
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".ods")) {
        const wb = XLSX.read(buf, { type: "array" });
        const cells: string[] = [];
        for (const name of wb.SheetNames) {
          const sheet = wb.Sheets[name];
          const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" });
          for (const row of rows) for (const cell of row) {
            if (cell == null) continue;
            cells.push(String(cell));
          }
        }
        text = cells.join("\n");
      } else {
        text = new TextDecoder("utf-8").decode(new Uint8Array(buf));
      }
      const { boards, directImages } = classifyPinterestUrls(text);
      if (boards.length === 0 && directImages.length === 0) {
        setError(`No Pinterest URLs found in "${file.name}".`);
        return;
      }
      setUploadedFileName(file.name);
      // Stash both kinds back into the textarea so the user can review/edit
      // before fetching. Boards first, direct image URLs after.
      setPasted([...boards, ...directImages].join("\n"));
    } catch (err: any) {
      setError(err?.message || "Failed to read file");
    }
  };

  const handleFetch = async () => {
    const combined = [singleUrl, pasted].filter(Boolean).join("\n");
    const { boards: boardUrls, directImages } = classifyPinterestUrls(combined);
    if (boardUrls.length === 0 && directImages.length === 0) {
      setError("Add at least one Pinterest URL or i.pinimg.com image link.");
      return;
    }

    setError("");
    setSelected({});

    // Build the initial board list. Direct image URLs collapse into one
    // virtual "board" so the rest of the UI / ZIP flow works unchanged.
    const directBoardName = uploadedFileName || "Uploaded images";
    const directBoard: Board | null = directImages.length > 0
      ? {
          inputUrl: directBoardName,
          status: "ok",
          name: directBoardName,
          source: "direct-list",
          images: directImages.map((u, i) => ({ id: `direct-${i}-${u.split("/").pop()?.split(".")[0] || i}`, url: upgradeToOriginals(u) })),
        }
      : null;
    const fetchableBoards: Board[] = boardUrls.map((u) => ({ inputUrl: u, status: "pending", images: [] }));
    const all: Board[] = [...(directBoard ? [directBoard] : []), ...fetchableBoards];
    setBoards(all);

    // Pre-select every direct image so the user only needs to hit Download.
    if (directBoard) {
      const pre: Record<string, boolean> = {};
      for (const img of directBoard.images) pre[`0:${img.id}`] = true;
      setSelected(pre);
    }

    if (boardUrls.length === 0) return; // nothing to fetch from the backend

    setRunning(true);
    const homeownerToken = localStorage.getItem("homeowner-token") || "";
    const startIdx = directBoard ? 1 : 0;

    for (let i = 0; i < boardUrls.length; i++) {
      const arrayIdx = startIdx + i;
      setBoards((b) => b.map((row, idx) => idx === arrayIdx ? { ...row, status: "fetching" } : row));
      try {
        const res = await fetch(`${API}/pinterest-board/fetch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-Homeowner-Token": homeownerToken,
          },
          body: JSON.stringify({ url: boardUrls[i], limit: 500 }),
        });
        const json = await res.json();
        if (!res.ok) {
          setBoards((b) => b.map((row, idx) => idx === arrayIdx ? { ...row, status: "error", error: json?.error || `HTTP ${res.status}` } : row));
        } else {
          setBoards((b) => b.map((row, idx) => idx === arrayIdx ? {
            ...row,
            status: "ok",
            name: json.board?.name,
            url: json.board?.url,
            source: json.source,
            images: json.images || [],
          } : row));
          setSelected((sel) => {
            const next = { ...sel };
            for (const img of json.images || []) next[`${arrayIdx}:${img.id}`] = true;
            return next;
          });
        }
      } catch (err: any) {
        setBoards((b) => b.map((row, idx) => idx === arrayIdx ? { ...row, status: "error", error: err?.message || "Network error" } : row));
      }
    }

    setRunning(false);
  };

  const togglePin = (boardIdx: number, pinId: string) =>
    setSelected((s) => ({ ...s, [`${boardIdx}:${pinId}`]: !s[`${boardIdx}:${pinId}`] }));

  const setAllOnBoard = (boardIdx: number, v: boolean) => {
    setSelected((sel) => {
      const next = { ...sel };
      const board = boards[boardIdx];
      if (!board) return sel;
      for (const img of board.images) next[`${boardIdx}:${img.id}`] = v;
      return next;
    });
  };

  const setAllAcrossAll = (v: boolean) => {
    setSelected((sel) => {
      const next = { ...sel };
      boards.forEach((board, idx) => {
        for (const img of board.images) next[`${idx}:${img.id}`] = v;
      });
      return next;
    });
  };

  const handleDownload = async () => {
    if (zipping) return;
    const picks: { boardIdx: number; pin: PinImage; boardSlug: string; boardName: string }[] = [];
    boards.forEach((board, idx) => {
      const slug = safeBoardSlug(board.name || `board-${idx + 1}`, `board-${idx + 1}`);
      for (const img of board.images) {
        if (selected[`${idx}:${img.id}`]) {
          picks.push({ boardIdx: idx, pin: img, boardSlug: slug, boardName: board.name || `Board ${idx + 1}` });
        }
      }
    });
    if (picks.length === 0) { setError("Select at least one image."); return; }
    setError("");
    setZipping(true);
    setZipProgress({ done: 0, total: picks.length, failed: 0 });
    try {
      const zip = new JSZip();
      const folders: Record<string, JSZip> = {};
      const counters: Record<string, number> = {};
      for (const board of boards) {
        if (!board.images.length) continue;
        const slug = safeBoardSlug(board.name || "", `board-${boards.indexOf(board) + 1}`);
        if (!folders[slug]) {
          folders[slug] = zip.folder(slug)!;
          counters[slug] = 0;
        }
      }
      let done = 0;
      let failed = 0;
      for (const item of picks) {
        try {
          const raw = await fetchAsBlob(item.pin.url);
          const { blob, ext } = await clampTo2048(raw);
          counters[item.boardSlug] = (counters[item.boardSlug] || 0) + 1;
          const padded = String(counters[item.boardSlug]).padStart(3, "0");
          folders[item.boardSlug].file(`${padded}-${item.pin.id}.${ext}`, blob);
        } catch {
          failed++;
        }
        done++;
        setZipProgress({ done, total: picks.length, failed });
      }
      const archive = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 5 },
      });
      const fileName = boards.length === 1
        ? `${safeBoardSlug(boards[0].name || "")}-${picks.length}.zip`
        : `pinterest-batch-${boards.length}boards-${picks.length}images.zip`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(archive);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to build zip");
    } finally {
      setZipping(false);
    }
  };

  const previewClassification = useMemo(() => classifyPinterestUrls(pasted), [pasted]);
  const previewBoardCount = previewClassification.boards.length;
  const previewImageCount = previewClassification.directImages.length;

  return (
    <div className="min-h-screen" style={{ background: C.cream, fontFamily: sans }}>
      <HomepageNav />

      <div className="max-w-[1280px] mx-auto px-6 md:px-10 pt-10 pb-16">
        {/* Header */}
        <div className="max-w-[640px]">
          <p
            className="mb-3"
            style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
              textTransform: "uppercase", color: C.grayLight,
            }}
          >
            Internal tool
          </p>
          <h1
            className="leading-[1.05]"
            style={{ fontFamily: serif, color: C.black, letterSpacing: "-0.025em" }}
          >
            <span className="block font-normal" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>
              Pinterest board
            </span>
            <span
              className="block font-normal italic"
              style={{ fontSize: "clamp(32px, 4vw, 48px)", color: C.grayLight }}
            >
              downloader.
            </span>
          </h1>
          <p className="text-[15px] leading-[1.65] mt-4" style={{ color: C.gray }}>
            Drop a single board URL, paste many, or upload an Excel/CSV column. We pull every pin
            via Pinterest's own paginated API, then bundle a clamped-to-2048px ZIP organised by
            board.
          </p>
        </div>

        {/* Single URL */}
        <div
          className="mt-8 p-4 md:p-5 rounded-[14px] flex flex-col md:flex-row gap-3 md:items-center"
          style={{ background: C.white, border: `1px solid ${C.creamBorder}` }}
        >
          <input
            type="url"
            value={singleUrl}
            onChange={(e) => setSingleUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleFetch(); }}
            placeholder="https://www.pinterest.com/username/board-name/"
            className="flex-1 h-[48px] px-4 rounded-[10px] outline-none text-[14px]"
            style={{
              background: C.cream, border: `1px solid ${C.creamBorder}`,
              color: C.black, fontFamily: sans,
            }}
          />
          <button
            onClick={handleFetch}
            disabled={running}
            className="h-[48px] px-6 rounded-[10px] text-[14px] font-semibold cursor-pointer transition-opacity hover:opacity-85 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: C.black, color: C.white, border: "none", fontFamily: sans }}
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
            {running ? "Fetching…" : "Fetch"}
          </button>
        </div>

        {/* Bulk paste / upload */}
        <div
          className="mt-4 p-4 md:p-5 rounded-[14px]"
          style={{ background: C.white, border: `1px solid ${C.creamBorder}` }}
        >
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.grayLight }}>
                Or, batch mode
              </p>
              <p className="text-[13px] mt-1" style={{ color: C.gray }}>
                Upload an Excel/CSV column or paste many URLs (one per line).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.txt,.ods"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFileChosen(f);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-[40px] px-4 rounded-[10px] text-[13px] font-medium cursor-pointer flex items-center gap-2 hover:opacity-80"
                style={{ background: "transparent", color: C.black, border: `1px solid ${C.creamBorder}` }}
              >
                <FileSpreadsheet size={14} /> Upload .xlsx / .csv
              </button>
            </div>
          </div>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder={`https://www.pinterest.com/user/board-1/\nhttps://ph.pinterest.com/user/board-2/\nhttps://www.pinterest.com/user/board-3/`}
            rows={5}
            className="w-full px-3 py-2 rounded-[10px] outline-none text-[13px] leading-[1.55]"
            style={{
              background: C.cream, border: `1px solid ${C.creamBorder}`,
              color: C.black, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              resize: "vertical",
            }}
          />
          <div className="flex items-center justify-between mt-2 text-[12px]" style={{ color: C.grayLight }}>
            <span>
              {previewBoardCount} board{previewBoardCount === 1 ? "" : "s"} ·{" "}
              {previewImageCount} direct image{previewImageCount === 1 ? "" : "s"}
              {uploadedFileName && ` · from ${uploadedFileName}`}
            </span>
            {pasted && (
              <button
                onClick={() => { setPasted(""); setUploadedFileName(""); }}
                className="hover:opacity-70 cursor-pointer"
                style={{ background: "transparent", border: "none", color: C.gray }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            className="mt-4 px-4 py-3 rounded-[10px] flex items-start gap-2"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
          >
            <XIcon size={16} style={{ color: "#c14", marginTop: 2, flexShrink: 0 }} />
            <span className="text-[13px]" style={{ color: "#c14" }}>{error}</span>
          </div>
        )}

        {/* Master toolbar */}
        {boards.length > 0 && (
          <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.grayLight }}>
                Boards
              </p>
              <h2
                className="text-[22px] leading-[1.2] mt-1"
                style={{ fontFamily: serif, color: C.black }}
              >
                {boards.length} board{boards.length === 1 ? "" : "s"} · {totalImages} pin{totalImages === 1 ? "" : "s"} · {selectedCount} selected
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAllAcrossAll(true)}
                className="h-[40px] px-4 rounded-[10px] text-[13px] font-medium cursor-pointer hover:opacity-80"
                style={{ background: "transparent", color: C.black, border: `1px solid ${C.creamBorder}` }}
              >
                Select all
              </button>
              <button
                onClick={() => setAllAcrossAll(false)}
                className="h-[40px] px-4 rounded-[10px] text-[13px] font-medium cursor-pointer hover:opacity-80"
                style={{ background: "transparent", color: C.gray, border: `1px solid ${C.creamBorder}` }}
              >
                Clear
              </button>
              <button
                onClick={handleDownload}
                disabled={zipping || selectedCount === 0 || running}
                className="h-[40px] px-5 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-85 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                style={{ background: C.black, color: C.white, border: "none" }}
              >
                {zipping ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {zipping ? `Zipping… ${zipProgress.done}/${zipProgress.total}` : `Download ${selectedCount} as ZIP`}
              </button>
            </div>
          </div>
        )}

        {zipping && (
          <div className="mt-3 h-[6px] rounded-full overflow-hidden" style={{ background: C.creamBorder }}>
            <div
              className="h-full transition-all"
              style={{
                width: `${zipProgress.total ? (zipProgress.done / zipProgress.total) * 100 : 0}%`,
                background: C.black,
              }}
            />
          </div>
        )}

        {/* Per-board sections */}
        <div className="mt-6 flex flex-col gap-8">
          {boards.map((board, bIdx) => (
            <BoardSection
              key={`${bIdx}:${board.inputUrl}`}
              board={board}
              boardIdx={bIdx}
              selected={selected}
              onTogglePin={togglePin}
              onSelectAll={(v) => setAllOnBoard(bIdx, v)}
            />
          ))}
        </div>

        {zipProgress.failed > 0 && !zipping && (
          <p className="text-[12px] mt-3" style={{ color: "#c14" }}>
            {zipProgress.failed} image(s) couldn't be downloaded — Pinterest may be rate-limiting.
            Retrying often resolves it.
          </p>
        )}
      </div>
    </div>
  );
}

function BoardSection({
  board, boardIdx, selected, onTogglePin, onSelectAll,
}: {
  board: Board;
  boardIdx: number;
  selected: Record<string, boolean>;
  onTogglePin: (b: number, p: string) => void;
  onSelectAll: (v: boolean) => void;
}) {
  const selectedHere = useMemo(
    () => board.images.reduce((n, img) => n + (selected[`${boardIdx}:${img.id}`] ? 1 : 0), 0),
    [board, boardIdx, selected],
  );
  return (
    <div className="rounded-[14px] p-4 md:p-5" style={{ background: C.white, border: `1px solid ${C.creamBorder}` }}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: C.grayLight }}>
            {board.status === "fetching" ? "Fetching…" : board.status === "error" ? "Error" : board.status === "pending" ? "Queued" : `${board.images.length} pins · source: ${board.source || "—"}`}
          </p>
          <h3
            className="text-[18px] leading-[1.25] mt-1 truncate"
            style={{ fontFamily: serif, color: C.black }}
            title={board.name || board.inputUrl}
          >
            {board.name || board.inputUrl}
          </h3>
          <a
            href={board.url || board.inputUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] mt-1 hover:opacity-70"
            style={{ color: C.grayLight }}
          >
            Open on Pinterest <ExternalLink size={12} />
          </a>
        </div>
        {board.images.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px]" style={{ color: C.gray }}>{selectedHere}/{board.images.length} selected</span>
            <button
              onClick={() => onSelectAll(true)}
              className="h-[34px] px-3 rounded-[8px] text-[12px] font-medium cursor-pointer hover:opacity-80"
              style={{ background: "transparent", color: C.black, border: `1px solid ${C.creamBorder}` }}
            >
              Select all
            </button>
            <button
              onClick={() => onSelectAll(false)}
              className="h-[34px] px-3 rounded-[8px] text-[12px] font-medium cursor-pointer hover:opacity-80"
              style={{ background: "transparent", color: C.gray, border: `1px solid ${C.creamBorder}` }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {board.status === "fetching" && (
        <div className="flex items-center gap-2 text-[13px]" style={{ color: C.gray }}>
          <Loader2 size={14} className="animate-spin" /> Fetching pins…
        </div>
      )}
      {board.status === "error" && (
        <p className="text-[13px]" style={{ color: "#c14" }}>{board.error}</p>
      )}

      {board.images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {board.images.map((img) => {
            const sel = !!selected[`${boardIdx}:${img.id}`];
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => onTogglePin(boardIdx, img.id)}
                className="group relative aspect-[3/4] rounded-[10px] overflow-hidden"
                style={{
                  border: `2px solid ${sel ? C.black : C.creamBorder}`,
                  background: C.cream,
                }}
              >
                <img
                  src={img.url}
                  alt={img.alt || "Pin"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <span
                  className="absolute top-2 right-2 size-[24px] rounded-[6px] flex items-center justify-center"
                  style={{
                    background: sel ? C.black : "rgba(255,255,255,0.9)",
                    border: `1px solid ${sel ? C.black : C.creamBorder}`,
                  }}
                >
                  {sel && <Check size={14} style={{ color: C.white }} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
