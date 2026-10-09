# Abubu Dance website

This project is a static website for GitHub Pages. No build step or runtime dependencies are required.

## Preview

Run `python3 -m http.server 8000` from this folder and open `http://127.0.0.1:8000/`.

## Files

`index.html` contains the page structure. `styles.css` contains responsive styles. `script.js` controls partner logos, value cards, games, carousel interactions, pointer effects, and parallax. `headings.js` renders the styled text. `interface.js` handles navigation and copyright. `sticker.js` handles the peelable video. `snow.js` controls snow.

## Content controls

Edit `PARTNERS_IN_CRIME`, `PARTNER_LOGO_TINT`, `WHAT_WE_LOVE`, `CAROUSEL_GAMES`, and `BACKGROUND_PARALLAX_SPEED` in `script.js`. Edit `SNOW_SETTINGS` in `snow.js`. Assets are stored in `assets` and fonts in `assets/fonts`.

## Hosting

Keep `CNAME` and `.nojekyll` when deploying. Update resource version query strings in `index.html` when changing CSS or JavaScript. Set the GitHub Pages publishing source to this repository root. Publishing remains a separate step.

## Release verification

Check desktop and mobile layouts, image loading, menu keyboard controls, both carousel directions, the sticker reveal, email links, reduced motion, and the footer. Christmasing Around currently uses Steam and YouTube search links; replace them when its direct pages are available.

The sky, artwork, and animated reindeer use lossless WebP. Font files use WOFF2 with their original glyph coverage. Media below the hero loads when needed, and animation work pauses when hidden.

## Languages

`language.js` contains the Vietnamese dictionary and language switch. English is the default on a first visit. The selected language is remembered locally. Game names remain in their original language. Edit matching Vietnamese entries when updating English content. Social preview metadata is in `index.html`; the preview image is `assets/social-preview.png`.

Carousel YouTube buttons with direct video URLs automatically display a responsive player beneath the buttons. Watch, Shorts, live, embed, and youtu.be URLs are supported. Search links remain buttons because they do not identify a video. Players load lazily and are removed when selecting a game without a video.

`BACKGROUND_PARALLAX_SPEED` scales the sky scroll movement, decoration scroll and pointer movement, and floating animation speed. Use `0` to disable this movement, `0.25` for subtle movement, `1` for normal movement, and larger values for faster movement. Reload after editing. Each decoration retains its depth from `data-parallax`.

The sky easing time also follows `BACKGROUND_PARALLAX_SPEED`: larger values catch up to scrolling sooner, while smaller values ease more slowly. Timing uses elapsed milliseconds so it behaves consistently across display refresh rates.
