import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Trash2, Pencil, X, Loader2, LayoutTemplate, ChevronDown,
  CheckCircle2, AlertCircle, Eye, Upload, FileText, Image as ImageIcon,
} from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { FloorPlanThumbnail } from "./FloorPlan3DDashboard";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;
const AUTH = { Authorization: `Bearer ${publicAnonKey}`, "Content-Type": "application/json" };

interface FP3DTemplate {
  id: string; name: string; category: string; unitType: string;
  description: string; thumbnailUrl: string | null; dwgFileUrl: string | null;
  isActive: boolean; createdAt: string; updatedAt: string;
  projectData?: { roomDefinitions?: any[]; [key: string]: any } | null;
}

const CATEGORIES = [
  { value: "bto", label: "BTO" },
  { value: "resale_hdb", label: "Resale HDB" },
  { value: "condo", label: "Condo" },
  { value: "landed", label: "Landed" },
  { value: "commercial", label: "Commercial" },
];

const UNIT_TYPES = ["2-Room", "3-Room", "4-Room", "5-Room", "Executive", "Penthouse", "Other"];

const emptyForm = () => ({ name: "", category: "bto", unitType: "3-Room", description: "", thumbnailUrl: "", dwgFileUrl: "" });

/* ─── File Upload Helper ─── */
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:...;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─── File Upload Zone Component ─── */
function FileUploadZone({ label, accept, fileType, currentUrl, onUploaded, onClear, maxSizeMB }: {
  label: string; accept: string; fileType: "dwg" | "thumbnail";
  currentUrl: string; onUploaded: (url: string) => void; onClear: () => void; maxSizeMB: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError("");
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum ${maxSizeMB} MB.`);
      return;
    }
    setUploading(true);
    setFileName(file.name);
    try {
      const fileBase64 = await readFileAsBase64(file);
      const res = await fetch(`${API}/fp3d/template-upload`, {
        method: "POST",
        headers: AUTH,
        body: JSON.stringify({ fileBase64, fileName: file.name, contentType: file.type || "application/octet-stream", fileType }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        onUploaded(data.url);
      } else {
        setError(data.error || "Upload failed");
        setFileName("");
      }
    } catch (e: any) {
      setError(e.message || "Upload failed");
      setFileName("");
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const hasFile = !!currentUrl;
  const icon = fileType === "dwg" ? FileText : ImageIcon;
  const Icon = icon;

  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#364153] mb-1.5">{label}</label>
      {hasFile ? (
        <div className="flex items-center gap-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[14px] px-4 py-3">
          <CheckCircle2 className="size-[18px] text-[#22c55e] shrink-0" strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[#166534] truncate">{fileName || "File uploaded"}</p>
            <p className="text-[11px] text-[#4ade80] truncate">{currentUrl.slice(0, 60)}…</p>
          </div>
          <button type="button" onClick={() => { onClear(); setFileName(""); }}
            className="size-[28px] rounded-[8px] hover:bg-[#dcfce7] flex items-center justify-center transition-colors shrink-0">
            <X className="size-[14px] text-[#166534]" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-[14px] px-4 py-5 flex flex-col items-center text-center cursor-pointer transition-all ${
            dragOver ? "border-[#09090B] bg-[#F6F6F6]" : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#09090B] hover:bg-[#F6F6F6]"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <input ref={inputRef} type="file" accept={accept} className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          {uploading ? (
            <>
              <Loader2 className="size-[24px] text-[#09090B] animate-spin mb-2" />
              <p className="text-[12px] text-[#71717A]">Uploading {fileName}…</p>
            </>
          ) : (
            <>
              <div className="size-[36px] rounded-[10px] bg-white border border-[#E5E7EB] flex items-center justify-center mb-2">
                <Icon className="size-[18px] text-[#71717A]" strokeWidth={1.5} />
              </div>
              <p className="text-[12px] font-medium text-[#09090B]">
                Drop file here or <span className="text-[#09090B] underline">browse</span>
              </p>
              <p className="text-[11px] text-[#9ca3af] mt-0.5">Max {maxSizeMB} MB</p>
            </>
          )}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <AlertCircle className="size-[12px] text-red-500 shrink-0" />
          <p className="text-[11px] text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export function AdminFloorPlanTemplates() {
  const [templates, setTemplates] = useState<FP3DTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/fp3d/templates?all=true`, { headers: AUTH });
      if (res.ok) { const d = await res.json(); setTemplates(d.templates || []); }
      else { const d = await res.json(); console.error("Failed to fetch templates:", d.error); }
    } catch (e) { console.error("Failed to fetch templates:", e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

  const upd = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setToast({ type: "error", message: "Template name is required" }); return; }
    setSaving(true);
    try {
      const url = editingId ? `${API}/fp3d/templates/${editingId}` : `${API}/fp3d/templates`;
      const method = editingId ? "PUT" : "POST";
      const payload = {
        ...form,
        thumbnailUrl: form.thumbnailUrl || null,
        dwgFileUrl: form.dwgFileUrl || null,
      };
      const res = await fetch(url, { method, headers: AUTH, body: JSON.stringify(payload) });
      if (res.ok) {
        setToast({ type: "success", message: editingId ? "Template updated" : "Template created" });
        setShowModal(false); setEditingId(null); setForm(emptyForm());
        fetchTemplates();
      } else {
        const d = await res.json();
        console.error("Failed to save template:", d);
        setToast({ type: "error", message: d.error || "Failed to save template" });
      }
    } catch (e: any) {
      console.error("Template save error:", e);
      setToast({ type: "error", message: e.message });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this template? It will be hidden from users but existing projects using it will still work.")) return;
    try {
      const res = await fetch(`${API}/fp3d/templates/${id}`, { method: "DELETE", headers: AUTH });
      if (res.ok) { setToast({ type: "success", message: "Template deactivated" }); fetchTemplates(); }
    } catch (e: any) { setToast({ type: "error", message: e.message }); }
  };

  const handleEdit = (t: FP3DTemplate) => {
    setEditingId(t.id);
    setForm({ name: t.name, category: t.category, unitType: t.unitType, description: t.description || "", thumbnailUrl: t.thumbnailUrl || "", dwgFileUrl: t.dwgFileUrl || "" });
    setShowModal(true);
  };

  const handleReactivate = async (id: string) => {
    try {
      const res = await fetch(`${API}/fp3d/templates/${id}`, { method: "PUT", headers: AUTH, body: JSON.stringify({ isActive: true }) });
      if (res.ok) { setToast({ type: "success", message: "Template reactivated" }); fetchTemplates(); }
    } catch (e: any) { setToast({ type: "error", message: e.message }); }
  };

  const previewTemplate = templates.find((t) => t.id === previewId);

  return (
    <div className="font-['Inter',sans-serif]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`fixed top-5 right-5 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-[14px] font-medium ${
              toast.type === "success" ? "bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]" : "bg-[#fef2f2] border-[#fecaca] text-[#991b1b]"
            }`}>
            {toast.type === "success" ? <CheckCircle2 className="size-5 text-[#22c55e]" /> : <AlertCircle className="size-5 text-[#ef4444]" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bold text-[20px] text-[#101828] tracking-[-0.5px]">Floor Plan Templates</h2>
          <p className="text-[13px] text-[#9ca3af] mt-1">Manage DWG templates available to users in the floor plan planner.</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm(emptyForm()); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#101828] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1a2332] transition-colors shadow-sm">
          <Plus className="size-4" strokeWidth={2} /> Add Template
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-[32px] text-[#09090B] animate-spin" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#e5e7eb]">
          <LayoutTemplate className="size-[48px] text-[#d1d5db] mx-auto mb-4" strokeWidth={1} />
          <p className="text-[16px] text-[#6a7282] font-medium">No templates yet</p>
          <p className="text-[13px] text-[#9ca3af] mt-1">Add your first DWG template to get started.</p>
          <button onClick={() => { setEditingId(null); setForm(emptyForm()); setShowModal(true); }}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#101828] text-white rounded-xl text-[13px] font-semibold hover:bg-[#1a2332] transition-colors shadow-sm">
            <Plus className="size-4" strokeWidth={2} /> Add Template
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#6a7282] uppercase tracking-wider">Template Name</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#6a7282] uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#6a7282] uppercase tracking-wider hidden md:table-cell">Unit Type</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#6a7282] uppercase tracking-wider hidden lg:table-cell">Files</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#6a7282] uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="text-left px-5 py-3 text-[12px] font-semibold text-[#6a7282] uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-[12px] font-semibold text-[#6a7282] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b border-[#f3f4f6] hover:bg-[#fafbfc] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-[40px] rounded-[10px] bg-[#f6f6f6] flex items-center justify-center shrink-0 overflow-hidden">
                        {t.projectData?.roomDefinitions?.length ? <FloorPlanThumbnail roomDefs={t.projectData.roomDefinitions} size="small" /> : t.thumbnailUrl ? <img src={t.thumbnailUrl} alt={t.name} className="size-full object-cover" /> : <LayoutTemplate className="size-[20px] text-[#ababab]" strokeWidth={1.5} />}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#101828]">{t.name}</p>
                        {t.description && <p className="text-[12px] text-[#9ca3af] truncate max-w-[200px]">{t.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="px-3 py-1 rounded-[100px] bg-[#f6f6f6] text-[12px] font-medium text-[#09090B] border border-[#e5e7eb]">
                      {CATEGORIES.find((c) => c.value === t.category)?.label || t.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[14px] text-[#6a7282] hidden md:table-cell">{t.unitType}</td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      {t.dwgFileUrl ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[100px] bg-[#f0fdf4] text-[11px] font-medium text-[#166534] border border-[#bbf7d0]">
                          <FileText className="size-[10px]" /> DWG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[100px] bg-[#fef2f2] text-[11px] font-medium text-[#991b1b] border border-[#fecaca]">
                          <FileText className="size-[10px]" /> No DWG
                        </span>
                      )}
                      {t.thumbnailUrl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[100px] bg-[#f0fdf4] text-[11px] font-medium text-[#166534] border border-[#bbf7d0]">
                          <ImageIcon className="size-[10px]" /> Thumb
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#9ca3af] hidden lg:table-cell">{new Date(t.createdAt).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-[100px] text-[12px] font-medium border ${t.isActive ? "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]" : "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]"}`}>
                      {t.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setPreviewId(t.id)} className="size-[32px] rounded-[8px] hover:bg-[#f6f6f6] flex items-center justify-center transition-colors" title="Preview">
                        <Eye className="size-[15px] text-[#6a7282]" strokeWidth={1.5} />
                      </button>
                      <button onClick={() => handleEdit(t)} className="size-[32px] rounded-[8px] hover:bg-[#f6f6f6] flex items-center justify-center transition-colors" title="Edit">
                        <Pencil className="size-[15px] text-[#6a7282]" strokeWidth={1.5} />
                      </button>
                      {t.isActive ? (
                        <button onClick={() => handleDelete(t.id)} className="size-[32px] rounded-[8px] hover:bg-red-50 flex items-center justify-center transition-colors" title="Deactivate">
                          <Trash2 className="size-[15px] text-red-500" strokeWidth={1.5} />
                        </button>
                      ) : (
                        <button onClick={() => handleReactivate(t.id)} className="size-[32px] rounded-[8px] hover:bg-emerald-50 flex items-center justify-center transition-colors text-[12px] font-medium text-emerald-600" title="Reactivate">
                          <CheckCircle2 className="size-[15px]" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }} className="bg-white rounded-[17px] shadow-[0px_25px_35.9px_rgba(0,0,0,0.15)] w-full max-w-[560px] max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 pb-4">
                <h2 className="font-bold text-[20px] text-[#101828] tracking-[-0.5px]">{editingId ? "Edit Template" : "Add New Template"}</h2>
                <button onClick={() => setShowModal(false)} className="size-[36px] rounded-full hover:bg-[#F6F6F6] flex items-center justify-center transition-colors"><X className="size-[18px] text-[#71717A]" /></button>
              </div>
              <div className="p-6 pt-0 flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#364153] mb-1.5">Template Name *</label>
                  <input value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="e.g. 4-Room BTO Standard"
                    className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors font-['Inter',sans-serif]" />
                </div>

                {/* Category + Unit Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#364153] mb-1.5">Category *</label>
                    <div className="relative">
                      <select value={form.category} onChange={(e) => upd("category", e.target.value)}
                        className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 pr-10 text-[14px] text-[#09090B] outline-none focus:border-[#09090B] transition-colors appearance-none font-['Inter',sans-serif]">
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-[16px] text-[#99A1AF] pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#364153] mb-1.5">Unit Type *</label>
                    <div className="relative">
                      <select value={form.unitType} onChange={(e) => upd("unitType", e.target.value)}
                        className="w-full h-[42px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 pr-10 text-[14px] text-[#09090B] outline-none focus:border-[#09090B] transition-colors appearance-none font-['Inter',sans-serif]">
                        {UNIT_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-[16px] text-[#99A1AF] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* DWG File Upload */}
                <FileUploadZone
                  label="DWG / Floor Plan File"
                  accept=".dwg,.dxf,.pdf,.png,.jpg,.jpeg,.webp,.bmp"
                  fileType="dwg"
                  currentUrl={form.dwgFileUrl}
                  onUploaded={(url) => upd("dwgFileUrl", url)}
                  onClear={() => upd("dwgFileUrl", "")}
                  maxSizeMB={20}
                />

                {/* Thumbnail Upload */}
                <FileUploadZone
                  label="Thumbnail Image (optional)"
                  accept="image/png,image/jpeg,image/webp"
                  fileType="thumbnail"
                  currentUrl={form.thumbnailUrl}
                  onUploaded={(url) => upd("thumbnailUrl", url)}
                  onClear={() => upd("thumbnailUrl", "")}
                  maxSizeMB={5}
                />

                {/* Description */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#364153] mb-1.5">Description (optional)</label>
                  <textarea value={form.description} onChange={(e) => upd("description", e.target.value)} placeholder="Brief description of this floor plan template..." rows={3}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] px-4 py-3 text-[14px] text-[#09090B] placeholder:text-[#99A1AF] outline-none focus:border-[#09090B] transition-colors resize-none font-['Inter',sans-serif]" />
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setShowModal(false)} className="flex-1 h-[42px] rounded-[14px] border border-[#e5e7eb] text-[14px] font-medium text-[#364153] hover:bg-[#f6f6f6] transition-colors font-['Inter',sans-serif]">Cancel</button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 h-[42px] rounded-[14px] bg-[#101828] text-white text-[14px] font-semibold hover:bg-[#1a2332] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 font-['Inter',sans-serif]">
                    {saving ? <Loader2 className="size-[16px] animate-spin" /> : null}
                    {editingId ? "Update Template" : "Create Template"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewId && previewTemplate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setPreviewId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[17px] shadow-[0px_25px_35.9px_rgba(0,0,0,0.15)] w-full max-w-[480px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="h-[200px] bg-white flex items-center justify-center p-4">
                {previewTemplate.projectData?.roomDefinitions?.length ? <FloorPlanThumbnail roomDefs={previewTemplate.projectData.roomDefinitions} size="large" /> : previewTemplate.thumbnailUrl ? <img src={previewTemplate.thumbnailUrl} alt={previewTemplate.name} className="w-full h-full object-cover" /> : <LayoutTemplate className="size-[64px] text-[#d1d5db]" strokeWidth={1} />}
              </div>
              <div className="p-6">
                <h3 className="font-bold text-[20px] text-[#101828] tracking-[-0.5px] mb-2">{previewTemplate.name}</h3>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 rounded-[100px] bg-[#f6f6f6] text-[12px] font-medium text-[#09090B] border border-[#e5e7eb]">
                    {CATEGORIES.find((c) => c.value === previewTemplate.category)?.label || previewTemplate.category}
                  </span>
                  <span className="text-[13px] text-[#6a7282]">{previewTemplate.unitType}</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  {previewTemplate.dwgFileUrl ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[100px] bg-[#f0fdf4] text-[12px] font-medium text-[#166534] border border-[#bbf7d0]">
                      <FileText className="size-[12px]" /> DWG file attached
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[100px] bg-[#fef2f2] text-[12px] font-medium text-[#991b1b] border border-[#fecaca]">
                      <AlertCircle className="size-[12px]" /> No DWG file
                    </span>
                  )}
                </div>
                {previewTemplate.description && <p className="text-[14px] text-[#6a7282] leading-relaxed mb-4">{previewTemplate.description}</p>}
                <div className="text-[12px] text-[#9ca3af]">
                  Created: {new Date(previewTemplate.createdAt).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                <button onClick={() => setPreviewId(null)} className="w-full h-[42px] mt-4 rounded-[14px] border border-[#e5e7eb] text-[14px] font-medium text-[#364153] hover:bg-[#f6f6f6] transition-colors font-['Inter',sans-serif]">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
