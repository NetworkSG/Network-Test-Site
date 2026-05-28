import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, Check } from "lucide-react";
import { C, sans } from "../homepage/v8/primitives";
import { listAirtableFirms } from "./onboardingApi";

type Firm = { id: string; firmName: string; contactEmail?: string };

export function FirmCombobox({
  value,
  recordId,
  onSelect,
  placeholder = "Search your firm…",
}: {
  value: string;
  recordId: string;
  onSelect: (recordId: string, firmName: string, contactEmail?: string) => void;
  placeholder?: string;
}) {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => { setQuery(value || ""); }, [value, recordId]);

  const loadFirms = (refresh = false) => {
    setLoading(true);
    setLoadError("");
    return listAirtableFirms({ refresh })
      .then(setFirms)
      .catch((e: any) => setLoadError(e?.message || "Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAirtableFirms()
      .then((f) => { if (!cancelled) setFirms(f); })
      .catch((e: any) => { if (!cancelled) setLoadError(e?.message || "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || query === value) return firms;
    return firms.filter((f) => f.firmName.toLowerCase().includes(q));
  }, [firms, query, value]);

  useEffect(() => {
    if (highlight >= filtered.length) setHighlight(0);
  }, [filtered, highlight]);

  const pick = (f: Firm) => {
    onSelect(f.id, f.firmName, f.contactEmail);
    setQuery(f.firmName);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0))); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { if (open && filtered[highlight]) { e.preventDefault(); pick(filtered[highlight]); } }
    else if (e.key === "Escape") { setOpen(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "44px",
    padding: "0 38px 0 14px",
    background: C.white,
    border: `1px solid ${recordId ? C.black : C.creamBorder}`,
    borderRadius: "10px",
    color: C.black,
    fontFamily: sans,
    fontSize: "14px",
    outline: "none",
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (recordId) onSelect("", "");
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          style={inputStyle}
        />
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center", gap: 4 }}>
          {recordId && <Check size={14} style={{ color: C.black }} />}
          {loading ? <Loader2 size={14} className="animate-spin" style={{ color: C.grayLight }} /> : <ChevronDown size={16} style={{ color: C.grayLight }} />}
        </span>
      </div>
      {open && (
        <ul
          ref={listRef}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            maxHeight: 260,
            overflowY: "auto",
            background: C.white,
            border: `1px solid ${C.creamBorder}`,
            borderRadius: 10,
            padding: 4,
            margin: 0,
            listStyle: "none",
            zIndex: 40,
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          {loadError && <li style={{ padding: "10px 12px", fontFamily: sans, fontSize: 12, color: "#c14" }}>{loadError}</li>}
          {!loadError && filtered.length === 0 && (
            <li style={{ padding: "10px 12px", fontFamily: sans, fontSize: 13, color: C.grayLight }}>
              {loading ? "Loading firms…" : (
                <>
                  No matches. <button type="button" onMouseDown={(e) => { e.preventDefault(); loadFirms(true); }}
                    style={{ background: "transparent", border: "none", padding: 0, color: C.black, fontFamily: sans, fontSize: 13, textDecoration: "underline", cursor: "pointer" }}>
                    Refresh list
                  </button> or contact us if your firm should be listed.
                </>
              )}
            </li>
          )}
          {filtered.map((f, i) => {
            const active = i === highlight;
            const selected = recordId === f.id;
            return (
              <li
                key={f.id}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => { e.preventDefault(); pick(f); }}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: active ? C.cream : "transparent",
                  fontFamily: sans,
                  fontSize: 13,
                  color: C.black,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{f.firmName}</span>
                {selected && <Check size={13} style={{ color: C.black }} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
