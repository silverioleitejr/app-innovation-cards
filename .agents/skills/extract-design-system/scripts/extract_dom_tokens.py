"""Extract raw CSS tokens, computed typography, colors, and component styles from a live URL.

Supports Playwright headless rendering for SPAs (React/Next/Vite/Tailwind) with a fallback
to static HTML/CSS inspection when Playwright is unavailable.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import sys
from urllib.parse import urljoin
from urllib.request import Request, urlopen


EXTRACTION_JS = """
() => {
  const rootStyles = {};
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules || [])) {
        if (rule.selectorText && (rule.selectorText.includes(':root') || rule.selectorText.includes('body') || rule.selectorText.includes('html'))) {
          for (const prop of Array.from(rule.style || [])) {
            if (prop.startsWith('--')) {
              rootStyles[prop] = rule.style.getPropertyValue(prop).trim();
            }
          }
        }
      }
    } catch (e) {
      // Cross-origin stylesheet access blocked by CORS
    }
  }

  const pickProps = (el, props) => {
    const cs = window.getComputedStyle(el);
    const out = {};
    for (const p of props) {
      out[p] = cs.getPropertyValue(p);
    }
    return out;
  };

  const typographySelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'small', 'code', 'body'];
  const typography = {};
  for (const sel of typographySelectors) {
    const el = document.querySelector(sel);
    if (el) {
      typography[sel] = pickProps(el, [
        'font-family', 'font-size', 'font-weight', 'line-height',
        'letter-spacing', 'color', 'text-transform'
      ]);
    }
  }

  const componentSelectors = {
    header: 'header, nav, [role="navigation"]',
    button: 'button, [role="button"], input[type="submit"]',
    link: 'a[href]',
    input: 'input[type="text"], input[type="email"], input[type="search"], textarea, select',
    card: 'article, [class*="card"], [class*="panel"], section > div'
  };

  const components = {};
  for (const [name, sel] of Object.entries(componentSelectors)) {
    const els = Array.from(document.querySelectorAll(sel)).slice(0, 5);
    components[name] = els.map((el) => ({
      tag: el.tagName.toLowerCase(),
      className: typeof el.className === 'string' ? el.className : '',
      textSample: (el.innerText || '').trim().slice(0, 60),
      styles: pickProps(el, [
        'background-color', 'color', 'border', 'border-radius',
        'padding', 'margin', 'box-shadow', 'font-family', 'font-size',
        'font-weight', 'line-height', 'transition', 'backdrop-filter', 'gap', 'display'
      ])
    }));
  }

  const colors = { backgrounds: new Set(), texts: new Set(), borders: new Set(), shadows: new Set(), radii: new Set() };
  for (const el of Array.from(document.querySelectorAll('*')).slice(0, 400)) {
    const cs = window.getComputedStyle(el);
    const bg = cs.backgroundColor;
    const fg = cs.color;
    const bc = cs.borderColor;
    const sh = cs.boxShadow;
    const br = cs.borderRadius;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') colors.backgrounds.add(bg);
    if (fg) colors.texts.add(fg);
    if (bc && cs.borderWidth !== '0px') colors.borders.add(bc);
    if (sh && sh !== 'none') colors.shadows.add(sh);
    if (br && br !== '0px') colors.radii.add(br);
  }

  return {
    title: document.title,
    url: window.location.href,
    cssVariables: rootStyles,
    typography,
    palette: {
      backgrounds: Array.from(colors.backgrounds),
      texts: Array.from(colors.texts),
      borders: Array.from(colors.borders),
      shadows: Array.from(colors.shadows),
      radii: Array.from(colors.radii),
    },
    components
  };
}
"""


def extract_with_playwright(url: str) -> dict:
    """Render the page in headless Chromium and extract computed design tokens."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(url, wait_until="networkidle", timeout=30000)
        data = page.evaluate(EXTRACTION_JS)
        browser.close()
        return data


def extract_static_fallback(url: str) -> dict:
    """Fallback static HTML/CSS token extractor when Playwright is unavailable."""
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 (DesignSystemExtractor/1.0)"})
    with urlopen(req, timeout=20) as resp:
        html = resp.read().decode("utf-8", errors="replace")

    css_links = re.findall(r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']+)["\']', html, re.I)
    css_contents = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", html, re.I | re.S))

    for href in css_links[:10]:
        full_url = urljoin(url, href)
        try:
            css_req = Request(full_url, headers={"User-Agent": "Mozilla/5.0"})
            with urlopen(css_req, timeout=15) as css_resp:
                css_contents += "\n" + css_resp.read().decode("utf-8", errors="replace")
        except Exception:
            continue

    css_vars = dict(re.findall(r"(--[a-zA-Z0-9_-]+)\s*:\s*([^;\}]+)", css_contents))
    hex_colors = sorted(set(re.findall(r"#[0-9a-fA-F]{3,8}\b", css_contents)))
    rgb_colors = sorted(set(re.findall(r"rgba?\([^)]+\)", css_contents)))
    hsl_colors = sorted(set(re.findall(r"hsla?\([^)]+\)", css_contents)))
    font_families = sorted(set(re.findall(r"font-family\s*:\s*([^;\}]+)", css_contents)))

    return {
        "mode": "static_fallback",
        "url": url,
        "cssVariables": css_vars,
        "palette": {
            "hex": hex_colors,
            "rgb": rgb_colors,
            "hsl": hsl_colors,
        },
        "fontFamilies": font_families,
    }


def main() -> int:
    """CLI entrypoint for extracting design system tokens from a target URL."""
    parser = argparse.ArgumentParser(description="Extract raw Design System tokens from a URL.")
    parser.add_argument("url", help="Target website URL to inspect")
    parser.add_argument("--out", default="raw-extraction.json", help="Output JSON path")
    args = parser.parse_args()

    try:
        data = extract_with_playwright(args.url)
    except Exception as exc:
        print(f"[warn] Playwright unavailable or failed ({exc}); using static CSS fallback.", file=sys.stderr)
        data = extract_static_fallback(args.url)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Saved raw design extraction to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
