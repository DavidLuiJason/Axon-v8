# AXON Architectural Rules & Directives

## CORE LAYOUT RULE — PERMANENT, NON-NEGOTIABLE
The chat screen must use a fixed app-shell layout structure at all times:
1. **Fixed Top Header**: The top header (hamburger/nav menu, title bar) is fixed/pinned — it never moves, scrolls, or repositions with page content.
2. **Fixed Bottom Input Bar**: The bottom input bar (text field, mic, send, attach, and any other action buttons/banners) is fixed/pinned — it never moves, scrolls, or repositions with page content.
3. **Contained Independent Middle Scroll**: Only the message list in between scrolls, independently, within its own contained scroll region (`flex-1 min-h-0 overflow-y-auto`).
4. **Structural Layout Rule**: This must be implemented as a structural layout rule (e.g. a fixed-position/flex-shell container with an internally scrollable message area) — not a scroll-behavior patch, workaround, or per-screen fix.
5. **Global Application**: This rule applies globally to every screen with a header/input bar (chat, tools, library, settings, etc.), not just the main chat screen.
6. **Permanent Architectural Constraint**: Do not regenerate, restructure, or "simplify" this shell layout in any future part or fix without explicitly preserving fixed header/fixed input/scrollable-middle behavior. If a future change would break this, flag it instead of applying it.
