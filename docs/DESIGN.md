# DESIGN — Innovation Board

> **Documento:** DESIGN.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **Versão:** 1.0.0  
> **Data:** 2026-11-25  
> **Fonte de Extração:** `https://www.roche.com/` (`sdd-extract-site-design` em `2026-11-26T00:56:20.925Z`)  
> **JSON Bruto:** `docs/design-tokens.json`  
> **Nota:** Nome padronizado como `DESIGN.md` (não `DESIGN-SYSTEM.md`, conforme `GUIDELINE.md` §10)

---

## 1. Direção Estética

Identidade editorial limpa inspirada nos tokens extraídos de `https://www.roche.com/` combinada com as diretrizes do **Innovation Board** (`PRD.md` §6 e `NAMING-CONVENTION.md`):
- Superfícies claras em branco puro (`#ffffff`) e neutros quentes (`#fbfbfa`, `#f5f5f2`, `#fff7f5`), com divisórias sutis (`#dbd6d1`).
- Destaque primário em **Roche/Action Blue (`#0b41cd`)** para chamadas principais, foco interativo e pin `Voto +1`.
- Contraste tipográfico alto (`#000000` / `#21201f` sobre fundos claros) e estados semânticos bem definidos.

---

## 2. Tokens

### 2.1 Cores Principais e Superfícies

| Token CSS (Origem) | Valor HEX / RGB | Papel Visual |
|---|---|---|
| `--color-white` | `#ffffff` (`rgb(255, 255, 255)`) | Fundo principal do quadro colaborativo e cards |
| `--color-roche-grey-050` | `#fbfbfa` | Superfície neutra elevada / cabeçalhos secundários |
| `--color-background--default` / `--color-roche-grey-100` | `#f5f5f2` | Superfície neutra secundária e botão secundário em repouso |
| `--color-background--soft` / `--color-neutral-100` | `#fff7f5` | Superfície suave de destaque editorial |
| `--color-grey-200` | `#eae8e5` | Estado desabilitado e trilhas (`--track-fill`) |
| `--color-roche-grey-300` | `#dbd6d1` (`rgb(219, 214, 209)`) | Bordas *hairline* de colunas, cards e tabelas |
| `--color-roche-grey-400` | `#c2bab5` | Bordas secundárias e marcadores sutis |

### 2.2 Cores de Texto

| Token CSS (Origem) | Valor HEX / RGB | Papel Visual |
|---|---|---|
| `--color-text-primary` / `--color-black-900` | `#000000` (`rgb(0, 0, 0)`) | Títulos e texto principal de alto contraste |
| `--color-grey-900` | `#21201f` (`rgb(33, 32, 31)`) | Corpo de leitura densa |
| `--color-roche-grey-700` | `#544f4f` (`rgb(84, 79, 79)`) | Subtítulos e rótulos de formulário |
| `--color-roche-grey-600` | `#706b69` (`rgb(112, 107, 105)`) | Metadados, contadores e texto auxiliar |
| `--color-grey-500` | `#9d948e` (`rgb(157, 148, 142)`) | Placeholders e dicas discretas |

### 2.3 Cores Interativas e Semânticas

| Token CSS (Origem) | Valor HEX | Uso |
|---|---|---|
| `--color-roche-blue-600` / `--color-interactive--primary-idle` | `#0b41cd` | Ação primária, aba ativa, foco (`--color-interactive--focus`) e `Voto +1` |
| `--color-interactive--primary-hover` | `#052066` | Hover de ação primária e divisores fortes |
| `--color-dark-blue-900` | `#022366` | Ênfase institucional profunda |
| `--color-interactive--active` / `--color-shadow-blue-400` | `#5c80de` | Estado ativo / pressionado |
| `--color-interactive--secondary-hover` / `--color-shadow-blue-100` | `#d7e0f7` | Hover secundário e badge informativo |
| `--color-border--default` / `--color-shadow-blue-200` | `#aec0ee` | Borda de destaque / foco suave |
| `--color-alert-success` / `--color-green-400` | `#00724a` / `#00a17c` | Sucesso editorial, presença ativa e prontidão `3/3` *(alinhado a `#0f766e` no PRD)* |
| `--color-status--success` / `--color-alert-success-light` | `#00b458` / `#d2f3e3` | Indicador positivo e fundo leve de sucesso |
| `--color-status--warning` / `--color-warning-light` | `#ffd60c` / `#fff7ce` | Alerta de atenção e pendências parciais |
| `--color-error` / `--color-alert-error` / `--color-error-light` | `#ff1f26` / `#b8002c` / `#ffd2d4` | Bloqueio da Trava de Qualidade, votação fechada e ações destrutivas |

### 2.4 Tipografia

- **Famílias extraídas na referência (`roche.com`):** `roche-sans` (interface e títulos) e `roche-serif` (destaques editoriais).
- **Mapeamento web open-source no projeto (`PRD.md` §6 / `NAMING-CONVENTION.md`):**
  - **Display / Títulos:** `Outfit`, `sans-serif`
  - **Corpo / Interface:** `Plus Jakarta Sans`, `sans-serif`
  - **Dados Tabulares / IDs / Timestamps / Hashes:** `JetBrains Mono` (`tabular-nums`)
- **Pesos (`font-weight`):** `200` (light display), `400` (regular), `600` (semibold), `700` (bold).
- **Escala Tipográfica Extraída:**
  - Display / Hero: `61px` (`line-height: 70px`), `48px` (`line-height: 58px`)
  - Títulos de seção: `30px` (`line-height: 40px`), `26px` (`line-height: 32px`), `20px` (`line-height: 30px`)
  - Corpo (`--body-font-size-*`): `18px` (`1.125rem`) a `20px` (`1.25rem`), compacto `16px` (`1rem`, `line-height: 24px`)
  - Labels e Captions (`--caption-font-size-small-up` / `--footnotes-*`): `14px` (`0.875rem`, `line-height: 20px`) e metadados densos `12px` (`line-height: 16px`)

### 2.5 Espaçamento e Grid

- **Gaps principais (`gap`):** `8px`, `16px`, `24px`, `32px` (e `--bulma-column-gap: 0.75rem` / `12px`; `--pipeline-lane-row-gap: 0.25rem` / `4px`).
- **Paddings recorrentes:**
  - Chips / Badges compactos: `4px 8px`, `4px 12px`, `5px 10px`
  - Botões e controles: `8px`, `12px 20px`, `12px 30px`, `15px 24px`
  - Cards e painéis: `16px 24px`, `24px 16px`, `24px`, `40px`
- **Margens estruturais:** `8px`, `16px`, `24px`, `32px`, `64px` (containers horizontais com respiro de `64px` a `96px` em desktop amplo).

### 2.6 Border Radius

- **Controles e Cards (`radii` extraídos):**
  - Micro-raios sutis: `2px`, `2.5px`, `3px`
  - Padrão de botões/cards/inputs: `6px`
  - Containers destacados: `17px`
  - Pills / Badges / Avatares: `50px` e `50%`

---

## 3. Componentes Base

- **Barra de Navegação Superior:** fundo `#ffffff`, borda inferior `#dbd6d1`, item ativo com destaque `#0b41cd`.
- **Botão Primário:** fundo `#0b41cd` (`--color-interactive--primary-idle`), texto `#ffffff`, hover `#052066`, foco visível `#0b41cd`, desabilitado `#eae8e5` com opacidade reduzida (`0.62`), `border-radius: 6px` (ou pill `50px` para CTAs cápsula).
- **Botão Secundário / Ghost:** fundo `#f5f5f2`, texto `#21201f`, hover `#d7e0f7`, borda `#dbd6d1` ou `#aec0ee`.
- **Cartão de Ideia (`IdeaCard`):** superfície `#ffffff`, borda `1px solid #dbd6d1`, `border-radius: 6px`, marcador colorido por disciplina, tipografia densa legível e barra de pins compacta.
- **Alertas e Badges de Status:**
  - Sucesso / Votação Aberta / Gate `3/3`: texto `#00724a` (ou `#0f766e`) sobre `#d2f3e3`.
  - Erro / Bloqueio de Gate / Votação Fechada: texto `#b8002c` / `#ff1f26` sobre `#ffd2d4` / `#f8d1d8`.
  - Info / Sessão: texto `#052066` sobre `#d7e0f7`.

---

## 4. Checklist de Revisão Visual

- [x] Tokens reais extraídos de `https://www.roche.com/` sem valores inventados
- [x] Contraste WCAG AA validado nas telas implementadas (`#000000`/`#21201f` sobre `#ffffff`/`#f5f5f2` e `#ffffff` sobre `#0b41cd`, alertas `#b8002c` sobre `#ffd2d4` e `#00724a` sobre `#d2f3e3`)
- [x] Responsividade verificada nas grades do Painel (`grid-cols-2`), Matriz e tabelas
- [x] Estados interativos cobertos (`default`, `:hover`, `:focus-visible`, `:active`, `:disabled`, `loading`, `empty`, `error`, `success`)
