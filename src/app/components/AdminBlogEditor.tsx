import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Plus,
  Settings as SettingsIcon,
  Image as ImageIcon,
  Search as SearchIcon,
  Type as TypeIcon,
  Heading2,
  Quote,
  List as ListIcon,
  Minus,
  CheckCircle2,
  Eye,
  X,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import {
  getAllPostsForAdmin,
  savePost,
  toSlug,
  BLOG_CATEGORIES,
  subscribe,
  type AdminPost,
} from "./blog/blogStore";
import type { Post, Block, BlogCategory } from "./blog/posts";

// ─── Body block helpers (markdown-lite plain text <-> Block[]) ────
function bodyToText(body: Block[]): string {
  return body
    .map((b) => {
      if (b.type === "h2") return `## ${b.text}`;
      if (b.type === "p") return b.text;
      if (b.type === "ul") return b.items.map((i) => `- ${i}`).join("\n");
      if (b.type === "quote") return `> ${b.text}`;
      return "";
    })
    .join("\n\n");
}

function textToBody(text: string): Block[] {
  const blocks: Block[] = [];
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  for (const para of paragraphs) {
    if (para.startsWith("## ")) blocks.push({ type: "h2", text: para.slice(3).trim() });
    else if (para.startsWith("> ")) blocks.push({ type: "quote", text: para.slice(2).trim() });
    else if (para.split("\n").every((l) => l.trim().startsWith("- "))) {
      blocks.push({
        type: "ul",
        items: para.split("\n").map((l) => l.trim().slice(2).trim()).filter(Boolean),
      });
    } else blocks.push({ type: "p", text: para });
  }
  return blocks;
}

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
function insertAtCursor(
  textarea: HTMLTextAreaElement | null,
  snippet: string,
  setter: (val: string) => void,
) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const current = textarea.value;
  const before = current.slice(0, start);
  const after = current.slice(end);
  // Ensure surrounding blank lines so markdown-lite parser splits paragraphs.
  const padBefore = before.length === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const padAfter = after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  const next = before + padBefore + snippet + padAfter + after;
  setter(next);
  // Restore selection just after the inserted snippet.
  requestAnimationFrame(() => {
    const pos = (before + padBefore + snippet).length;
    textarea.focus();
    textarea.setSelectionRange(pos, pos);
  });
}

// ─── Add panel (popover-style) ───────────────────────────────────
function AddPanel({
  onInsert, onImagePrompt, onClose,
}: {
  onInsert: (snippet: string) => void;
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
      action: () => { onInsert("## New section heading"); onClose(); },
    },
    {
      icon: TypeIcon,
      label: "Paragraph",
      action: () => { onInsert("A new paragraph of body copy."); onClose(); },
    },
    {
      icon: ListIcon,
      label: "List",
      action: () => { onInsert("- First item\n- Second item\n- Third item"); onClose(); },
    },
    {
      icon: Quote,
      label: "Quote",
      action: () => { onInsert("> A quotation that emphasises a key idea."); onClose(); },
    },
    {
      icon: Minus,
      label: "Divider",
      action: () => { onInsert("---"); onClose(); },
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
  post, related, onChange, onClose,
}: {
  post: Post;
  related: AdminPost[];
  onChange: (next: Post) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"general" | "categories" | "tags">("general");
  const update = <K extends keyof Post>(key: K, value: Post[K]) =>
    onChange({ ...post, [key]: value });

  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");

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
            <Field label="Image URL">
              <input
                value={post.image}
                onChange={(e) => update("image", e.target.value)}
                className="w-full h-10 px-3 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb]"
                placeholder="https://…"
              />
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
              <div className="flex flex-col gap-1.5">
                {related.slice(0, 8).map((p) => {
                  const checked = post.relatedSlugs?.includes(p.slug) || false;
                  const disabled = !checked && (post.relatedSlugs?.length || 0) >= 3;
                  return (
                    <label
                      key={p.slug}
                      className={`flex items-center gap-2 text-[13px] cursor-pointer ${disabled ? "opacity-40" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={(e) => {
                          const cur = post.relatedSlugs || [];
                          if (e.target.checked) update("relatedSlugs", [...cur, p.slug]);
                          else update("relatedSlugs", cur.filter((s) => s !== p.slug));
                        }}
                      />
                      <span className="truncate">{p.title}</span>
                    </label>
                  );
                })}
              </div>
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
  const [bodyText, setBodyText] = useState(() => bodyToText(seed.body));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [activePanel, setActivePanel] = useState<"add" | "settings" | null>("settings");
  const [saving, setSaving] = useState<"idle" | "draft" | "publish">("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  // Reseed when the route or underlying data changes.
  useEffect(() => {
    setPost(seed);
    setBodyText(bodyToText(seed.body));
    setSlugTouched(!isNew);
  }, [seed, isNew]);

  const updateTitle = (v: string) => {
    setPost((p) => ({ ...p, title: v }));
    if (!slugTouched) setPost((p) => ({ ...p, slug: toSlug(v) }));
  };

  const persist = async (status: "draft" | "published") => {
    const finalSlug = post.slug || toSlug(post.title);
    if (!post.title.trim() || !finalSlug) {
      alert("Please add a title before saving.");
      return;
    }
    setSaving(status === "draft" ? "draft" : "publish");
    const next: Post = { ...post, slug: finalSlug, body: textToBody(bodyText) };
    try {
      await savePost(next, status);
      setSavedAt(new Date());
      // If we created a new post, route to its slug so refresh works.
      if (isNew && finalSlug) navigate(`/admin/blog/edit/${finalSlug}`, { replace: true });
    } catch (err) {
      console.error(err);
      alert("Save failed. Check the console for details.");
    } finally {
      setSaving("idle");
    }
  };

  const handleInsertSnippet = (snippet: string) => {
    insertAtCursor(bodyRef.current, snippet, setBodyText);
  };

  const handleImagePrompt = () => {
    const url = window.prompt("Image URL", "");
    if (!url) return;
    insertAtCursor(
      bodyRef.current,
      `![image](${url.trim()})`,
      setBodyText,
    );
  };

  const relatedCandidates = allPosts.filter((p) => p.slug !== post.slug);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f3f4f6]">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="h-[56px] shrink-0 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[13px] text-[#6a7282] hover:text-[#101828] cursor-pointer"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Center toolbar — lightweight status indicator only. */}
        <div className="hidden md:flex items-center gap-3 text-[13px] text-[#6a7282]">
          <span className="inline-flex items-center gap-1">
            Paragraph <ChevronDown size={12} />
          </span>
          <span>18</span>
          <span className="w-px h-5 bg-[#e5e7eb]" />
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
            {/* Title */}
            <textarea
              value={post.title}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder="Article title…"
              rows={2}
              className="w-full text-[40px] md:text-[42px] font-bold leading-[1.15] m-0 outline-none resize-none border-0"
              style={{ color: "#101828", fontFamily: "'DM Sans', sans-serif" }}
            />

            {/* Slug */}
            <div className="mt-1 mb-6 flex items-center gap-2 text-[12px] text-[#6a7282] font-mono">
              <span>/blog/</span>
              <input
                value={post.slug}
                onChange={(e) => {
                  setPost((p) => ({ ...p, slug: toSlug(e.target.value) }));
                  setSlugTouched(true);
                }}
                placeholder="article-url-slug"
                className="flex-1 px-2 py-1 text-[12px] font-mono border border-transparent hover:border-[#e5e7eb] focus:border-[#2563eb] rounded outline-none"
              />
            </div>

            {/* Featured image */}
            {post.image ? (
              <div className="relative group mb-6">
                <img
                  src={post.image}
                  alt={post.imageAlt || ""}
                  className="w-full aspect-[16/9] object-cover rounded-xl border border-[#e5e7eb]"
                />
                <button
                  type="button"
                  onClick={() => setPost((p) => ({ ...p, image: "" }))}
                  className="absolute top-3 right-3 inline-flex items-center gap-1 px-3 h-8 text-[12px] bg-white/90 border border-[#e5e7eb] rounded-lg cursor-pointer hover:bg-white"
                >
                  <X size={12} /> Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const url = window.prompt("Cover image URL", "");
                  if (url) setPost((p) => ({ ...p, image: url.trim() }));
                }}
                className="w-full aspect-[16/9] flex flex-col items-center justify-center gap-2 mb-6 border-2 border-dashed border-[#e5e7eb] rounded-xl text-[#6a7282] hover:border-[#2563eb] hover:text-[#2563eb] cursor-pointer transition-colors"
              >
                <ImageIcon size={28} strokeWidth={1.6} />
                <span className="text-[13px]">Add a cover image</span>
              </button>
            )}

            {/* Lede */}
            <textarea
              value={post.lede}
              onChange={(e) => setPost((p) => ({ ...p, lede: e.target.value }))}
              placeholder="A short, punchy lede that pulls the reader in…"
              rows={2}
              className="w-full text-[17px] leading-[1.5] m-0 mb-6 outline-none resize-none border-0"
              style={{ color: "#475569" }}
            />

            {/* Card description (separate from lede — used in cards/SEO) */}
            <Field label="Card description">
              <textarea
                value={post.description}
                onChange={(e) => setPost((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb] resize-none"
                placeholder="Short summary shown on the blog index card."
              />
            </Field>

            <div className="my-6 h-px bg-[#e5e7eb]" />

            {/* Block insert toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6a7282] mr-2">
                Insert
              </span>
              {[
                { label: "Heading", snippet: "## New section heading", icon: Heading2 },
                { label: "Paragraph", snippet: "A new paragraph of body copy.", icon: TypeIcon },
                { label: "List", snippet: "- First item\n- Second item", icon: ListIcon },
                { label: "Quote", snippet: "> A quotation that emphasises a key idea.", icon: Quote },
                { label: "Divider", snippet: "---", icon: Minus },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => handleInsertSnippet(b.snippet)}
                  className="inline-flex items-center gap-1.5 px-2.5 h-8 text-[12px] text-[#6a7282] hover:text-[#101828] hover:bg-[#f3f4f6] rounded-md cursor-pointer"
                >
                  <b.icon size={13} strokeWidth={1.8} />
                  {b.label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleImagePrompt}
                className="inline-flex items-center gap-1.5 px-2.5 h-8 text-[12px] text-[#6a7282] hover:text-[#101828] hover:bg-[#f3f4f6] rounded-md cursor-pointer"
              >
                <ImageIcon size={13} strokeWidth={1.8} />
                Image
              </button>
            </div>

            {/* Body */}
            <textarea
              ref={bodyRef}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder={"## Section heading\n\nA paragraph of body copy.\n\n- bullet one\n- bullet two\n\n> A quotation."}
              rows={18}
              className="w-full px-4 py-4 text-[14px] leading-[1.65] font-mono border border-[#e5e7eb] rounded-lg outline-none focus:border-[#2563eb] resize-y"
              style={{ color: "#101828" }}
            />
            <p className="text-[11px] text-[#9ca3af] mt-2">
              Markdown-lite: <code>##</code> heading, <code>-</code> list, <code>&gt;</code> quote,
              blank line = new paragraph.
            </p>
          </div>
        </main>

        {/* ── Right settings drawer ─────────────────────────── */}
        {activePanel === "settings" && (
          <SettingsDrawer
            post={post}
            related={relatedCandidates}
            onChange={setPost}
            onClose={() => setActivePanel(null)}
          />
        )}
      </div>
    </div>
  );
}
