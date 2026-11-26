import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

/**
 * Valida se a URL informada possui protocolo HTTP/HTTPS válido.
 * @param {string} rawUrl - URL completa a ser inspecionada.
 * @returns {string} URL normalizada.
 */
function validateUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('O parâmetro obrigatório "url" deve ser uma string não vazia.');
  }
  const parsed = new URL(rawUrl.trim());
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Protocolo não suportado (${parsed.protocol}). Use http:// ou https://.`);
  }
  return parsed.toString();
}

/**
 * Lê a URL de um website e extrai um JSON contendo os tokens do Design System
 * (cores, tipografia, variáveis CSS, espaçamentos e raios de borda).
 *
 * @param {string} url - A URL completa do site a ser analisado (ex: https://exemplo.com).
 * @returns {Promise<string>} JSON formatado contendo metadados e tokens extraídos.
 */
export async function extrairDesignTokens(url) {
  const targetUrl = validateUrl(url);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const result = await page.evaluate(() => {
      const rootStyles = getComputedStyle(document.documentElement);
      const cssVariables = {};

      // 1. Extrai variáveis CSS declaradas em :root e stylesheets acessíveis
      for (let i = 0; i < rootStyles.length; i++) {
        const prop = rootStyles[i];
        if (prop.startsWith('--')) {
          cssVariables[prop] = rootStyles.getPropertyValue(prop).trim();
        }
      }

      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule.style) {
              for (let i = 0; i < rule.style.length; i++) {
                const prop = rule.style[i];
                if (prop.startsWith('--') && !(prop in cssVariables)) {
                  cssVariables[prop] = rule.style.getPropertyValue(prop).trim();
                }
              }
            }
          }
        } catch {
          // Ignora folhas de estilo cross-origin bloqueadas por CORS
        }
      }

      // 2. Extrai estilos computados reais dos elementos semânticos e de layout
      const elements = document.querySelectorAll(
        'body, header, main, section, nav, div, h1, h2, h3, h4, h5, h6, p, a, button, input, code'
      );
      const colors = new Set();
      const fontFamilies = new Set();
      const fontSizes = new Set();
      const fontWeights = new Set();
      const lineHeights = new Set();
      const paddings = new Set();
      const margins = new Set();
      const gaps = new Set();
      const borderRadii = new Set();

      const isNonZeroBoxValue = (val) => val && val !== '0px' && val !== 'normal' && val !== 'none';

      elements.forEach((el) => {
        const style = getComputedStyle(el);

        if (style.color) colors.add(style.color);
        if (
          style.backgroundColor &&
          style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
          style.backgroundColor !== 'transparent'
        ) {
          colors.add(style.backgroundColor);
        }
        if (
          style.borderTopWidth !== '0px' &&
          style.borderTopColor &&
          style.borderTopColor !== 'rgba(0, 0, 0, 0)'
        ) {
          colors.add(style.borderTopColor);
        }

        if (style.fontFamily) fontFamilies.add(style.fontFamily);
        if (style.fontSize) fontSizes.add(style.fontSize);
        if (style.fontWeight) fontWeights.add(style.fontWeight);
        if (isNonZeroBoxValue(style.lineHeight)) lineHeights.add(style.lineHeight);

        if (isNonZeroBoxValue(style.padding)) paddings.add(style.padding);
        if (isNonZeroBoxValue(style.margin)) margins.add(style.margin);
        if (isNonZeroBoxValue(style.gap)) gaps.add(style.gap);

        if (isNonZeroBoxValue(style.borderRadius)) {
          borderRadii.add(style.borderRadius);
        }
      });

      return {
        meta: {
          url: window.location.href,
          title: document.title,
          extractedAt: new Date().toISOString(),
        },
        tokens: {
          cssVariables,
          colors: Array.from(colors),
          typography: {
            fontFamilies: Array.from(fontFamilies),
            fontSizes: Array.from(fontSizes),
            fontWeights: Array.from(fontWeights),
            lineHeights: Array.from(lineHeights),
          },
          spacing: {
            paddings: Array.from(paddings),
            margins: Array.from(margins),
            gaps: Array.from(gaps),
          },
          borders: {
            radii: Array.from(borderRadii),
          },
        },
      };
    });

    return JSON.stringify(result, null, 2);
  } finally {
    await browser.close();
  }
}

/** Alias snake_case aderente ao contrato JSON extrair_design_tokens. */
export const extrair_design_tokens = extrairDesignTokens;

// Execução direta via CLI: node extract-site-design.js <url> [--out <arquivo.json>]
const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
  const args = process.argv.slice(2);
  const urlArg = args.find((arg) => !arg.startsWith('--'));
  const outIdx = args.indexOf('--out');
  const outPath = outIdx !== -1 ? args[outIdx + 1] : null;

  if (!urlArg) {
    console.error('Uso: node extract-site-design.js <url> [--out <caminho.json>]');
    process.exit(1);
  }

  extrairDesignTokens(urlArg)
    .then((json) => {
      if (outPath) {
        const resolvedOut = path.resolve(process.cwd(), outPath);
        fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });
        fs.writeFileSync(resolvedOut, `${json}\n`, 'utf-8');
        console.log(`Tokens salvos em: ${resolvedOut}`);
      } else {
        console.log(json);
      }
    })
    .catch((err) => {
      console.error(`Falha ao extrair design tokens: ${err.message}`);
      process.exit(1);
    });
}
