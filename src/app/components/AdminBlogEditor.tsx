import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Plus,
  Settings as SettingsIcon,
  Image as ImageIcon,
  Search as SearchIcon,
  Heading2,
  Quote,
  List as ListIcon,
  ListOrdered,
  Minus,
  Eye,
  X,
  ChevronDown,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type as TypeIcon,
  Code,
  Undo2,
  Redo2,
} from "lucide-react";
import {
  getAllPostsForAdmin,
  savePost,
  toSlug,
  BLOG_CATEGORIES,
  subscribe,
  type AdminPost,
} from "./blog/blogStore";
import type { Post, BlogCategory } from "./blog/posts";
import { blocksToHtml, htmlToBlocks } from "./blog/editorBlocks";

const todayISO = () => new Date().toISOString().slice(0, 10);

const EMPTY_POST: Post = {
  slug: "",
  category: "Cost Guides",
  title: "",
  description: "",
  image: "",
  author: { name: "Network Editorial", avatar: "NE" },
  readMin: 5,
  publishedOn: todayISO(),
  lede: "",
  body: [],
  imageAlt: "",
  excerpt: "",
  tags: [],
  categories: [],
  featured: false,
  allowComments: true,
  relatedSlugs: [],
};

// ─── Sidebar nav button ──────────────────────────────────────────
function SideButton({
  active, onClick, icon: Icon, label, disabled,
}: {
  active?: boolean;
  onClick?: () => void;
  icon: typeof Plus;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 py-3 px-2 text-[11px] font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        color: active ? "#101828" : "#6a7282",
        background: active ? "#f3f4f6" : "transparent",
        borderRadius: 10,
      }}
    >
      <Icon size={18} strokeWidth={1.6} />
      <span>{label}</span>
    </button>
  );
}

// ─── Tab pill (for the Settings drawer header) ───────────────────
function Tab({
  active, onClick, children, badge,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative pb-3 text-[13px] font-medium cursor-pointer inline-flex items-center gap-1.5"
      style={{ color: active ? "#2563eb" : "#6a7282" }}
    >
      {children}
      {badge != null && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{
            background: active ? "#2563eb" : "#e5e7eb",
            color: active ? "#fff" : "#6a7282",
            minWidth: 18,
            textAlign: "center",
          }}
        >
          {badge}
        </span>
      )}
      {active && (
        <span
          className="absolute left-0 right-0 -bottom-px h-[2px]"
          style={{ background: "#2563eb" }}
        />
      )}
    </button>
  );
}

// ─── Toggle ──────────────────────────────────────────────────────
function Toggle({
  on, onChange,
}: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative inline-flex items-center cursor-pointer transition-colors"
      style={{
        width: 36,
        height: 20,
        borderRadius: 999,
        background: on ? "#2563eb" : "#d1d5db",
      }}
    >
      <span
        className="absolute top-0.5 transition-all"
        style={{
          left: on ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: 999,
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

// ─── Editor field ────────────────────────────────────────────────
function Field({
  label, children, hint,
}: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-[#101828]">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-[#9ca3af]">{hint}</span>}
    </label>
  );
}

// ─── Block insertion helpers ─────────────────────────────────────
// Small icon button used by the rich-text toolbar.
function ToolbarButton({
  label, onClick, children,
}: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault() /* keep selection */}
      onClick={onClick}
      className="inline-flex items-center justify-center size-8 text-[#101828] hover:bg-[#f3f4f6] rounded-md cursor-pointer"
    >
      {children}
    </button>
  );
}

// ─── Rich text editor helpers ────────────────────────────────────
// Wraps document.execCommand calls so the toolbar can drive the
// contenteditable area without reimplementing selection logic.
function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

// ─── Client-side image compression ────────────────────────────────
// Resizes any uploaded image down to a sensible max edge and re-encodes
// as JPEG so big phone-camera files don't bloat the post HTML when
// stored as base64. Same pattern as DesignerProfileEditor.compressImageFile,
// tuned slightly tighter for blog body / cover images (1600px max,
// q=0.8). Skips GIF / SVG to preserve animation / vector behaviour.
const BLOG_COMPRESS_MAX_DIMENSION = 1600;
const BLOG_COMPRESS_QUALITY = 0.8;
async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = dataUrl;
    });
    const { width: w, height: h } = img;
    const scale = Math.min(1, BLOG_COMPRESS_MAX_DIMENSION / Math.max(w, h));
    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, targetW, targetH);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", BLOG_COMPRESS_QUALITY),
    );
    if (!blob) return file;
    if (blob.size >= file.size) return file; // compression didn't help
    const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Inserts arbitrary HTML at the current selection inside a contenteditable.
function insertHtmlAtCursor(html: string) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    document.execCommand("insertHTML", false, html);
    return;
  }
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const template = document.createElement("template");
  template.innerHTML = html;
  const frag = template.content;
  // Track the last node so we can put the cursor after it.
  const lastNode = frag.lastChild;
  range.insertNode(frag);
  if (lastNode) {
    range.setStartAfter(lastNode);
    range.setEndAfter(lastNode);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

// ─── Add panel (popover-style) ───────────────────────────────────
function AddPanel({
  onInsert, onImagePrompt, onClose,
}: {
  onInsert: (html: string) => void;
  onImagePrompt: () => void;
  onClose: () => void;
}) {
  const items: { icon: typeof ImageIcon; label: string; action: () => void }[] = [
    {
      icon: ImageIcon,
      label: "Image",
      action: () => { onImagePrompt(); onClose(); },
    },
    {
      icon: Heading2,
      label: "Heading",
      action: () => { onInsert("<h2>New section heading</h2>"); onClose(); },
    },
    {
      icon: TypeIcon,
      label: "Paragraph",
      action: () => { onInsert("<p>A new paragraph of body copy.</p>"); onClose(); },
    },
    {
      icon: ListIcon,
      label: "List",
      action: () => { onInsert("<ul><li>First item</li><li>Second item</li></ul>"); onClose(); },
    },
    {
      icon: Quote,
      label: "Quote",
      action: () => { onInsert("<blockquote>A quotation that emphasises a key idea.</blockquote>"); onClose(); },
    },
    {
      icon: Minus,
      label: "Divider",
      action: () => { onInsert("<hr />"); onClose(); },
    },
  ];
  return (
    <div className="w-[300px] bg-white border-r border-[#e5e7eb] flex flex-col h-full">
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#e5e7eb]">
        <h3 className="text-[15px] font-semibold text-[#101828] m-0">Add</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-[#6a7282] hover:text-[#101828] cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6a7282] mb-3">
          Blocks
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={it.action}
              className="flex flex-col items-center justify-center gap-2 p-4 border border-[#e5e7eb] rounded-lg text-[12px] text-[#101828] hover:border-[#2563eb] hover:bg-[#eff6ff] cursor-pointer transition-colors"
            >
              <it.icon size={20} strokeWidth={1.6} />
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Settings drawer ────────────────────────────────────────────
function SettingsDrawer({
  post, related, onChange, onClose, onPickCoverImage,
}: {
  post: Post;
  related: AdminPost[];
  onChange: (next: Post) => void;
  onClose: () => void;
  // Opens the shared image picker modal in the parent editor. Used
  // here to replace the raw "Image URL" text field with an Upload
  // button so every cover-image flow goes through the same picker.
  onPickCoverImage: () => void;
}) {
  const [tab, setTab] = useState<"general" | "categories" | "tags">("general");
  const update = <K extends keyof Post>(key: K, value: Post[K]) =>
    onChange({ ...post, [key]: value });

  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");

  // Related-posts picker state
  const [relatedPickerOpen, setRelatedPickerOpen] = useState(false);
  const [relatedSearch, setRelatedSearch] = useState("");
  const relatedPickerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!relatedPickerOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!relatedPickerRef.current?.contains(e.target as Node)) {
        setRelatedPickerOpen(false);
        setRelatedSearch("");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [relatedPickerOpen]);

  return (
    <div className="w-[380px] bg-white border-l border-[#e5e7eb] h-full overflow-y-auto">
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#e5e7eb]">
        <h3 className="text-[15px] font-semibold text-[#101828] m-0">Post settings</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-[#6a7282] hover:text-[#101828] cursor-pointer"
          aria-label="Close settings"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 pt-3 flex gap-6 border-b border-[#e5e7eb]">
        <Tab active={tab === "general"} onClick={() => setTab("general")}>General</Tab>
        <Tab
          active={tab === "categories"}
          onClick={() => setTab("categories")}
          badge={(post.categories?.length || 0) + 1}
        >
          Categories
        </Tab>
        <Tab
          active={tab === "tags"}
          onClick={() => setTab("tags")}
          badge={post.tags?.length || 0}
        >
          Tags
        </Tab>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {tab === "general" && (
          <>
            <Field label="URL slug" hint="The article's web address — auto-filled from the title">
              <div className="flex items-center gap-2 text-[13px] border border-[#e5e7eb] rounded-lg px-3 h-10">
                <span className="text-[#9ca3af] font-mono shrink-0">/blog/</span>
                <input
                  value={post.slug}
                  onChange={(e) => {
                    const v = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9\s-]/g, "")
                      .trim()
                      .replace(/\s+/g, "-")
                      .slice(0, 80);
                    onChange({ ...post, slug: v });
                  }}
                  className="flex-1 outline-none font-mono text-[13px] bg-transparent"
                  placeholder="article-url-slug"
                />
              </div>
            </Field>

            <Field label="Lede" hint="Short intro shown beneath the article title">
              <textarea
                value={post.lede}
                onChange={(e) => update("lede", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb] resize-none"
                placeholder="A short, punchy lede that pulls the reader in…"
              />
            </Field>

            <Field label="Card description" hint="Summary shown on the blog index card">
              <textarea
                value={post.description}
                onChange={(e) => update("description", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb] resize-none"
                placeholder="Short summary shown on the blog index card."
              />
            </Field>

            <div className="flex items-center justify-between">
              <Field label="Featured image">
                <span className="text-[12px] text-[#6a7282]">Show a cover image on the article page</span>
              </Field>
              <Toggle
                on={!!post.image}
                onChange={(v) => {
                  if (!v) update("image", "");
                }}
              />
            </div>
            {post.image && (
              <div
                className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-[#e5e7eb]"
                style={{
                  backgroundImage: `url(${post.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            )}
            <Field label="Cover image">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onPickCoverImage}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-3 text-[13px] font-medium text-[#101828] bg-white border border-dashed border-[#cbd5e1] rounded-lg cursor-pointer hover:border-[#2563eb] hover:text-[#2563eb] hover:bg-[#eff6ff] transition-colors"
                >
                  <ImageIcon size={14} />
                  {post.image ? "Change image" : "Upload image"}
                </button>
                {post.image && (
                  <button
                    type="button"
                    onClick={() => update("image", "")}
                    className="inline-flex items-center justify-center w-10 h-10 text-[#6a7282] bg-white border border-[#e5e7eb] rounded-lg cursor-pointer hover:text-[#dc2626] hover:border-[#fecaca]"
                    aria-label="Remove cover image"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </Field>
            <Field label="Alt text" hint="Describe the image for screen readers">
              <input
                value={post.imageAlt || ""}
                onChange={(e) => update("imageAlt", e.target.value)}
                className="w-full h-10 px-3 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb]"
                placeholder="e.g., A homeowner reviewing a renovation quote on a wooden desk"
              />
            </Field>
            <Field label="Publish date">
              <input
                type="date"
                value={post.publishedOn}
                onChange={(e) => update("publishedOn", e.target.value)}
                className="w-full h-10 px-3 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb]"
              />
            </Field>
            <Field label="Writer">
              <div className="flex items-center gap-3">
                <div
                  className="size-9 rounded-full flex items-center justify-center shrink-0 text-white text-[12px] font-medium"
                  style={{ background: "#101828" }}
                >
                  {post.author.avatar}
                </div>
                <input
                  value={post.author.name}
                  onChange={(e) =>
                    onChange({ ...post, author: { ...post.author, name: e.target.value } })
                  }
                  className="flex-1 h-10 px-3 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb]"
                />
                <input
                  maxLength={2}
                  value={post.author.avatar}
                  onChange={(e) =>
                    onChange({
                      ...post,
                      author: { ...post.author, avatar: e.target.value.toUpperCase().slice(0, 2) },
                    })
                  }
                  className="w-12 h-10 px-2 text-[13px] text-center border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb]"
                  placeholder="NE"
                />
              </div>
            </Field>
            <Field label="Excerpt" hint="Short summary used in card previews and SEO">
              <textarea
                rows={3}
                value={post.excerpt || ""}
                onChange={(e) => update("excerpt", e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb] resize-none"
                placeholder="e.g., This guide breaks down where your renovation budget actually goes."
                maxLength={500}
              />
              <span className="text-[11px] text-[#9ca3af] self-end">
                {(post.excerpt || "").length}/500
              </span>
            </Field>
            <Field label="Read time (minutes)">
              <input
                type="number"
                min={1}
                value={post.readMin}
                onChange={(e) => update("readMin", Math.max(1, Number(e.target.value) || 1))}
                className="w-full h-10 px-3 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb]"
              />
            </Field>
            <Field label="Related posts" hint={`Up to 3 (${(post.relatedSlugs?.length || 0)}/3)`}>
              {(() => {
                const selectedSlugs = post.relatedSlugs || [];
                const selectedPosts = selectedSlugs
                  .map((slug) => related.find((p) => p.slug === slug))
                  .filter((p): p is AdminPost => !!p);
                const q = relatedSearch.trim().toLowerCase();
                const unselectedPosts = related.filter(
                  (p) =>
                    !selectedSlugs.includes(p.slug) &&
                    (q === "" || p.title.toLowerCase().includes(q))
                );
                const atLimit = selectedSlugs.length >= 3;
                return (
                  <div className="flex flex-col gap-1.5">
                    {selectedPosts.length === 0 && (
                      <div className="text-[12px] text-[#9ca3af] italic py-0.5">
                        No related posts yet
                      </div>
                    )}
                    {selectedPosts.map((p) => (
                      <div
                        key={p.slug}
                        className="flex items-center gap-2 px-2.5 py-1.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-md text-[13px]"
                      >
                        <span className="flex-1 truncate text-[#101828]">{p.title}</span>
                        <button
                          type="button"
                          onClick={() =>
                            update(
                              "relatedSlugs",
                              selectedSlugs.filter((s) => s !== p.slug)
                            )
                          }
                          className="text-[#9ca3af] hover:text-[#101828] cursor-pointer shrink-0"
                          aria-label={`Remove ${p.title}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div ref={relatedPickerRef} className="relative">
                      <button
                        type="button"
                        disabled={atLimit}
                        onClick={() => {
                          setRelatedPickerOpen((v) => !v);
                          setRelatedSearch("");
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] border border-dashed rounded-md w-full justify-center transition ${
                          atLimit
                            ? "border-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"
                            : "border-[#cbd5e1] text-[#475467] hover:border-[#2563eb] hover:text-[#2563eb] cursor-pointer"
                        }`}
                      >
                        <Plus size={14} />
                        {atLimit ? "Maximum reached" : "Add related post"}
                      </button>
                      {relatedPickerOpen && !atLimit && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg z-10 max-h-[260px] overflow-hidden flex flex-col">
                          <div className="px-2.5 py-2 border-b border-[#e5e7eb] flex items-center gap-2">
                            <SearchIcon size={13} className="text-[#9ca3af] shrink-0" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Search posts..."
                              value={relatedSearch}
                              onChange={(e) => setRelatedSearch(e.target.value)}
                              className="flex-1 text-[13px] outline-none bg-transparent min-w-0"
                            />
                          </div>
                          <div className="flex-1 overflow-y-auto py-1">
                            {unselectedPosts.length === 0 ? (
                              <div className="px-3 py-3 text-[12px] text-[#9ca3af] text-center">
                                {relatedSearch ? "No matching posts" : "No posts available"}
                              </div>
                            ) : (
                              unselectedPosts.map((p) => (
                                <button
                                  key={p.slug}
                                  type="button"
                                  onClick={() => {
                                    update("relatedSlugs", [...selectedSlugs, p.slug]);
                                    setRelatedSearch("");
                                    setRelatedPickerOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-[#f3f4f6] cursor-pointer truncate text-[#101828]"
                                >
                                  {p.title}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </Field>
            <div className="flex items-center justify-between">
              <Field label="Feature this post">
                <span className="text-[12px] text-[#6a7282]">Pin to the top of the index</span>
              </Field>
              <Toggle
                on={!!post.featured}
                onChange={(v) => update("featured", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Field label="Allow commenting">
                <span className="text-[12px] text-[#6a7282]">Show comment form below the article</span>
              </Field>
              <Toggle
                on={!!post.allowComments}
                onChange={(v) => update("allowComments", v)}
              />
            </div>
          </>
        )}

        {tab === "categories" && (
          <>
            <Field label="Primary category">
              <select
                value={post.category}
                onChange={(e) => update("category", e.target.value as BlogCategory)}
                className="w-full h-10 px-3 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb] bg-white"
              >
                {BLOG_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Additional categories">
              <span className="text-[12px] text-[#6a7282] mb-2">
                Help readers find related posts in more than one bucket.
              </span>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(post.categories || []).map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] rounded-full bg-[#eff6ff] text-[#2563eb]"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => update("categories", (post.categories || []).filter((x) => x !== c))}
                      className="cursor-pointer"
                      aria-label={`Remove ${c}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 h-10 px-3 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb]"
                  placeholder="Add a category"
                  maxLength={35}
                />
                <button
                  type="button"
                  onClick={() => {
                    const v = newCategory.trim();
                    if (!v) return;
                    const cur = post.categories || [];
                    if (!cur.includes(v)) update("categories", [...cur, v]);
                    setNewCategory("");
                  }}
                  className="px-3 h-10 text-[13px] font-medium text-white bg-[#101828] rounded-lg hover:opacity-90 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </Field>
          </>
        )}

        {tab === "tags" && (
          <Field label="Tags" hint="Up to 30 tags">
            <span className="text-[12px] text-[#6a7282] mb-2">
              Create and assign tags to help readers find the blog posts they're looking for.
            </span>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(post.tags || []).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] rounded-full bg-[#f3f4f6] text-[#101828]"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => update("tags", (post.tags || []).filter((x) => x !== t))}
                    className="cursor-pointer"
                    aria-label={`Remove ${t}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value.replace(/^#/, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const v = newTag.trim();
                    if (!v) return;
                    const cur = post.tags || [];
                    if (!cur.includes(v) && cur.length < 30) update("tags", [...cur, v]);
                    setNewTag("");
                  }
                }}
                className="flex-1 h-10 px-3 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb]"
                placeholder="e.g., HDB, budgeting, contracts"
                disabled={(post.tags || []).length >= 30}
              />
              <button
                type="button"
                onClick={() => {
                  const v = newTag.trim();
                  if (!v) return;
                  const cur = post.tags || [];
                  if (!cur.includes(v) && cur.length < 30) update("tags", [...cur, v]);
                  setNewTag("");
                }}
                className="px-3 h-10 text-[13px] font-medium text-white bg-[#101828] rounded-lg hover:opacity-90 cursor-pointer"
              >
                Add
              </button>
            </div>
          </Field>
        )}
      </div>
    </div>
  );
}

// ─── Main editor page ───────────────────────────────────────────
export function AdminBlogEditor() {
  const navigate = useNavigate();
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const isNew = !routeSlug || routeSlug === "new";

  const [allPosts, setAllPosts] = useState<AdminPost[]>(() => getAllPostsForAdmin());
  useEffect(() => subscribe(() => setAllPosts(getAllPostsForAdmin())), []);

  const seed = useMemo<Post>(() => {
    if (isNew) return EMPTY_POST;
    const existing = allPosts.find((p) => p.slug === routeSlug);
    if (!existing) return EMPTY_POST;
    // Strip status/views — not part of the Post shape.
    const { status: _s, views: _v, ...rest } = existing;
    return {
      ...EMPTY_POST,
      ...rest,
      tags: existing.tags || [],
      categories: existing.categories || [],
      relatedSlugs: existing.relatedSlugs || [],
      allowComments: existing.allowComments ?? true,
    };
  }, [allPosts, routeSlug, isNew]);

  const [post, setPost] = useState<Post>(seed);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [activePanel, setActivePanel] = useState<"add" | "settings" | null>("settings");
  const [saving, setSaving] = useState<"idle" | "draft" | "publish">("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [blockStyle, setBlockStyle] = useState<"p" | "h2" | "h3" | "quote">("p");

  // ─── Image picker modal state ────────────────────────────────────
  // Replaces the native window.prompt URL flow with a real file picker
  // (drag-and-drop + click to choose) and optional alt text. The picked
  // file is currently embedded as a base64 data URL so this can ship
  // without a new backend endpoint. TODO: swap to a real Supabase
  // /admin-image-upload endpoint when one is added — the rest of the
  // flow (modal, selection restore, insertion) stays the same.
  type ImagePickerState = {
    open: boolean;
    title: string;
    file: File | null;
    preview: string;
    alt: string;
    savedRange: Range | null;
    error: string;
    // Compression UX — flips true while canvas resize/encode runs so
    // the dropzone can show a "Compressing…" state instead of a stale
    // empty area on a slow phone-camera image.
    processing: boolean;
    originalSize: number;
    compressedSize: number;
    // What to do with the accepted image. Different entry points
    // (body insertion, cover image, settings drawer) pass different
    // callbacks so the same modal can serve every image-add flow.
    // savedRange is forwarded so body-insertion can restore the
    // editor cursor without re-reading stale state.
    onAccept: ((src: string, alt: string, savedRange: Range | null) => void) | null;
  };
  const [imagePicker, setImagePicker] = useState<ImagePickerState>({
    open: false, title: "Add image", file: null, preview: "", alt: "",
    savedRange: null, error: "", processing: false,
    originalSize: 0, compressedSize: 0, onAccept: null,
  });
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ─── Slash command menu (Notion-style block picker) ──────────────
  // Type "/" in the editor → small popover near the caret with the
  // same six insertion options the old Add panel exposed. Filterable
  // by typing after the "/", navigable with arrow keys + Enter,
  // dismissable with Escape or by deleting the trigger char.
  type SlashMenuState = {
    open: boolean;
    rect: { top: number; left: number; bottom: number } | null;
    query: string;
    activeIndex: number;
    // Anchor of the "/" character so we can wipe "/query" on selection.
    anchor: { node: Node; offset: number } | null;
  };
  const [slashMenu, setSlashMenu] = useState<SlashMenuState>({
    open: false, rect: null, query: "", activeIndex: 0, anchor: null,
  });

  // ─── Editor-wide undo / redo history ─────────────────────────────
  // Snapshots cover BOTH the React `post` state (title, slug, lede,
  // settings drawer fields, tags, categories…) AND the contenteditable
  // body HTML, so a single Undo backs out any user-visible change.
  type EditorSnapshot = { post: Post; bodyHtml: string };
  const [history, setHistory] = useState<{ stack: EditorSnapshot[]; index: number }>(
    { stack: [], index: -1 },
  );
  const suppressSnapshotRef = useRef(false);
  const snapshotTimerRef = useRef<number | null>(null);
  const lastSnapshotKeyRef = useRef("");
  const snapshotKey = (s: EditorSnapshot) => JSON.stringify({ p: s.post, b: s.bodyHtml });

  const scheduleSnapshot = useCallback(() => {
    if (suppressSnapshotRef.current) return;
    if (snapshotTimerRef.current) window.clearTimeout(snapshotTimerRef.current);
    snapshotTimerRef.current = window.setTimeout(() => {
      const bodyHtml = bodyRef.current?.innerHTML ?? "";
      const snap: EditorSnapshot = { post, bodyHtml };
      const key = snapshotKey(snap);
      if (key === lastSnapshotKeyRef.current) return;
      lastSnapshotKeyRef.current = key;
      setHistory((h) => {
        const truncated = h.stack.slice(0, h.index + 1);
        const next = [...truncated, snap].slice(-200); // cap at 200 entries
        return { stack: next, index: next.length - 1 };
      });
    }, 450);
  }, [post]);

  // Push a snapshot whenever React state changes (debounced).
  useEffect(() => { scheduleSnapshot(); }, [post, scheduleSnapshot]);

  const restoreSnapshot = useCallback((snap: EditorSnapshot, newIndex: number) => {
    suppressSnapshotRef.current = true;
    setPost(snap.post);
    if (bodyRef.current) bodyRef.current.innerHTML = snap.bodyHtml;
    lastSnapshotKeyRef.current = snapshotKey(snap);
    setHistory((h) => ({ ...h, index: newIndex }));
    // Release the suppression after the next debounce window so the
    // restored state doesn't immediately register as a new snapshot.
    window.setTimeout(() => { suppressSnapshotRef.current = false; }, 600);
  }, []);

  const undo = useCallback(() => {
    if (history.index <= 0) return;
    const snap = history.stack[history.index - 1];
    if (snap) restoreSnapshot(snap, history.index - 1);
  }, [history, restoreSnapshot]);

  const redo = useCallback(() => {
    if (history.index >= history.stack.length - 1) return;
    const snap = history.stack[history.index + 1];
    if (snap) restoreSnapshot(snap, history.index + 1);
  }, [history, restoreSnapshot]);

  const canUndo = history.index > 0;
  const canRedo = history.index < history.stack.length - 1;

  // Seed the contenteditable + reset history whenever the active post
  // changes (route, fresh load, etc.).
  useEffect(() => {
    const bodyHtml = blocksToHtml(seed.body);
    if (bodyRef.current) bodyRef.current.innerHTML = bodyHtml;
    setPost(seed);
    setSlugTouched(!isNew);
    const initial: EditorSnapshot = { post: seed, bodyHtml };
    lastSnapshotKeyRef.current = snapshotKey(initial);
    setHistory({ stack: [initial], index: 0 });
    suppressSnapshotRef.current = true;
    window.setTimeout(() => { suppressSnapshotRef.current = false; }, 600);
  }, [seed, isNew]);

  const updateTitle = (v: string) => {
    setPost((p) => ({ ...p, title: v }));
    if (!slugTouched) setPost((p) => ({ ...p, slug: toSlug(v) }));
  };

  // Reads the current contenteditable HTML and folds it into Block[].
  // Always pulled at save-time so we never carry stale React state.
  const readBody = useCallback(() => {
    const html = bodyRef.current?.innerHTML ?? "";
    return htmlToBlocks(html);
  }, []);

  // Detect the current block style under the cursor so the toolbar
  // dropdown shows the right label.
  const refreshBlockStyle = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node: Node | null = sel.anchorNode;
    while (node && node !== bodyRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const t = (node as HTMLElement).tagName.toLowerCase();
        if (t === "h2") return setBlockStyle("h2");
        if (t === "h3") return setBlockStyle("h3");
        if (t === "blockquote") return setBlockStyle("quote");
        if (t === "p" || t === "div") return setBlockStyle("p");
      }
      node = node.parentNode;
    }
    setBlockStyle("p");
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshBlockStyle);
    return () => document.removeEventListener("selectionchange", refreshBlockStyle);
  }, [refreshBlockStyle]);

  const persist = async (status: "draft" | "published") => {
    const finalSlug = post.slug || toSlug(post.title);
    if (!post.title.trim() || !finalSlug) {
      alert("Please add a title before saving.");
      return;
    }
    setSaving(status === "draft" ? "draft" : "publish");
    const next: Post = { ...post, slug: finalSlug, body: readBody() };
    try {
      await savePost(next, status);
      setSavedAt(new Date());
      if (isNew && finalSlug) navigate(`/admin/blog/edit/${finalSlug}`, { replace: true });
    } catch (err) {
      console.error(err);
      alert("Save failed. Check the console for details.");
    } finally {
      setSaving("idle");
    }
  };

  const handleInsertSnippet = (html: string) => {
    bodyRef.current?.focus();
    insertHtmlAtCursor(html);
  };

  // ─── Image picker handlers ──────────────────────────────────────
  const closeImagePicker = () =>
    setImagePicker({
      open: false, title: "Add image", file: null, preview: "", alt: "",
      savedRange: null, error: "", processing: false,
      originalSize: 0, compressedSize: 0, onAccept: null,
    });

  // Generic opener — any flow can pop the modal by passing what to do
  // with the accepted image. The body-insertion flow also captures the
  // current cursor range so it can be restored after the modal closes.
  const openImagePicker = (opts: {
    title?: string;
    initialAlt?: string;
    captureSelection?: boolean;
    onAccept: (src: string, alt: string, savedRange: Range | null) => void;
  }) => {
    let savedRange: Range | null = null;
    if (opts.captureSelection) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && bodyRef.current?.contains(sel.anchorNode)) {
        savedRange = sel.getRangeAt(0).cloneRange();
      }
    }
    setImagePicker({
      open: true,
      title: opts.title || "Add image",
      file: null,
      preview: "",
      alt: opts.initialAlt || "",
      savedRange,
      error: "",
      processing: false,
      originalSize: 0,
      compressedSize: 0,
      onAccept: opts.onAccept,
    });
  };

  // Body-content image entry point — used by the slash command, the
  // toolbar Image button, and the legacy Add panel. Inserts a <figure>
  // at the saved cursor position when the user accepts.
  const handleImagePrompt = () => {
    openImagePicker({
      title: "Add image",
      captureSelection: true,
      onAccept: (src, alt, savedRange) => {
        const safeAlt = alt.replace(/"/g, "&quot;");
        // Defer one tick so React unmounts the modal before we touch
        // selection/focus on the contenteditable.
        setTimeout(() => {
          bodyRef.current?.focus();
          if (savedRange) {
            const s = window.getSelection();
            s?.removeAllRanges();
            s?.addRange(savedRange);
          }
          insertHtmlAtCursor(
            `<figure data-block="image"><img src="${src}" alt="${safeAlt}" /></figure><p><br /></p>`,
          );
        }, 0);
      },
    });
  };

  // Cover image entry point — used by the canvas's "Add a cover image"
  // button (and is the same target as the Settings drawer image field).
  const handleCoverImagePrompt = () => {
    openImagePicker({
      title: post.image ? "Change cover image" : "Add cover image",
      initialAlt: post.imageAlt || "",
      onAccept: (src, alt) => {
        setPost((p) => ({ ...p, image: src, imageAlt: alt || p.imageAlt || "" }));
      },
    });
  };

  const acceptImageFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImagePicker((s) => ({ ...s, error: "Please choose an image file (jpg, png, gif, webp)." }));
      return;
    }
    // Hard cap before compression. Most phone camera shots land under
    // 10MB; the canvas resize step then squashes them down further.
    if (file.size > 10 * 1024 * 1024) {
      setImagePicker((s) => ({ ...s, error: "Image must be under 10MB." }));
      return;
    }
    // Flip to processing state so the dropzone shows "Compressing…".
    setImagePicker((s) => ({
      ...s, processing: true, error: "", originalSize: file.size, compressedSize: 0,
    }));
    try {
      const compressed = await compressImageFile(file);
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(compressed);
      });
      setImagePicker((s) => ({
        ...s,
        file: compressed,
        preview,
        processing: false,
        compressedSize: compressed.size,
        error: "",
      }));
    } catch {
      setImagePicker((s) => ({
        ...s, processing: false, error: "Couldn't process that file. Try another.",
      }));
    }
  };

  const handleImagePickerFile = (e: React.ChangeEvent<HTMLInputElement>) =>
    acceptImageFile(e.target.files?.[0] ?? null);

  const handleImagePickerDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    acceptImageFile(e.dataTransfer.files?.[0] ?? null);
  };

  const confirmImageInsert = () => {
    if (!imagePicker.preview || !imagePicker.onAccept) return;
    const src = imagePicker.preview;
    const alt = imagePicker.alt;
    const onAccept = imagePicker.onAccept;
    const savedRange = imagePicker.savedRange;
    closeImagePicker();
    onAccept(src, alt, savedRange);
  };

  // ─── Slash menu helpers ─────────────────────────────────────────
  type SlashItem = {
    icon: typeof ImageIcon;
    label: string;
    keywords: string;
    run: () => void;
  };
  const SLASH_ITEMS: SlashItem[] = useMemo(() => [
    { icon: Heading2, label: "Heading", keywords: "heading h2 title", run: () => handleInsertSnippet("<h2>New section heading</h2>") },
    { icon: TypeIcon, label: "Paragraph", keywords: "paragraph p text body", run: () => handleInsertSnippet("<p>A new paragraph of body copy.</p>") },
    { icon: ListIcon, label: "List", keywords: "list ul bullet", run: () => handleInsertSnippet("<ul><li>First item</li><li>Second item</li></ul>") },
    { icon: Quote, label: "Quote", keywords: "quote blockquote", run: () => handleInsertSnippet("<blockquote>A quotation that emphasises a key idea.</blockquote>") },
    { icon: Minus, label: "Divider", keywords: "divider hr line", run: () => handleInsertSnippet("<hr />") },
    { icon: ImageIcon, label: "Image", keywords: "image picture photo img", run: () => handleImagePrompt() },
    // intentionally not arrow deps — handlers are stable enough for the menu's lifetime
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredSlashItems = useMemo(() => {
    const q = slashMenu.query.trim().toLowerCase();
    if (!q) return SLASH_ITEMS;
    return SLASH_ITEMS.filter((it) =>
      it.label.toLowerCase().includes(q) || it.keywords.includes(q),
    );
  }, [SLASH_ITEMS, slashMenu.query]);

  const closeSlashMenu = () =>
    setSlashMenu({ open: false, rect: null, query: "", activeIndex: 0, anchor: null });

  // Wipe the "/query" the user typed before inserting the block.
  const removeSlashTrigger = () => {
    if (!slashMenu.anchor) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    try {
      const range = document.createRange();
      range.setStart(slashMenu.anchor.node, slashMenu.anchor.offset);
      range.setEnd(sel.anchorNode!, sel.anchorOffset);
      range.deleteContents();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch { /* anchor may have been detached — fall through */ }
  };

  const runSlashItem = (item: SlashItem) => {
    removeSlashTrigger();
    closeSlashMenu();
    // Defer so the deletion commits before insertion runs.
    setTimeout(() => item.run(), 0);
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (slashMenu.open) {
      if (e.key === "Escape") { e.preventDefault(); closeSlashMenu(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashMenu((s) => ({ ...s, activeIndex: Math.min(s.activeIndex + 1, Math.max(filteredSlashItems.length - 1, 0)) }));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashMenu((s) => ({ ...s, activeIndex: Math.max(s.activeIndex - 1, 0) }));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = filteredSlashItems[slashMenu.activeIndex];
        if (item) runSlashItem(item);
        return;
      }
    }
    if (e.key === "/" && !slashMenu.open) {
      // Open menu after the "/" is committed to the DOM.
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        // Anchor one char back so we can later delete "/query" cleanly.
        const node = sel.anchorNode;
        const offset = Math.max(0, sel.anchorOffset - 1);
        if (!node) return;
        setSlashMenu({
          open: true,
          rect: { top: rect.top, left: rect.left, bottom: rect.bottom },
          query: "",
          activeIndex: 0,
          anchor: { node, offset },
        });
      }, 0);
    }
  };

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    scheduleSnapshot(e);
    if (!slashMenu.open || !slashMenu.anchor) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    try {
      const range = document.createRange();
      range.setStart(slashMenu.anchor.node, slashMenu.anchor.offset);
      range.setEnd(sel.anchorNode!, sel.anchorOffset);
      const text = range.toString();
      if (!text.startsWith("/") || /[\s\n]/.test(text)) {
        closeSlashMenu();
        return;
      }
      const query = text.slice(1);
      setSlashMenu((s) => ({ ...s, query, activeIndex: 0 }));
    } catch {
      closeSlashMenu();
    }
  };

  // ─── Toolbar actions ────────────────────────────────────────
  const setBlock = (style: "p" | "h2" | "h3" | "quote") => {
    bodyRef.current?.focus();
    if (style === "quote") exec("formatBlock", "blockquote");
    else if (style === "h2") exec("formatBlock", "h2");
    else if (style === "h3") exec("formatBlock", "h3");
    else exec("formatBlock", "p");
    setBlockStyle(style);
  };
  const toggleBold = () => { bodyRef.current?.focus(); exec("bold"); };
  const toggleItalic = () => { bodyRef.current?.focus(); exec("italic"); };
  const toggleUnderline = () => { bodyRef.current?.focus(); exec("underline"); };
  const insertUL = () => { bodyRef.current?.focus(); exec("insertUnorderedList"); };
  const insertOL = () => { bodyRef.current?.focus(); exec("insertOrderedList"); };
  const align = (dir: "Left" | "Center" | "Right") => {
    bodyRef.current?.focus();
    exec(`justify${dir}`);
  };
  const addLink = () => {
    const url = window.prompt("Link URL", "https://");
    if (!url) return;
    bodyRef.current?.focus();
    exec("createLink", url);
  };
  const removeFormat = () => { bodyRef.current?.focus(); exec("removeFormat"); };

  // Captures the active selection range so toolbar controls that pull
  // focus away from the contenteditable (native <select> elements,
  // window.prompt) can still operate on the user's highlight.
  const savedRangeRef = useRef<Range | null>(null);
  const captureSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const r = sel.getRangeAt(0);
    if (!bodyRef.current?.contains(r.commonAncestorContainer)) return;
    savedRangeRef.current = r.cloneRange();
  };
  const restoreSelection = (): Range | null => {
    const r = savedRangeRef.current;
    if (!r) return null;
    const sel = window.getSelection();
    if (!sel) return null;
    sel.removeAllRanges();
    sel.addRange(r);
    return r;
  };

  // Wraps the saved selection in a span with an explicit pixel size.
  // Skips no-op cases (nothing selected) so the dropdown doesn't apply to
  // an empty caret position.
  const applyFontSize = (px: number) => {
    const range = restoreSelection();
    if (!range || range.collapsed) return;
    const span = document.createElement("span");
    span.style.fontSize = `${px}px`;
    span.appendChild(range.extractContents());
    range.insertNode(span);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      const after = document.createRange();
      after.selectNodeContents(span);
      after.collapse(false);
      sel.addRange(after);
      // Refresh saved range so consecutive size picks still target the
      // same span (collapsed at its end now).
      savedRangeRef.current = after.cloneRange();
    }
  };

  const relatedCandidates = allPosts.filter((p) => p.slug !== post.slug);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f3f4f6]">
      <style>{`
        .blog-editor-canvas { font-family: 'DM Sans', system-ui, sans-serif; color: #101828; font-size: 17px; line-height: 1.7; }
        .blog-editor-canvas:empty::before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
        .blog-editor-canvas > * { margin: 0 0 1em; }
        .blog-editor-canvas h2 { font-size: 28px; font-weight: 700; line-height: 1.25; margin-top: 1.5em; }
        .blog-editor-canvas h3 { font-size: 22px; font-weight: 700; line-height: 1.3; margin-top: 1.25em; }
        .blog-editor-canvas p { font-size: 17px; line-height: 1.7; }
        .blog-editor-canvas blockquote {
          border-left: 3px solid #101828; padding-left: 16px; margin-left: 0;
          font-style: italic; color: #475569; font-size: 18px;
        }
        .blog-editor-canvas ul, .blog-editor-canvas ol { padding-left: 24px; }
        .blog-editor-canvas li { margin: 0.25em 0; }
        .blog-editor-canvas a { color: #2563eb; text-decoration: underline; }
        .blog-editor-canvas hr { border: none; border-top: 1px solid #e5e7eb; margin: 2em 0; }
        .blog-editor-canvas figure { margin: 1.5em 0; }
        .blog-editor-canvas figure img { width: 100%; border-radius: 12px; display: block; }
        .blog-editor-canvas img { max-width: 100%; border-radius: 12px; }
      `}</style>
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="h-[56px] shrink-0 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[13px] text-[#6a7282] hover:text-[#101828] cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <span className="w-px h-5 bg-[#e5e7eb] mx-1.5" />
          <button
            type="button"
            title="Undo"
            aria-label="Undo"
            disabled={!canUndo}
            onMouseDown={(e) => e.preventDefault()}
            onClick={undo}
            className="inline-flex items-center justify-center size-8 text-[#6a7282] hover:text-[#101828] hover:bg-[#f3f4f6] rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Undo2 size={16} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            title="Redo"
            aria-label="Redo"
            disabled={!canRedo}
            onMouseDown={(e) => e.preventDefault()}
            onClick={redo}
            className="inline-flex items-center justify-center size-8 text-[#6a7282] hover:text-[#101828] hover:bg-[#f3f4f6] rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <Redo2 size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Center toolbar — lightweight status indicator only. */}
        <div className="hidden md:flex items-center gap-3 text-[13px] text-[#6a7282]">
          <span>
            {savedAt
              ? `Saved · ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : isNew
                ? "Unsaved"
                : "All changes saved"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && post.slug && (
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 h-9 text-[13px] text-[#6a7282] hover:text-[#101828] cursor-pointer"
              title="Preview the published article"
            >
              <Eye size={14} /> Preview
            </a>
          )}
          <button
            type="button"
            onClick={() => persist("draft")}
            disabled={saving !== "idle"}
            className="px-3 h-9 text-[13px] font-medium text-[#2563eb] hover:bg-[#eff6ff] rounded-lg cursor-pointer disabled:opacity-50"
          >
            {saving === "draft" ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => persist("published")}
            disabled={saving !== "idle"}
            className="inline-flex items-center gap-1.5 px-4 h-9 text-[13px] font-medium text-white bg-[#2563eb] hover:opacity-90 rounded-lg cursor-pointer disabled:opacity-50"
          >
            {saving === "publish" ? "Publishing…" : "Publish"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* ── Left sidebar ───────────────────────────────────── */}
        <aside className="w-[88px] shrink-0 bg-white border-r border-[#e5e7eb] flex flex-col items-stretch py-3 gap-1">
          <SideButton
            icon={Plus}
            label="Add"
            active={activePanel === "add"}
            onClick={() => setActivePanel(activePanel === "add" ? null : "add")}
          />
          <SideButton
            icon={SettingsIcon}
            label="Settings"
            active={activePanel === "settings"}
            onClick={() => setActivePanel(activePanel === "settings" ? null : "settings")}
          />
          <SideButton icon={SearchIcon} label="SEO" disabled />
        </aside>

        {/* ── Optional Add panel ────────────────────────────── */}
        {activePanel === "add" && (
          <AddPanel
            onInsert={handleInsertSnippet}
            onImagePrompt={handleImagePrompt}
            onClose={() => setActivePanel(null)}
          />
        )}

        {/* ── Canvas ────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto py-10 px-6 md:px-12">
          <div className="max-w-[820px] mx-auto bg-white rounded-2xl border border-[#e5e7eb] p-8 md:p-12 shadow-sm">
            {/* Title — auto-grows with content so long titles never scroll. */}
            <textarea
              ref={(el) => {
                if (!el) return;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
              value={post.title}
              onChange={(e) => {
                updateTitle(e.target.value);
                e.currentTarget.style.height = "auto";
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              }}
              placeholder="Article title…"
              rows={1}
              className="w-full text-[40px] md:text-[42px] font-bold leading-[1.15] m-0 mb-6 outline-none resize-none border-0 overflow-hidden"
              style={{ color: "#101828", fontFamily: "'DM Sans', sans-serif" }}
            />

            {/* Featured image */}
            {post.image ? (
              <div className="relative group mb-6">
                <img
                  src={post.image}
                  alt={post.imageAlt || ""}
                  className="w-full aspect-[16/9] object-cover rounded-xl border border-[#e5e7eb]"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCoverImagePrompt}
                    className="inline-flex items-center gap-1 px-3 h-8 text-[12px] bg-white/90 border border-[#e5e7eb] rounded-lg cursor-pointer hover:bg-white"
                  >
                    <ImageIcon size={12} /> Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setPost((p) => ({ ...p, image: "" }))}
                    className="inline-flex items-center gap-1 px-3 h-8 text-[12px] bg-white/90 border border-[#e5e7eb] rounded-lg cursor-pointer hover:bg-white"
                  >
                    <X size={12} /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCoverImagePrompt}
                className="w-full aspect-[16/9] flex flex-col items-center justify-center gap-2 mb-6 border-2 border-dashed border-[#e5e7eb] rounded-xl text-[#6a7282] hover:border-[#2563eb] hover:text-[#2563eb] cursor-pointer transition-colors"
              >
                <ImageIcon size={28} strokeWidth={1.6} />
                <span className="text-[13px]">Add a cover image</span>
              </button>
            )}

            <div className="my-6 h-px bg-[#e5e7eb]" />

            {/* ── Rich text formatting toolbar ────────────────── */}
            <div
              className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 px-2 py-2 mb-4 bg-white border border-[#e5e7eb] rounded-lg"
            >
              {/* Block style dropdown */}
              <div className="relative">
                <select
                  value={blockStyle}
                  onChange={(e) => setBlock(e.target.value as "p" | "h2" | "h3" | "quote")}
                  className="h-8 pl-2 pr-7 text-[13px] border-0 outline-none bg-transparent cursor-pointer hover:bg-[#f3f4f6] rounded-md appearance-none"
                  style={{ minWidth: 110 }}
                >
                  <option value="p">Paragraph</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                  <option value="quote">Quote</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>

              <span className="w-px h-5 bg-[#e5e7eb] mx-1" />

              {/* Font size — wraps the current selection in a span with an
                  explicit pixel size. Default value (18) matches body copy
                  so the dropdown reads sensibly with nothing applied yet.
                  onMouseDown captures the current highlight before the
                  native dropdown opens and steals focus from the canvas. */}
              <div className="relative">
                <select
                  defaultValue="18"
                  onMouseDown={captureSelection}
                  onFocus={captureSelection}
                  onChange={(e) => {
                    const size = Number(e.target.value);
                    if (Number.isFinite(size)) applyFontSize(size);
                    e.currentTarget.value = "18";
                  }}
                  className="h-8 pl-2 pr-7 text-[13px] border-0 outline-none bg-transparent cursor-pointer hover:bg-[#f3f4f6] rounded-md appearance-none"
                  style={{ minWidth: 60 }}
                  title="Font size — select text first"
                  aria-label="Font size"
                >
                  {[12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>

              <span className="w-px h-5 bg-[#e5e7eb] mx-1" />

              <ToolbarButton label="Bold" onClick={toggleBold}><Bold size={14} strokeWidth={2} /></ToolbarButton>
              <ToolbarButton label="Italic" onClick={toggleItalic}><Italic size={14} strokeWidth={2} /></ToolbarButton>
              <ToolbarButton label="Underline" onClick={toggleUnderline}><UnderlineIcon size={14} strokeWidth={2} /></ToolbarButton>
              <ToolbarButton label="Clear formatting" onClick={removeFormat}><Code size={14} strokeWidth={2} /></ToolbarButton>

              <span className="w-px h-5 bg-[#e5e7eb] mx-1" />

              <ToolbarButton label="Link" onClick={addLink}><LinkIcon size={14} strokeWidth={2} /></ToolbarButton>
              <ToolbarButton label="Quote" onClick={() => setBlock("quote")}><Quote size={14} strokeWidth={2} /></ToolbarButton>

              <span className="w-px h-5 bg-[#e5e7eb] mx-1" />

              <ToolbarButton label="Bulleted list" onClick={insertUL}><ListIcon size={14} strokeWidth={2} /></ToolbarButton>
              <ToolbarButton label="Numbered list" onClick={insertOL}><ListOrdered size={14} strokeWidth={2} /></ToolbarButton>

              <span className="w-px h-5 bg-[#e5e7eb] mx-1" />

              <ToolbarButton label="Align left" onClick={() => align("Left")}><AlignLeft size={14} strokeWidth={2} /></ToolbarButton>
              <ToolbarButton label="Align center" onClick={() => align("Center")}><AlignCenter size={14} strokeWidth={2} /></ToolbarButton>
              <ToolbarButton label="Align right" onClick={() => align("Right")}><AlignRight size={14} strokeWidth={2} /></ToolbarButton>

              <span className="w-px h-5 bg-[#e5e7eb] mx-1" />

              <ToolbarButton label="Image" onClick={handleImagePrompt}><ImageIcon size={14} strokeWidth={2} /></ToolbarButton>
              <ToolbarButton label="Divider" onClick={() => handleInsertSnippet("<hr />")}><Minus size={14} strokeWidth={2} /></ToolbarButton>
            </div>

            {/* ── Body — contenteditable canvas ───────────────── */}
            <div
              ref={bodyRef}
              contentEditable
              suppressContentEditableWarning
              spellCheck
              className="blog-editor-canvas outline-none min-h-[400px]"
              onKeyDown={handleEditorKeyDown}
              onKeyUp={refreshBlockStyle}
              onMouseUp={refreshBlockStyle}
              onInput={handleEditorInput}
              data-placeholder="Tell your story…"
            />
          </div>
        </main>

        {/* ── Image picker modal ───────────────────────────── */}
        {imagePicker.open && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add image"
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeImagePicker(); }}
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[480px] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-[#101828] m-0">{imagePicker.title}</h3>
                <button
                  type="button"
                  onClick={closeImagePicker}
                  className="p-1 text-[#6a7282] hover:text-[#101828] cursor-pointer"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* Dropzone / preview */}
                {imagePicker.processing ? (
                  <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 border-2 border-dashed border-[#cbd5e1] rounded-lg text-center">
                    <div className="w-7 h-7 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
                    <div className="text-[13px] text-[#101828] font-medium">Compressing image…</div>
                    {imagePicker.originalSize > 0 && (
                      <div className="text-[11px] text-[#6a7282]">
                        Original: {formatFileSize(imagePicker.originalSize)}
                      </div>
                    )}
                  </div>
                ) : imagePicker.preview ? (
                  <div>
                    <div className="relative group">
                      <img
                        src={imagePicker.preview}
                        alt=""
                        className="w-full max-h-[280px] object-contain bg-[#f9fafb] border border-[#e5e7eb] rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setImagePicker((s) => ({ ...s, file: null, preview: "", error: "", originalSize: 0, compressedSize: 0 }))}
                        className="absolute top-2 right-2 inline-flex items-center gap-1 px-2.5 h-7 text-[12px] bg-white/95 border border-[#e5e7eb] rounded-md cursor-pointer hover:bg-white"
                      >
                        <X size={12} /> Change
                      </button>
                    </div>
                    {imagePicker.originalSize > 0 && imagePicker.compressedSize > 0 && (
                      <div className="mt-2 text-[11px] text-[#6a7282] flex items-center justify-between">
                        {imagePicker.compressedSize < imagePicker.originalSize ? (
                          <span>
                            <span className="text-[#16a34a] font-medium">Compressed</span>
                            {" "}{formatFileSize(imagePicker.originalSize)}
                            {" → "}{formatFileSize(imagePicker.compressedSize)}
                            {" "}<span className="text-[#9ca3af]">({Math.round((1 - imagePicker.compressedSize / imagePicker.originalSize) * 100)}% smaller)</span>
                          </span>
                        ) : (
                          <span>{formatFileSize(imagePicker.compressedSize)} · already optimised</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleImagePickerDrop}
                    className="flex flex-col items-center justify-center gap-2 px-4 py-10 border-2 border-dashed border-[#cbd5e1] rounded-lg cursor-pointer hover:border-[#2563eb] hover:bg-[#eff6ff] transition-colors text-center"
                  >
                    <ImageIcon size={28} strokeWidth={1.6} className="text-[#6a7282]" />
                    <div className="text-[14px] font-medium text-[#101828]">
                      Choose image from your computer
                    </div>
                    <div className="text-[12px] text-[#6a7282]">
                      or drag and drop · PNG, JPG, GIF, WEBP up to 10MB
                    </div>
                    <div className="text-[11px] text-[#9ca3af] mt-1">
                      Auto-compressed to keep your post lightweight
                    </div>
                  </div>
                )}

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagePickerFile}
                  className="hidden"
                />

                {imagePicker.error && (
                  <div className="text-[12px] text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-md px-3 py-2">
                    {imagePicker.error}
                  </div>
                )}

                {/* Alt text */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[#101828]">
                    Alt text <span className="text-[#9ca3af] font-normal">(for accessibility & SEO)</span>
                  </span>
                  <input
                    type="text"
                    value={imagePicker.alt}
                    onChange={(e) => setImagePicker((s) => ({ ...s, alt: e.target.value }))}
                    placeholder="e.g., A modern HDB living room with cove lighting"
                    className="w-full h-10 px-3 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb]"
                  />
                </label>
              </div>

              <div className="px-5 py-3 border-t border-[#e5e7eb] flex items-center justify-end gap-2 bg-[#f9fafb]">
                <button
                  type="button"
                  onClick={closeImagePicker}
                  className="px-4 h-9 text-[13px] font-medium text-[#101828] bg-white border border-[#e5e7eb] rounded-lg cursor-pointer hover:bg-[#f3f4f6]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!imagePicker.preview || imagePicker.processing}
                  onClick={confirmImageInsert}
                  className={`px-4 h-9 text-[13px] font-medium text-white rounded-lg ${imagePicker.preview && !imagePicker.processing ? "bg-[#2563eb] hover:bg-[#1d4ed8] cursor-pointer" : "bg-[#cbd5e1] cursor-not-allowed"}`}
                >
                  Insert image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Slash command popover ────────────────────────── */}
        {slashMenu.open && slashMenu.rect && (
          <div
            role="listbox"
            aria-label="Insert block"
            className="fixed z-50 bg-white border border-[#e5e7eb] rounded-lg shadow-lg overflow-hidden"
            style={{
              top: slashMenu.rect.bottom + 6,
              left: slashMenu.rect.left,
              minWidth: 220,
              maxHeight: 320,
            }}
            onMouseDown={(e) => e.preventDefault() /* keep editor focus */}
          >
            <div className="px-3 py-2 border-b border-[#e5e7eb] text-[11px] uppercase tracking-wider text-[#9ca3af]">
              {slashMenu.query ? `Matching "${slashMenu.query}"` : "Insert block"}
            </div>
            <div className="flex flex-col py-1 overflow-y-auto" style={{ maxHeight: 270 }}>
              {filteredSlashItems.length === 0 ? (
                <div className="px-3 py-3 text-[12px] text-[#9ca3af] text-center">No matching blocks</div>
              ) : (
                filteredSlashItems.map((item, idx) => {
                  const Icon = item.icon;
                  const active = idx === slashMenu.activeIndex;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onMouseEnter={() => setSlashMenu((s) => ({ ...s, activeIndex: idx }))}
                      onClick={() => runSlashItem(item)}
                      className={`flex items-center gap-2.5 px-3 py-2 text-[13px] text-left cursor-pointer ${active ? "bg-[#eff6ff] text-[#2563eb]" : "text-[#101828] hover:bg-[#f3f4f6]"}`}
                    >
                      <Icon size={15} strokeWidth={1.8} className="shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── Right settings drawer ─────────────────────────── */}
        {activePanel === "settings" && (
          <SettingsDrawer
            post={post}
            related={relatedCandidates}
            onChange={setPost}
            onClose={() => setActivePanel(null)}
            onPickCoverImage={handleCoverImagePrompt}
          />
        )}
      </div>
    </div>
  );
}
