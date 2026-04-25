import { Link } from "react-router";
import { Seo } from "./shared/Seo";

export function NotFound() {
  return (
    <div
      style={{ background: "#f0ede6", color: "#0f0f0d", fontFamily: "'EB Garamond', serif" }}
      className="min-h-screen flex items-center justify-center px-6"
    >
      <Seo
        title="Page not found — Network"
        description="This page doesn't exist or has moved. Head back to Network's homepage to get matched with a Singapore interior designer."
        noindex
      />
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
