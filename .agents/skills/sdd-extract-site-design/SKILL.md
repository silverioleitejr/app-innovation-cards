---
name: sdd-extract-site-design
description: Lê a URL de um website e extrai um JSON estruturado contendo os tokens do Design System (cores, tipografia, variáveis CSS, espaçamentos e bordas) usando o contrato extrair_design_tokens, consolidando opcionalmente em docs/DESIGN.md no padrão SDD. Use sempre que o usuário pedir para extrair design tokens de uma URL, inspecionar variáveis CSS/cores/fontes/espaçamentos de um site de referência ou popular o docs/DESIGN.md a partir de uma página web.
---

# Skill: sdd-extract-site-design

> **Documento:** SKILL.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **E-mail:** silverio.leitejr@og1.com.br · **Telefone:** (11) 96020-6334  
> **Versão:** 1.0.0  
> **Data:** 2026-11-25  

---

## 1. Missão

Acessar uma URL de referência, extrair de forma determinística os tokens visuais reais renderizados no navegador (**variáveis CSS**, **cores**, **tipografia**, **espaçamentos** e **raios de borda**) em formato JSON estruturado e, quando solicitado no fluxo SDD (Etapa 0 ou atualização visual), consolidar os tokens em `docs/DESIGN.md`.

- **Entrada obrigatória:** `url` completa (`http://` ou `https://`).
- **Saídas:**
  1. JSON estruturado de tokens (`extrair_design_tokens`), retornado na resposta ou salvo em arquivo quando solicitado.
  2. Atualização opcional de `docs/DESIGN.md` (seguindo `docs/templates/DESIGN-TEMPLATE.md`), mediante confirmação caso o arquivo já possua conteúdo customizado.
- **Não faz:** alterar código de produção (`src/`, `server.ts`), instalar pacotes sem aprovação humana (`AGENTS.md` §5), inventar valores visuais não presentes no DOM ou criar `DESIGN-SYSTEM.md` (proibido por `docs/GUIDELINE.md` §10).

---

## 2. Ordem de Leitura (Subconjunto Declaratório)

Conforme `docs/GUIDELINE.md` §4 e §10, esta skill utiliza o seguinte subconjunto:

1. `docs/GUIDELINE.md` §2.2 e §10 — papel e nomenclatura oficial de `docs/DESIGN.md`
2. `AGENTS.md` §5 e §9 — limites de aprovação humana (dependências e segurança)
3. `docs/DESIGN.md` — documento atual de identidade visual do projeto (se existir)
4. `docs/templates/DESIGN-TEMPLATE.md` — estrutura base para consolidação em Markdown
5. `docs/NAMING-CONVENTION.md` — alinhamento com convenções visuais do projeto

---

## 3. Contrato da Operação (`extrair_design_tokens`)

### 3.1 Schema de Entrada (Referência Canônica)

```json
{
  "name": "extrair_design_tokens",
  "description": "Lê a URL de um website e extrai um JSON contendo os tokens do Design System (cores, tipografia, variáveis CSS e espaçamentos).",
  "parameters": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "description": "A URL completa do site a ser analisado (ex: https://exemplo.com)"
      }
    },
    "required": ["url"]
  }
}
```

### 3.2 Schema de Saída (JSON Retornado)

```json
{
  "meta": {
    "url": "https://exemplo.com/",
    "title": "Título da Página",
    "extractedAt": "2026-11-25T21:49:00.000Z"
  },
  "tokens": {
    "cssVariables": {
      "--color-primary": "#0b41cd"
    },
    "colors": ["rgb(255, 255, 255)", "rgb(11, 65, 205)"],
    "typography": {
      "fontFamilies": ["Outfit, sans-serif", "Plus Jakarta Sans, sans-serif"],
      "fontSizes": ["14px", "16px", "24px"],
      "fontWeights": ["400", "600", "700"],
      "lineHeights": ["20px", "24px", "32px"]
    },
    "spacing": {
      "paddings": ["8px 16px", "24px"],
      "margins": ["0px 0px 16px"],
      "gaps": ["8px", "16px"]
    },
    "borders": {
      "radii": ["6px", "12px"]
    }
  }
}
```

---

## 4. Modos de Execução

### Modo A — Script Auxiliar Playwright (`extract-site-design.js`)

Quando `playwright` já estiver disponível no ambiente Node.js, execute o script empacotado junto à skill:

```bash
# Saída direta no stdout
node .agents/skills/sdd-extract-site-design/extract-site-design.js "https://exemplo.com"

# Ou salvando o JSON em arquivo
node .agents/skills/sdd-extract-site-design/extract-site-design.js "https://exemplo.com" --out docs/design-tokens.json
```

Também pode ser importado programaticamente em scripts auxiliares:

```javascript
import { extrairDesignTokens, extrair_design_tokens } from './extract-site-design.js';

const jsonTokens = await extrair_design_tokens('https://exemplo.com');
```

### Modo B — Fallback via Browser MCP (`browse`) ou Browser Subagent (Zero Dependências)

Caso o módulo `playwright` **não** esteja instalado no `node_modules` do projeto:
1. **Não instale `playwright` automaticamente** (novas dependências exigem aprovação humana explícita conforme `AGENTS.md` §5).
2. Utilize preferencialmente o servidor MCP `browse` (`execute` com `page.goto(url)` + `page.evaluate(...)` + `await page.close()`, após verificar `browse.status`) ou o `browser` subagent para abrir a `url` e avaliar a mesma coleta sobre `document.documentElement` e `getComputedStyle`, retornando exatamente a estrutura JSON da seção 3.2.

---

## 5. Fluxo de Execução Passo a Passo

1. **Validar Entrada:**
   - Confirmar que `url` foi informada e inicia com `http://` ou `https://`. Se faltar ou for inválida, solicitar a URL completa ao usuário antes de prosseguir.
2. **Coletar Tokens Reais:**
   - Executar o Modo A (`extract-site-design.js`) ou Modo B (fallback via navegador headless/subagent).
   - Extrair exclusivamente valores reais computados na página:
     - **Variáveis CSS (`:root` / stylesheets):** todas as custom properties `--*`.
     - **Cores:** `color`, `backgroundColor` (ignorando `rgba(0, 0, 0, 0)` / `transparent`) e `borderColor` relevantes.
     - **Tipografia:** `fontFamily`, `fontSize`, `fontWeight` e `lineHeight` de elementos semânticos (`body`, `h1`–`h6`, `p`, `a`, `button`, `input`, `code`).
     - **Espaçamentos:** valores recorrentes de `padding`, `margin` e `gap` em containers e controles visíveis.
     - **Bordas:** valores não nulos de `borderRadius`.
3. **Entregar o JSON Estruturado:**
   - Apresentar ou persistir o JSON no formato da seção 3.2.
4. **Consolidar em `docs/DESIGN.md` (quando aplicável ao projeto SDD):**
   - Se o usuário pedir para atualizar a identidade visual do projeto, mapear os tokens extraídos nas seções de `docs/DESIGN.md` (*Tokens*, *Componentes Base* e *Checklist de Revisão Visual*), citando `meta.url` e `meta.extractedAt`.
   - Se `docs/DESIGN.md` já possuir tokens customizados do projeto, mostrar o resumo das diferenças e pedir confirmação antes de sobrescrever.

---

## 6. Regras de Governança e Segurança

- **Fidelidade estrita:** nunca inventar cores, fontes ou espaçamentos que não tenham sido observados nos estilos da URL analisada.
- **Bloqueios anti-bot / CAPTCHA:** se a URL alvo exigir login privado, CAPTCHA ou bloquear acesso automatizado, interromper imediatamente a coleta e reportar o bloqueio ao usuário sem tentar contorná-lo.
- **Governança de dependências (`AGENTS.md` §5):** nunca executar `npm install playwright` no projeto sem autorização explícita do usuário.
- **Nomenclatura SDD (`GUIDELINE.md` §10):** o documento canônico de design no projeto é sempre `docs/DESIGN.md` (nunca `DESIGN-SYSTEM.md`).

---

## 7. Definition of Done (DoD)

- [ ] `url` validada (`http://` ou `https://`).
- [ ] Extração executada sem vazamento de processos de navegador (`browser.close()` garantido).
- [ ] JSON retornado contendo `meta` (`url`, `title`, `extractedAt`) e `tokens` (`cssVariables`, `colors`, `typography`, `spacing`, `borders`).
- [ ] Zero dependências instaladas sem aprovação humana.
- [ ] Se solicitada gravação documental, `docs/DESIGN.md` atualizado preservando o padrão SDD.

---

*Fonte da verdade mantida em `docs/skills/sdd-extract-site-design/SKILL.md` e publicada em `.agents/skills/sdd-extract-site-design/SKILL.md`.*
