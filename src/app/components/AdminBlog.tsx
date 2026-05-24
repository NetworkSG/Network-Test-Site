import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  ExternalLink,
  Search,
  X,
  CheckCircle2,
  CircleDot,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  getAllPostsForAdmin,
  savePost,
  deletePost,
  setPostStatus,
  subscribe,
  toSlug,
  BLOG_CATEGORIES,
  type AdminPost,
} from "./blog/blogStore";
import type { Post, Block } from "./blog/posts";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

// Suggested seed prompts — clicking one fills the textarea so the editor
// has a low-friction starting point. Tuned for the SG renovation market.
const AI_PROMPT_SUGGESTIONS: { label: string; text: string }[] = [
  {
    label: "BTO budget breakdown",
    text: "Write a practical guide breaking down what a $40-60K BTO renovation budget actually covers in Singapore — hacking, electrical, carpentry, flooring, etc — and what hidden costs to plan for.",
  },
  {
    label: "Choosing an ID firm",
    text: "Write a guide for first-time HDB homeowners on how to evaluate an interior design firm before signing — credentials to check, red flags in quotes, and questions to ask in the first meeting.",
  },
  {
    label: "Resale vs BTO renovation",
    text: "Compare the renovation realities of buying a resale HDB versus a new BTO in Singapore — cost differences, scope of hacking, hidden problems to watch for, and timeline.",
  },
  {
    label: "Japandi style for HDB",
    text: "Write a style guide on bringing Japandi design into a 4-room HDB — palette, materials, lighting tricks, and how to keep it practical for SG humidity.",
  },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

// Convert body blocks to a plain-text textarea representation and back.
// Headings start with "## " and lists with "- " — keeps editing simple
// without pulling in a markdown editor.
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
    if (para.startsWith("## ")) {
      blocks.push({ type: "h2", text: para.slice(3).trim() });
    } else if (para.startsWith("> ")) {
      blocks.push({ type: "quote", text: para.slice(2).trim() });
    } else if (para.split("\n").every((l) => l.trim().startsWith("- "))) {
      blocks.push({
        type: "ul",
        items: para
          .split("\n")
          .map((l) => l.trim().slice(2).trim())
          .filter(Boolean),
      });
    } else {
      blocks.push({ type: "p", text: para });
    }
  }
  return blocks;
}

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
};

function StatusPill({ status }: { status: "draft" | "published" }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#ecfdf5] text-[#065f46]">
        <CheckCircle2 className="size-3" /> Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#fef3c7] text-[#92400e]">
      <CircleDot className="size-3" /> Draft
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-SG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Editor Modal ─────────────────────────────────────────────────────
function BlogEditorModal({
  initial,
  isNew,
  onClose,
}: {
  initial: Post;
  isNew: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Post>(initial);
  const [bodyText, setBodyText] = useState(() => bodyToText(initial.body));
  // Track if the user has manually edited the slug so we don't overwrite
  // it once they've made a deliberate choice.
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const update = <K extends keyof Post>(key: K, value: Post[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleTitleChange = (v: string) => {
    update("title", v);
    if (!slugTouched) update("slug", toSlug(v));
  };

  const handleSave = (status: "draft" | "published") => {
    const post: Post = {
      ...form,
      slug: form.slug || toSlug(form.title),
      body: textToBody(bodyText),
    };
    if (!post.title.trim() || !post.slug.trim()) {
      alert("Title and slug are required.");
      return;
    }
    savePost(post, status);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-6"
      style={{ background: "rgba(15,15,13,0.55)" }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[920px] my-8 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
          <h3 className="text-[16px] font-semibold text-[#101828]">
            {isNew ? "Add new article" : "Edit article"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#6a7282] hover:text-[#101828] cursor-pointer"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full h-10 px-3 text-[14px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828]"
              placeholder="Article title"
            />
          </Field>

          <Field label="Slug">
            <input
              value={form.slug}
              onChange={(e) => {
                update("slug", toSlug(e.target.value));
                setSlugTouched(true);
              }}
              className="w-full h-10 px-3 text-[14px] font-mono border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828]"
              placeholder="article-url-slug"
            />
          </Field>

          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value as Post["category"])}
              className="w-full h-10 px-3 text-[14px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828] bg-white"
            >
              {BLOG_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Read time (minutes)">
            <input
              type="number"
              min={1}
              value={form.readMin}
              onChange={(e) => update("readMin", Math.max(1, Number(e.target.value) || 1))}
              className="w-full h-10 px-3 text-[14px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828]"
            />
          </Field>

          <Field label="Author name">
            <input
              value={form.author.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, author: { ...f.author, name: e.target.value } }))
              }
              className="w-full h-10 px-3 text-[14px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828]"
            />
          </Field>

          <Field label="Author initials (2 chars)">
            <input
              maxLength={2}
              value={form.author.avatar}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  author: { ...f.author, avatar: e.target.value.toUpperCase().slice(0, 2) },
                }))
              }
              className="w-full h-10 px-3 text-[14px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828]"
            />
          </Field>

          <Field label="Published date">
            <input
              type="date"
              value={form.publishedOn}
              onChange={(e) => update("publishedOn", e.target.value)}
              className="w-full h-10 px-3 text-[14px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828]"
            />
          </Field>

          <Field label="Cover image URL">
            <input
              value={form.image}
              onChange={(e) => update("image", e.target.value)}
              className="w-full h-10 px-3 text-[14px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828]"
              placeholder="https://…"
            />
          </Field>

          <Field label="Card description" full>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="w-full px-3 py-2 text-[14px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828] resize-none"
              placeholder="Short summary shown on the index card."
            />
          </Field>

          <Field label="Lede (article intro)" full>
            <textarea
              rows={3}
              value={form.lede}
              onChange={(e) => update("lede", e.target.value)}
              className="w-full px-3 py-2 text-[14px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828] resize-none"
              placeholder="Opening paragraph shown beneath the title."
            />
          </Field>

          <Field
            label="Body — `##` for headings, `- ` for lists, `> ` for quotes; blank line = new paragraph"
            full
          >
            <textarea
              rows={14}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              className="w-full px-3 py-2 text-[13px] font-mono border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828] resize-y"
              placeholder={"## Section heading\n\nA paragraph of body copy.\n\n- bullet one\n- bullet two"}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e5e7eb] bg-[#f9fafb] rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 text-[13px] font-medium text-[#6a7282] hover:text-[#101828] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSave("draft")}
            className="px-4 h-10 text-[13px] font-medium text-[#101828] border border-[#e5e7eb] rounded-lg hover:bg-white cursor-pointer"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => handleSave("published")}
            className="inline-flex items-center gap-1.5 px-4 h-10 text-[13px] font-medium text-white bg-[#101828] rounded-lg hover:opacity-90 cursor-pointer"
          >
            <CheckCircle2 className="size-3.5" /> Publish
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "md:col-span-2" : ""}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6a7282]">
        {label}
      </span>
      {children}
    </label>
  );
}

// ─── Delete confirm modal ────────────────────────────────────────────
function DeleteConfirm({
  post,
  onCancel,
  onConfirm,
}: {
  post: AdminPost;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-6"
      style={{ background: "rgba(15,15,13,0.55)" }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[440px] shadow-xl p-6">
        <h3 className="text-[16px] font-semibold text-[#101828] mb-2">Delete this article?</h3>
        <p className="text-[14px] text-[#6a7282] mb-5">
          <strong className="text-[#101828]">{post.title}</strong> will be removed from
          the public blog. This cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 h-10 text-[13px] font-medium text-[#6a7282] hover:text-[#101828] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 h-10 text-[13px] font-medium text-white bg-[#ef4444] rounded-lg hover:bg-[#dc2626] cursor-pointer"
          >
            <Trash2 className="size-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────
export function AdminBlog() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<AdminPost[]>(() => getAllPostsForAdmin());
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [confirmDelete, setConfirmDelete] = useState<AdminPost | null>(null);

  // ── AI article generator state ─────────────────────────────────
  // Two-phase progress: Claude writes the text (~15-30s), then we
  // poll kie.ai's nano-banana-2 task until the cover image is ready
  // (~1-3 min). Only after BOTH phases finish do we save the draft —
  // so it lands in the list complete with cover image on first appearance.
  type AiPhase = "idle" | "writing" | "imaging" | "saving" | "error";
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPhase, setAiPhase] = useState<AiPhase>("idle");
  const [aiError, setAiError] = useState("");
  // Elapsed-seconds counter for the image phase so the modal can show
  // "Generating cover image… 47s" instead of a stale spinner.
  const [aiImageElapsed, setAiImageElapsed] = useState(0);

  useEffect(() => subscribe(() => setPosts(getAllPostsForAdmin())), []);

  // Tick the image-phase elapsed counter every second.
  useEffect(() => {
    if (aiPhase !== "imaging") { setAiImageElapsed(0); return; }
    const id = setInterval(() => setAiImageElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [aiPhase]);

  const closeAi = () => {
    // Block close while a phase is in flight — we don't want a half-baked
    // draft (or a paid-for image task we never use).
    if (aiPhase === "writing" || aiPhase === "imaging" || aiPhase === "saving") return;
    setAiOpen(false);
    setAiPrompt("");
    setAiPhase("idle");
    setAiError("");
  };

  // Polls /admin-blog-image-status until kie.ai's nano-banana-2 task
  // succeeds, fails, or hits the max-attempts ceiling. Returns the image
  // URL on success; null if it gave up (the caller decides whether to
  // save the draft anyway with no cover).
  const waitForCoverImage = async (taskId: string): Promise<string | null> => {
    const MAX_ATTEMPTS = 50; // ~5 min @ 6s
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // First check after 4s, then every 6s.
      await new Promise((r) => setTimeout(r, attempt === 0 ? 4000 : 6000));
      try {
        const res = await fetch(
          `${API}/admin-blog-image-status?taskId=${encodeURIComponent(taskId)}`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } },
        );
        if (!res.ok) continue;
        const data = await res.json();
        if (data?.status === "success" && data.imageUrl) return data.imageUrl;
        if (data?.status === "failed") return null;
        // "processing" — keep polling.
      } catch { /* network blip, keep polling */ }
    }
    return null;
  };

  const runAiGenerate = async () => {
    const prompt = aiPrompt.trim();
    if (prompt.length < 10) {
      setAiError("Give me a topic or angle (at least 10 characters).");
      setAiPhase("error");
      return;
    }
    setAiError("");

    // ── Phase 1: Claude drafts the article ──
    setAiPhase("writing");
    let post: Post | null = null;
    let coverImageTaskId: string | null = null;
    try {
      const res = await fetch(`${API}/admin-blog-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data?.post) {
        const msg = data?.error || `Generation failed (HTTP ${res.status}).`;
        setAiError(
          res.status === 404
            ? "Backend endpoint not deployed yet. Run: supabase functions deploy make-server-4808de5e"
            : msg,
        );
        setAiPhase("error");
        return;
      }
      post = data.post as Post;
      coverImageTaskId = typeof data.coverImageTaskId === "string" ? data.coverImageTaskId : null;
    } catch (err: any) {
      setAiError("Network error: " + (err?.message || String(err)).slice(0, 200));
      setAiPhase("error");
      return;
    }

    // ── Phase 2: Wait for cover image to finish ──
    let coverImageUrl: string | null = null;
    if (coverImageTaskId) {
      setAiPhase("imaging");
      coverImageUrl = await waitForCoverImage(coverImageTaskId);
      // If we gave up / failed, soft-fall-through and save without cover.
      // The user can attach one later via the editor's image picker.
    }

    // ── Phase 3: Save the complete draft ──
    setAiPhase("saving");
    const finalPost: Post = coverImageUrl
      ? { ...post, image: coverImageUrl, imageAlt: post.title }
      : post;
    savePost(finalPost, "draft");

    // Close modal, reset state.
    setAiOpen(false);
    setAiPrompt("");
    setAiPhase("idle");
    setAiError("");
  };

  const aiBusy = aiPhase === "writing" || aiPhase === "imaging" || aiPhase === "saving";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q)
      );
    });
  }, [posts, query, categoryFilter, statusFilter]);

  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.length - publishedCount;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#101828] m-0">Blog</h1>
          <p className="text-[14px] text-[#6a7282] mt-1 m-0">
            Manage articles published on <span className="font-mono">/blog</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* AI generate — white surface with glowing iridescent stroke.
              The pseudo-element creates a soft animated halo behind the
              button without breaking the white interior. */}
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="ai-glow-btn relative inline-flex items-center gap-1.5 px-4 h-10 text-[13px] font-medium text-[#101828] bg-white rounded-lg cursor-pointer transition-transform active:scale-[0.98]"
            style={{
              boxShadow:
                "0 0 0 1px rgba(167, 139, 250, 0.55), 0 0 14px rgba(167, 139, 250, 0.45), 0 0 28px rgba(99, 102, 241, 0.28)",
            }}
          >
            <Sparkles className="size-4" style={{ color: "#7c3aed" }} />
            <span>Create article with AI</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/blog/new")}
            className="inline-flex items-center gap-1.5 px-4 h-10 text-[13px] font-medium text-white bg-[#101828] rounded-lg hover:opacity-90 cursor-pointer"
          >
            <Plus className="size-4" /> Add new article
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total articles" value={posts.length} />
        <StatCard label="Published" value={publishedCount} accent="#065f46" bg="#ecfdf5" />
        <StatCard label="Drafts" value={draftCount} accent="#92400e" bg="#fef3c7" />
      </div>
      <div className="text-[12px] text-[#6a7282] -mt-2">
        <strong className="text-[#101828] tabular-nums">{totalViews.toLocaleString()}</strong>{" "}
        total page views across all articles.
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9ca3af]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, or description"
            className="w-full h-10 pl-10 pr-3 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-10 px-3 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828] bg-white cursor-pointer"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 px-3 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#101828] bg-white cursor-pointer"
        >
          <option>All</option>
          {BLOG_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-[#6a7282]">
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Views</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3 w-[160px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-[14px] text-[#6a7282]">
                  No articles match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.slug} className="border-t border-[#e5e7eb] hover:bg-[#fafafa]">
                  <td className="px-4 py-3 max-w-[420px]">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-10 rounded-lg overflow-hidden shrink-0 bg-[#f3f4f6]"
                        style={{
                          backgroundImage: p.image ? `url(${p.image})` : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-[#101828] truncate">{p.title}</div>
                        <div className="text-[12px] text-[#6a7282] truncate">
                          {p.author.name} · {p.readMin} min read
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6a7282]">{p.category}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-[#101828]">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5 text-[#9ca3af]" /> {p.views.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6a7282]">{formatDate(p.publishedOn)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/blog/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-[#6a7282] hover:text-[#101828] hover:bg-[#f3f4f6] rounded-lg cursor-pointer"
                        title="View on site"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          setPostStatus(
                            p.slug,
                            p.status === "published" ? "draft" : "published"
                          )
                        }
                        className="px-2.5 h-8 text-[12px] font-medium text-[#101828] border border-[#e5e7eb] rounded-lg hover:bg-[#f3f4f6] cursor-pointer"
                        title={
                          p.status === "published" ? "Move to drafts" : "Publish now"
                        }
                      >
                        {p.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/blog/edit/${p.slug}`)}
                        className="p-2 text-[#6a7282] hover:text-[#101828] hover:bg-[#f3f4f6] rounded-lg cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(p)}
                        className="p-2 text-[#ef4444] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded-lg cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
        <DeleteConfirm
          post={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            deletePost(confirmDelete.slug);
            setConfirmDelete(null);
          }}
        />
      )}

      {/* ── AI article generator modal ──────────────────────── */}
      {aiOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create article with AI"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeAi(); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[560px] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4" style={{ color: "#7c3aed" }} />
                <h3 className="text-[15px] font-semibold text-[#101828] m-0">Create article with AI</h3>
              </div>
              <button
                type="button"
                onClick={closeAi}
                disabled={aiBusy}
                className="p-1 text-[#6a7282] hover:text-[#101828] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <p className="text-[13px] text-[#6a7282] m-0">
                Describe the topic or angle for the article. Claude Sonnet 4.6 will
                draft the copy and Nano Banana 2 will generate a cover image — both
                via kie.ai. The result lands as a draft you can review and publish.
              </p>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-[#101828]">Topic or prompt</span>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => {
                    setAiPrompt(e.target.value);
                    if (aiPhase === "error") { setAiPhase("idle"); setAiError(""); }
                  }}
                  disabled={aiBusy}
                  placeholder="e.g., Write a guide for first-time HDB owners on how to evaluate ID quotes — what to compare line-by-line, what tradeoffs to expect, and red flags…"
                  rows={5}
                  className="w-full px-3 py-2 text-[13px] border border-[#e5e7eb] rounded-lg outline-none focus:border-[#7c3aed] disabled:bg-[#f9fafb] disabled:cursor-not-allowed resize-y"
                />
                <span className="text-[11px] text-[#9ca3af]">
                  {aiPrompt.length} / 2000 characters
                </span>
              </label>

              {!aiBusy && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-[#9ca3af]">
                    Quick start
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {AI_PROMPT_SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => { setAiPrompt(s.text); setAiError(""); setAiPhase("idle"); }}
                        className="px-2.5 py-1 text-[11px] font-medium text-[#475467] bg-[#f9fafb] border border-[#e5e7eb] rounded-full cursor-pointer hover:bg-[#eff6ff] hover:text-[#2563eb] hover:border-[#bfdbfe]"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {aiBusy && (
                <div className="flex flex-col gap-2 px-3 py-3 bg-gradient-to-r from-[#faf5ff] to-[#eff6ff] border border-[#e9d5ff] rounded-lg">
                  <AiPhaseRow
                    label="Writing article with Claude Sonnet 4.6"
                    sublabel="Drafting title, lede, sections, and tags"
                    state={aiPhase === "writing" ? "active" : "done"}
                  />
                  <AiPhaseRow
                    label="Generating cover image with Nano Banana 2"
                    sublabel={
                      aiPhase === "imaging"
                        ? `~1–3 minutes · ${aiImageElapsed}s elapsed`
                        : "16:9 editorial photo, generated then attached"
                    }
                    state={
                      aiPhase === "imaging" ? "active"
                      : aiPhase === "saving" ? "done"
                      : "pending"
                    }
                  />
                  <AiPhaseRow
                    label="Saving as draft"
                    sublabel="Appears in your article list, ready to review"
                    state={aiPhase === "saving" ? "active" : "pending"}
                  />
                </div>
              )}

              {aiPhase === "error" && aiError && (
                <div className="text-[12px] text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-md px-3 py-2">
                  {aiError}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[#e5e7eb] flex items-center justify-end gap-2 bg-[#f9fafb]">
              <button
                type="button"
                onClick={closeAi}
                disabled={aiBusy}
                className="px-4 h-9 text-[13px] font-medium text-[#101828] bg-white border border-[#e5e7eb] rounded-lg cursor-pointer hover:bg-[#f3f4f6] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runAiGenerate}
                disabled={aiBusy || aiPrompt.trim().length < 10}
                className="inline-flex items-center gap-1.5 px-4 h-9 text-[13px] font-medium text-white rounded-lg disabled:bg-[#cbd5e1] disabled:cursor-not-allowed"
                style={
                  !aiBusy && aiPrompt.trim().length >= 10
                    ? { background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)" }
                    : undefined
                }
              >
                {aiPhase === "writing" ? (
                  <><Loader2 className="size-3.5 animate-spin" /> Writing…</>
                ) : aiPhase === "imaging" ? (
                  <><Loader2 className="size-3.5 animate-spin" /> Generating image…</>
                ) : aiPhase === "saving" ? (
                  <><Loader2 className="size-3.5 animate-spin" /> Saving…</>
                ) : (
                  <><Sparkles className="size-3.5" /> Generate article</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glow animation for the AI button */}
      <style>{`
        @keyframes ai-glow-pulse {
          0%, 100% {
            box-shadow:
              0 0 0 1px rgba(167, 139, 250, 0.55),
              0 0 14px rgba(167, 139, 250, 0.45),
              0 0 28px rgba(99, 102, 241, 0.28);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(124, 58, 237, 0.7),
              0 0 22px rgba(167, 139, 250, 0.7),
              0 0 40px rgba(99, 102, 241, 0.45);
          }
        }
        .ai-glow-btn {
          animation: ai-glow-pulse 2.6s ease-in-out infinite;
        }
        .ai-glow-btn:hover {
          animation-duration: 1.4s;
        }
      `}</style>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "#101828",
  bg = "#ffffff",
}: {
  label: string;
  value: number;
  accent?: string;
  bg?: string;
}) {
  return (
    <div
      className="rounded-xl px-5 py-4 border border-[#e5e7eb]"
      style={{ background: bg }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6a7282]">
        {label}
      </div>
      <div
        className="text-[28px] font-semibold mt-1 tabular-nums"
        style={{ color: accent }}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}

// One row in the AI generator's three-phase progress stack.
// `pending` = grey, `active` = spinning purple, `done` = green check.
function AiPhaseRow({
  label,
  sublabel,
  state,
}: {
  label: string;
  sublabel: string;
  state: "pending" | "active" | "done";
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0 w-5 h-5 flex items-center justify-center">
        {state === "done" ? (
          <CheckCircle2 className="size-5 text-[#16a34a]" />
        ) : state === "active" ? (
          <Loader2 className="size-4 animate-spin text-[#7c3aed]" />
        ) : (
          <div className="w-3 h-3 rounded-full border border-[#cbd5e1]" />
        )}
      </div>
      <div className="text-[12px] leading-tight flex-1 min-w-0">
        <div
          className={`font-medium ${
            state === "done"
              ? "text-[#101828]"
              : state === "active"
              ? "text-[#101828]"
              : "text-[#9ca3af]"
          }`}
        >
          {label}
        </div>
        <div className={state === "pending" ? "text-[#cbd5e1]" : "text-[#6a7282]"}>
          {sublabel}
        </div>
      </div>
    </div>
  );
}
