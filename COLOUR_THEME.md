# Nesteeq Colour Theme

This document records the current frontend colour theme used in the Nesteeq web app. It is a design reference only; no app code or logic has been changed.

## Theme Direction

Nesteeq uses a premium apartment and operations palette built around deep forest green, warm ivory surfaces, antique gold accents, and muted green-grey text. The overall feel is warm, calm, trustworthy, and polished.

## Core Palette

| Role | Colour | Hex | Current use |
| --- | --- | --- | --- |
| Deep Forest | <span style="display:inline-block;width:42px;height:16px;background:#042E27;border:1px solid #ddd;"></span> | `#042E27` | Announcement bar, footer, dark stat panels, chart tooltip |
| Primary Forest | <span style="display:inline-block;width:42px;height:16px;background:#09493E;border:1px solid #ddd;"></span> | `#09493E` | Primary buttons, links, active states, chart lines, brand marks |
| Forest Hover | <span style="display:inline-block;width:42px;height:16px;background:#05372E;border:1px solid #ddd;"></span> | `#05372E` | Primary button hover state |
| Forest Border | <span style="display:inline-block;width:42px;height:16px;background:#0B5649;border:1px solid #ddd;"></span> | `#0B5649` | Logo and dark badge borders |
| Dark Forest Border | <span style="display:inline-block;width:42px;height:16px;background:#083D34;border:1px solid #ddd;"></span> | `#083D34` | Announcement/footer borders |
| Antique Gold | <span style="display:inline-block;width:42px;height:16px;background:#C5A059;border:1px solid #ddd;"></span> | `#C5A059` | Premium accents, icons, stats numbers, active labels |
| Page Ivory | <span style="display:inline-block;width:42px;height:16px;background:#FBF9F5;border:1px solid #ddd;"></span> | `#FBF9F5` | Main page and hero background |
| Warm Surface | <span style="display:inline-block;width:42px;height:16px;background:#FAF7F2;border:1px solid #ddd;"></span> | `#FAF7F2` | Cards, dashboard tiles, avatar rings |
| Soft Cream | <span style="display:inline-block;width:42px;height:16px;background:#F4EFE6;border:1px solid #ddd;"></span> | `#F4EFE6` | Pills, secondary buttons, sidebar surface, hover backgrounds |
| Warm Border | <span style="display:inline-block;width:42px;height:16px;background:#E5DFD5;border:1px solid #ddd;"></span> | `#E5DFD5` | Borders and dividers |

## Text Palette

| Role | Colour | Hex | Current use |
| --- | --- | --- | --- |
| Heading Ink | <span style="display:inline-block;width:42px;height:16px;background:#1C2421;border:1px solid #ddd;"></span> | `#1C2421` | Main headings, strong labels, dashboard titles |
| Body Muted | <span style="display:inline-block;width:42px;height:16px;background:#4A5550;border:1px solid #ddd;"></span> | `#4A5550` | Paragraphs, navigation text, card descriptions |
| Utility Muted | <span style="display:inline-block;width:42px;height:16px;background:#8A9690;border:1px solid #ddd;"></span> | `#8A9690` | Small helper text, placeholders, chart labels |
| Soft Mint Text | <span style="display:inline-block;width:42px;height:16px;background:#A3C2B9;border:1px solid #ddd;"></span> | `#A3C2B9` | Text on dark forest surfaces |
| Footer Muted Mint | <span style="display:inline-block;width:42px;height:16px;background:#8AA89F;border:1px solid #ddd;"></span> | `#8AA89F` | Footer secondary text |
| Default Dark | <span style="display:inline-block;width:42px;height:16px;background:#111827;border:1px solid #ddd;"></span> | `#111827` | Global fallback body text |
| Slate Icon | <span style="display:inline-block;width:42px;height:16px;background:#374151;border:1px solid #ddd;"></span> | `#374151` | Mobile menu icon fallback |

## Neutral Utility Colours

Some pricing and contact sections currently use Tailwind neutral and emerald utility classes. If Tailwind defaults are unchanged, these map approximately to:

| Tailwind token | Approx hex | Current use |
| --- | --- | --- |
| `neutral-100` | `#F5F5F5` | Neutral pills, icon backgrounds, separators |
| `neutral-200` | `#E5E5E5` | Neutral borders |
| `neutral-400` | `#A3A3A3` | Muted text on dark pricing cards |
| `neutral-500` | `#737373` | Label text |
| `neutral-600` | `#525252` | Body copy |
| `neutral-700` | `#404040` | Form labels and feature text |
| `neutral-800` | `#262626` | Dark card separators and check icons |
| `neutral-900` | `#171717` | Pricing cards, buttons, headings |
| `neutral-950` | `#0A0A0A` | Strong text on light badges |
| `emerald-100` | `#D1FAE5` | Success confirmation background |
| `emerald-400` | `#34D399` | Save badge and success check accent |
| `emerald-600` | `#059669` | Success confirmation icon |

## Recommended Usage Rules

Use `#09493E` as the main brand colour for primary actions, active navigation, charts, and important links.

Use `#042E27` for dark brand bands such as announcement bars, footers, statistic strips, and high-emphasis panels.

Use `#C5A059` as an accent only. It works best for icons, small labels, key numbers, premium badges, and focus details.

Use `#FBF9F5`, `#FAF7F2`, and `#F4EFE6` as the warm surface scale. Avoid replacing large surfaces with pure white unless the content needs a crisp dashboard/card feel.

Use `#1C2421` for main headings and high-priority text. Use `#4A5550` for body copy and `#8A9690` for helper text.

Use `#E5DFD5` as the default warm border colour across cards, dividers, forms, and subtle separators.

## Accessible Pairings

| Background | Text/accent |
| --- | --- |
| `#FBF9F5` | `#1C2421`, `#4A5550`, `#09493E` |
| `#FAF7F2` | `#1C2421`, `#4A5550`, `#09493E` |
| `#F4EFE6` | `#09493E`, `#1C2421` |
| `#09493E` | `#FFFFFF`, `#C5A059` for small accents |
| `#042E27` | `#FFFFFF`, `#A3C2B9`, `#C5A059` |
| `#FFFFFF` | `#1C2421`, `#4A5550`, `#09493E` |

Avoid using `#C5A059` as long paragraph text on light backgrounds. Keep it as an accent so the brand feels premium without losing readability.

## Suggested Token Names

| Token | Hex |
| --- | --- |
| `brand.forest.deep` | `#042E27` |
| `brand.forest.primary` | `#09493E` |
| `brand.forest.hover` | `#05372E` |
| `brand.gold` | `#C5A059` |
| `surface.page` | `#FBF9F5` |
| `surface.cardWarm` | `#FAF7F2` |
| `surface.soft` | `#F4EFE6` |
| `border.warm` | `#E5DFD5` |
| `text.heading` | `#1C2421` |
| `text.body` | `#4A5550` |
| `text.muted` | `#8A9690` |
| `text.onDarkMuted` | `#A3C2B9` |

## Current Component Map

| Component | Theme notes |
| --- | --- |
| `app/page.tsx` | Page shell uses `#FBF9F5`, heading text `#1C2421`, selection colour `#09493E`, and dark announcement bar `#042E27`. |
| `Navbar.tsx` | Warm glass surface `#FAF7F2`, primary forest actions, gold icon accents, warm borders. |
| `Hero.tsx` | Main brand expression: ivory background, forest headline emphasis, gold highlights, dark stat bar, warm dashboard cards. |
| `Features.tsx` | Warm section background with white cards, forest icons, and gold accents. |
| `Pricing.tsx` | Uses Tailwind neutral palette and emerald accents. Consider aligning future pricing work to the forest/gold palette for stronger consistency. |
| `Contact.tsx` | Uses Tailwind neutral palette and emerald success state. It can remain neutral, or be warmed with the primary palette in a future style pass. |
| `Footer.tsx` | Dark forest footer with mint-muted text and gold hover accents. |
