# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Rohan Kapoor's personal academic site, served by GitHub Pages at https://rkapoor1512.github.io. It is a fork of the [academicpages](https://github.com/academicpages/academicpages.github.io) Jekyll theme (itself a fork of Minimal Mistakes). The site is published from the `master` branch — pushing to `master` triggers a GitHub Pages rebuild.

A working to-do list of intended site changes lives in `README.md` (full CV, blog posts, dark mode, Twitter link, etc.). Treat that as authoritative for outstanding site work.

## Running locally

```bash
bundle install                          # one-time, installs github-pages gem set
bundle exec jekyll serve -l -H localhost  # live-reload at http://localhost:4000
```

`_config.yml` is NOT reloaded automatically — restart `jekyll serve` after editing it.

JavaScript bundle (only needed if editing files in `assets/js/`):

```bash
npm install
npm run build:js    # uglifies + concatenates plugins + _main.js → assets/js/main.min.js
npm run watch:js    # rebuild on change
```

The site itself only loads `assets/js/main.min.js`, so source JS edits are invisible until you re-run the uglify build and commit the regenerated min file.

## Architecture

Standard Jekyll layout, but with four custom collections in addition to posts:

- `_publications/`, `_talks/`, `_teaching/`, `_portfolio/` — each markdown file is one entry. Configured as Jekyll collections in `_config.yml` with `output: true` and permalink `/:collection/:path/`. The landing pages for each live under `_pages/` (e.g. `_pages/publications.md` iterates over `site.publications`).
- `_posts/` — standard Jekyll blog posts; filename must be `YYYY-MM-DD-title.md`.
- `_pages/` — top-level pages (about, cv, blog, teaching, talks, publications, etc.). The nav bar that surfaces these is **not** auto-generated from `_pages/`; it is hand-edited in `_data/navigation.yml`, which is indentation-sensitive (YAML — a stray space silently breaks it; comment in the file calls this out).
- `_layouts/`, `_includes/`, `_sass/` — theme internals. `_layouts/single.html` is the default for most content; `_layouts/talk.html` is talk-specific. The author sidebar comes from `_includes/author-profile.html`, driven by the `author:` block in `_config.yml`.
- `_data/authors.yml`, `_data/ui-text.yml` — multi-author overrides and i18n strings.
- `images/`, `files/`, `assets/` — static assets. CV PDF is referenced from `navigation.yml` as `/assets/CV_Rohan__Last_updated_Feb2025_.pdf`.

### Bulk-generating publications/talks

`markdown_generator/` contains Jupyter notebooks and equivalent `.py` scripts that turn `publications.tsv` / `talks.tsv` (or a BibTeX file via `pubsFromBib.py`) into one markdown file per entry under `_publications/` or `_talks/`. Use these instead of hand-writing entries when adding many at once. The generated `.md` files are what the site actually serves; the TSV/BibTeX is only the source.

### Dark mode

Theme is toggled by a button in the masthead and persisted in `localStorage` under the key `"theme"`. The plumbing:

- `_includes/head/theme-init.html` — synchronous inline script in `<head>` (before the stylesheet) that reads `localStorage.theme`, falls back to `prefers-color-scheme`, and sets `data-theme` on `<html>` to avoid FOUC.
- `_sass/_dark.scss` — all dark-mode color overrides live here, scoped under `html[data-theme="dark"]`. The academicpages SCSS uses static `$` variables (not CSS custom properties), so each surface that needs theming is overridden by selector here. Also contains styling for the `.theme-toggle` button.
- `_includes/masthead.html` — the `<button class="theme-toggle">` lives at the end of `.greedy-nav`, positioned absolutely at the right edge.
- `assets/js/dark-mode.js` — wires the button, listens for OS-preference changes (only honored if the user hasn't picked explicitly).
- Loaded `defer` from `_includes/head.html`; **not** bundled into `main.min.js`.

When adding a new themed surface, add the override inside the `html[data-theme="dark"] { ... }` block in `_dark.scss`. The dark palette ($dark-bg, $dark-text, etc.) is defined at the top of that file.

### Math (MathJax)

MathJax 3 is loaded from CDN in `_includes/head/custom.html`. Inline delimiters are configured as both `$...$` and `\(...\)`; display is `$$...$$` and `\[...\]`. The config object is set on `window.MathJax` **before** the script tag — order matters. Code blocks and `<pre>` are in `skipHtmlTags` so math syntax inside fenced code is preserved verbatim.

Kramdown is configured with `input: GFM`. That means underscores inside `$...$` (e.g. `$f_n$`) can be eaten by kramdown's italic parser before MathJax sees them. Workarounds: escape (`$f\_n$`), use display math (`$$f_n$$`), or use `\(f_n\)`. `%` is still a LaTeX comment inside math — `$70%$` will break the closing delimiter.

### Known repo quirks

- `images/profile_pic.JPG` and `images/profile_pic.jpg` collide on case-insensitive filesystems (macOS default). `git clone` warns and only checks out one — keep this in mind before referencing either in front matter.
- `author.avatar` is `"file(1).png"` — unusual filename with parentheses.
- `description` in `_config.yml` currently ends in "test" ("Mathematics PhD student at Dartmouth test") — likely a leftover and is part of `<meta>` / page titles.
- `analytics.provider` is the string `"false"` (quoted), not the boolean — preserve when editing unless intentionally enabling analytics.
- The site is constrained to the GitHub Pages plugin whitelist (see `plugins:` and `whitelist:` in `_config.yml`). Adding a new Jekyll plugin generally won't work on GitHub Pages unless it's on that allowlist.
