# Design decisions

## Page design — decided from the prototype on 2026-11-18

Four rounds in a throwaway `/proto.html` with the real backend and worst-case content (very long URLs, 8+ links, empty state, errors, light/dark, phone width).

**Chosen: "Bold" layout in the Indigo palette.**

- Full-width color band at the top, large white headline ("Make it short."), the form sits on the band.
- Input and button share one white pill; near-black "Shorten" button.
- Links are cards that overlap the band's bottom edge and slide in one after another (50 ms stagger, 480 ms, `cubic-bezier(0.23, 1, 0.32, 1)`).
- Each card: host in grey + short code large in monospace accent color, original URL truncated, relative time, Copy button that turns green with a check.
- Band: `oklch(0.48 0.2 275)` (blue with a little violet). Accent for codes and Copy uses the same hue, `oklch(0.5 0.2 275)`. Dark mode: band `oklch(0.44 0.18 275)`, dark tinted page and cards.
- "Copied" stays green on purpose: a hue-colored check would read as just another button.
- All text passes WCAG AA (headline 7:1, label 5.7:1, codes 6.4:1).

**Rejected, and why:**

- Round 1 layouts: _Current_ (plain centered column, too generic), _Spotlight_ (big pill input with one hero result: history feels secondary), _Editorial_ (serif headline + table: good, but less personality than Bold).
- Round 2 pink/purple bands: _Rose_ (raspberry) and _Lilac_ (soft pastel). Too light/playful; a dark band with a white headline felt more professional.
- Round 3 dark purple bands: _Plum_, _Aubergine_, _Midnight_ (whole page dark). Too purple; the original blue read as more professional.
- Round 4 blue-violet: _Blue_ (original, no purple at all), _Iris_ (halfway to violet, closest to the generic "purple tech" look), _Deep Indigo_ (reads as navy on dim screens). **Indigo** kept the blue's professionalism with a touch of purple.
