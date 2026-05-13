# Bloomkite Logo System v1.0

**Status**: Working mark. Direction B from the brand file.
**Production reference**: [bloomkite_logo_system_v1.html](./bloomkite_logo_system_v1.html)

The current Bloomkite.png (calculator icon) is **retired**. This document defines the new mark.

---

## 1. The verified node

A 3×3 grid of advisor nodes. Eight are outlined; one is filled in Verified Green. A saffron point extends from the filled node, signalling the moment of match.

**The mark says**: of all the advisors on the platform, here is the one verified for you.

### Construction

- Built on a 3×3 grid. Each cell is 1 unit.
- Cells separated by ¼ unit gutters.
- Corner radius is 0.18 units.
- The relationship between cell size and gutter is fixed. Do not adjust independently.

### Meaning

- The **center position** carries semantic weight: the verified advisor is at the heart of the platform.
- The **saffron extension** points outward, representing the connection from platform to investor.
- **Position and color are not interchangeable.** Never recolor the verified node any color other than Verified Green `#1D9E75`. Never move the verified node out of center.

---

## 2. Lockups

Three approved configurations. No others.

### Horizontal lockup — primary
- Default lockup. Mark + wordmark side-by-side.
- Used in: website headers, email signatures, business cards, PDF document headers, partner co-branding strips.
- Minimum width: **120px**. Clear space: **1u**.

### Vertical lockup
- Mark above wordmark, stacked.
- Used in: merchandise, app store listings, awards, certificates of verification, square social formats.
- Minimum width: **80px**. Clear space: **1u**.

### Mark-only
- For app icons, favicons, social profile avatars, watermarks.
- The mark is the full brand at small sizes.
- Minimum: **16px**. No upper bound.

---

## 3. Color variants

Five approved renderings. No others.

| Variant | Background | Use |
|---|---|---|
| **Full color** (default) | Paper `#FAFAF7` | All standard surfaces |
| **Reverse** | Forest `#0B3D2E` | Forest backgrounds, dark photographic |
| **Mono Forest** | Paper / light | Print, single-ink reproduction |
| **Mono Paper** | Forest / dark | Watermark on dark surfaces |
| **Pure black** | White | B&W legal docs, fax, debossing, embroidery, single-color silkscreen |

In all variants except full-color and reverse, the saffron accent is rendered in the same single color as the mark.

---

## 4. Sizing

| Size | Use | Status |
|---|---|---|
| 256px | App store hero, marketing banner, large-format print | Optimal |
| 128px | App icon iOS/Android, splash screen, business card | Optimal |
| 64px | Email signature, profile avatar, dashboard sidebar | Optimal |
| 32px | Navigation header logo, social media profile thumb | Optimal |
| 16px | Browser favicon | Adapted — saffron omitted, stroke widths increased |

**Below 16px**: do not use the mark. Substitute the wordmark only, or a single Verified Green square if the mark is required.

---

## 5. Clear space

**Clear space equals one grid unit. No exceptions.**

The minimum required clear space around the mark equals one grid cell of the mark itself (1u). This is the smallest visual unit of the logo, so using it as the clear-space measurement makes the rule self-scaling. No text, no graphic, no image, no other logo may enter this zone.

---

## 6. Usage rules

### Do
- Use approved color variants on appropriate surfaces.
- Maintain at least **1u** of clear space around the mark.
- Use the horizontal lockup as the default.
- Increase stroke weights when scaling below 32px.
- Pair the wordmark in **Fraunces, weight 500**, with optical sizing matched to display size.
- Use the mark-only version when wordmark legibility cannot be guaranteed.
- Place the mark on Paper, white, or Forest backgrounds.
- Use the reverse variant on dark photography.
- Use the pure-black variant for legal documents.
- Treat the saffron accent as integral to the brand.

### Don't
- Don't recolor the verified node any color other than Verified Green `#1D9E75`.
- Don't move the verified node out of center.
- Don't recolor the saffron accent.
- Don't remove either element from the mark.
- Don't replace Fraunces with another typeface.
- Don't modify spacing between mark and wordmark.
- Don't distort proportions.
- Don't apply drop shadows, glows, gradients, or 3D treatments.
- Don't place the mark on busy photographic backgrounds without a solid container.
- Don't place it on saffron backgrounds, red, pink, or any high-saturation non-brand color.
- Don't animate individual cells of the grid.
- Don't use the mark as a pattern or repeated motif.
- Don't allow third parties to modify the mark for partner branding without explicit approval.

---

## 7. Production handoff

The final production logo **must be designed by a professional designer working from this document and from [brand.md](./brand.md)**. The SVG in the codebase is a working interpretation of Direction B for the MVP.

### Required deliverables from production designer

- Final mark in SVG (vector), PNG @ 1x/2x/3x, ICO for favicon.
- All three lockups (horizontal, vertical, mark-only) in each color variant.
- App icons sized for iOS (76, 120, 152, 167, 1024 px) and Android (48, 72, 96, 144, 192, 512 px).
- Maskable PWA icon (512×512 with safe zone).
- Monochrome white-on-Forest version for partner co-branding.
- Brand guidelines PDF (this doc + the brand file, formatted for external sharing).
