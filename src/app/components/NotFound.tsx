import { useEffect } from "react";
import { Link } from "react-router";

export function NotFound() {
  useEffect(() => {
    const existing = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const prevRobots = existing?.content ?? null;
    if (existing) {
      existing.content = "noindex";
    } else {
      const meta = document.createElement("meta");
      meta.name = "robots";
      meta.content = "noindex";
      document.head.appendChild(meta);
    }
    const prevTitle = document.title;
    document.title = "Page not found — Network";
    return () => {
      const tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (tag) {
        if (prevRobots !== null) tag.content = prevRobots;
        else tag.remove();
      }
      document.title = prevTitle;
    };
  }, []);

  return (
    <div
      style={{ background: "#f0ede6", color: "#0f0f0d", fontFamily: "'EB Garamond', serif" }}
      className="min-h-screen flex items-center justify-center px-6"
    >
      <div className="max-w-md text-center">
        <p className="text-sm tracking-widest uppercase opacity-60 mb-4">404</p>
        <h1 className="text-4xl md:text-5xl mb-4">Page not found</h1>
        <p className="text-lg opacity-80 mb-8">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-full bg-[#0f0f0d] text-[#f0ede6] hover:opacity-90 transition-opacity"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
