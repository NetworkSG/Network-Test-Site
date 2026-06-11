# What's New - 2 June 2026

Here is everything that has changed since the last update, including the work happening behind the scenes.

## Room Designer

The Room Designer (our AI render tool) got a big visual and flow refresh.

- New illustrated landing page. The "How it works" section now walks you through the three steps, one at a time:
  - Step 1, upload a photo of your room.
  - Step 2, describe the look you want.
  - Step 3, see your render and, if you love it, hand it to a real designer.
- Each step has its own hand-drawn illustration, with a subtle line separating one step from the next, so the page feels calmer and easier to follow.
- A new "AI renders are a great start. Humans finish them." section, with its own illustration, explains how a real designer turns your render into something buildable.
- When your render is ready, a pop-up now appears asking if you would like to be matched with firms built for your scope. Your render stays gently hidden behind it until you answer.
  - Pick "Yes" and a short contact form opens right inside the pop-up, already filled in with the details you gave earlier, and your render is sent to a matched designer.
  - Pick "Not now" and your render is simply revealed, no form needed.
- Each visitor now gets one free render per day. This keeps the tool fast, fair, and affordable to run while still giving everyone a real result to react to.
- The studio now shows the same top menu as the rest of the website, and the whole screen fits neatly without awkward extra scrolling.
- General clean-up: removed the "Start over" button, removed the "Just exploring" timeline option, and rewrote the landing page, the steps, and the FAQ so the wording matches the new one-render experience.

## Explore

- Fixed the project detail page on mobile phones. It used to break into tiny, overlapping columns that were hard to use. Now the project sits at the top full-width, with a clean two-column photo grid flowing underneath it, and it looks right on every screen size.

## Tools moving into their own apps

We are separating our internal tools out of the main website and into their own standalone apps. This keeps the public website light and fast, and lets each tool grow and be maintained on its own without affecting the live site.

- **Admin dashboard:** now its own standalone app. Done.
- **Project Import:** now its own standalone app. It is the tool the team uses to bring completed projects into our database, and it can now also pull projects (photos and full details) from Renopedia, on top of the source it already supported. Done.
- **Firm Onboarding:** the sign-up flow for interior design firms is being moved into its own standalone app. In progress.

We also set up the secure connections needed so these standalone apps (for example the new Admin app at site-admin.networksg.net) can safely read and update the website's data from their own web addresses.

## Behind the scenes (admin and developer)

- Built the Renopedia importer from the ground up. You paste a list of Renopedia project links and it fetches each project's photos, title, the firm behind it, and any details it can find.
  - You then review each project in a list and fill in anything the source did not provide (cost, size, property type, sub-type, style, and works included) before saving them one at a time.
  - Renopedia briefly serves a "loading" page to new visitors, so the importer waits and retries automatically until the real page is ready. If a few links still fail, you can re-run just those instead of starting the whole batch again.
  - Imported photos are copied into our own storage, so the projects keep working even if the original Renopedia page later changes.
- The Room Designer's one-render-per-day limit is now enforced on our server, not just in the browser, so the limit holds for everyone.
- The homeowner's answer from the Room Designer "get matched" pop-up is passed all the way through to their saved record, so the matched designer starts the conversation already knowing what the homeowner wants.
- Optimised the new hand-drawn illustrations: removed their backgrounds so they sit cleanly on any section, and compressed them from around 20 MB each down to under 200 KB so the pages stay fast to load.

## Still in progress

- Homepage refresh with more real-home photography and more hand-drawn artwork woven through the sections, so the site feels more visual the moment a visitor lands.
- Rolling out the same hand-drawn artwork across the rest of the site (Designers Directory, Blog, and Project pages) for a consistent look.
- Interior Designer profile area: the signed-in designer's home base for editing their page content, managing their projects, updating firm information, and handling account settings.
- A view inside the designer account for seeing the homeowners matched with them, including the homeowner's saved inspirations, brief, and contact details, so the first conversation starts with full context.
- Admin dashboard restructure for cleaner layouts and clearer status at a glance, plus a new section for reviewing and approving the data that designers submit through their own profiles.
- Short-form video on the Blog: embedding YouTube Shorts and Instagram Reels alongside the written articles.

---

# What's New — 9 April 2026

## Cost Guide

We've made the cost guide smarter and more detailed so you get a better renovation estimate.

**New questions added:**
- **Property status** — Tell us if your home is new (BTO), existing, or resale so we can adjust costs accordingly
- **Postal code** — Enter your postal code and we'll verify your address automatically
- **Lifestyle** — Answer simple Yes/No questions about pets, kids, accessibility needs, eco-friendly preferences, and design boldness
- **Design theme** — Pick up to 2 styles you like (Scandinavian, Japandi, Wabi Sabi, and more)
- **Meeting preference** — Let us know if you'd prefer a virtual or in-person consultation
- **Notes & photos** — Add any additional details or upload reference photos for your designer

**PDF cost breakdown**
- You now receive a professionally designed PDF with your full cost breakdown
- The PDF includes your name, contact, address, property details, lifestyle preferences, chosen themes, and a room-by-room cost estimate

---

## Floor Plan 3D Editor

- Improved how rooms, walls, doors, and windows are handled for a smoother editing experience
- Better memory management so the editor runs faster and doesn't slow down over time
- Started reorganising the code behind the scenes for easier future updates

---

## Floor Plan Dashboard

- Improved how your saved projects and templates are managed

---

## Navigation

- Cleaned up the menu across all pages for a simpler browsing experience
