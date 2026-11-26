---
name: extract-design-system
description: Captura a identidade visual, tokens CSS e componentes interativos a partir de uma URL para gerar um Design System reutilizável (DESIGN.md, tokens.json, tokens.css e preview.html). Use sempre que o usuário pedir para clonar, extrair, mapear ou documentar o design system, paleta de cores, tipografia ou tokens visuais de um site ou aplicação web.
---

# Extract Design System

Você é um especialista em Design Systems e Engenharia de Frontend. Sua tarefa é extrair fielmente a linguagem visual e os padrões de UI de uma URL fornecida pelo usuário e transformá-los em artefatos reutilizáveis para reprodução em novos projetos.

## Regras Fundamentais
- **Fidelidade estrita:** Extraia apenas valores reais encontrados no código-fonte, stylesheets ou estilos computados da URL. Nunca invente cores, fontes ou medidas.
- **Renderização dinâmica:** Se um `fetch` simples retornar HTML vazio ou classes utilitárias sem CSS compilado (ex.: SPAs em React/Next/Vite/Tailwind), utilize ferramentas de navegador headless disponíveis no ambiente (Playwright, Puppeteer, browser subagent ou o script auxiliar em `scripts/extract_dom_tokens.py`) para capturar o DOM renderizado e `getComputedStyle`.
- **Organização de saída:** Salve todos os arquivos gerados dentro de `docs/design-system/<slug-do-site>/`.

---

## Fluxo de Execução

### Etapa 1: Coleta de Tokens Brutos
Analise os estilos da página (utilizando `scripts/extract_dom_tokens.py <URL>` quando Playwright estiver disponível, ou inspecionando stylesheets e computed styles via browser) e consolide os seguintes grupos de tokens:
1. **Cores:** Backgrounds, superfícies, textos (primário, secundário, muted), cores de marca/destaque, bordas e estados semânticos (sucesso, alerta, erro). Registre os valores exatos (HEX, RGB ou HSL) e os nomes das variáveis CSS originais, se existirem.
2. **Tipografia:** `font-family` (display, body, mono), escala de `font-size`, `font-weight`, `line-height` e `letter-spacing` por hierarquia (`h1`–`h6`, `body`, `small`, `caption`).
3. **Espaçamento e Grid:** Largura máxima de container, colunas de grid e valores recorrentes de `padding`, `margin` e `gap`.
4. **Formas e Elevação:** Escala de `border-radius`, estilos de borda, `box-shadow` e efeitos como `backdrop-filter`.
5. **Motion e Transições:** Valores de `transition-duration`, `transition-timing-function` e animações relevantes.

### Etapa 2: Mapeamento de Componentes e Estados Interativos
Inspecione os padrões de interface recorrentes na URL e documente estrutura e comportamento para:
- **Navegação:** Header, links de menu, menus mobile.
- **Botões:** Variantes (primário, secundário, outline, ghost) e tamanhos.
- **Formulários:** Inputs de texto, selects, checkboxes, labels e mensagens de validação.
- **Containers:** Cards, badges/pills, alertas e modais/tooltips.

Para cada componente, extraia explicitamente os estilos dos estados:
- `default` (repouso)
- `:hover`
- `:focus` / `:focus-visible`
- `:active`
- `:disabled`

### Etapa 3: Exportação dos Artefatos Reutilizáveis
Gere quatro arquivos na pasta `docs/design-system/<slug-do-site>/`:

1. **`tokens.css`**: Arquivo CSS puro contendo todas as variáveis organizadas dentro de `:root` (e seletor de tema escuro `[data-theme="dark"]` ou `.dark`, caso o site suporte).
   ```css
   :root {
     /* Colors - Surfaces & Backgrounds */
     --color-bg-primary: ...;
     --color-surface-card: ...;
     /* Colors - Text */
     --color-text-primary: ...;
     --color-text-secondary: ...;
     /* Colors - Brand & Semantic */
     --color-brand-primary: ...;
     /* Typography */
     --font-sans: ...;
     /* Spacing, Radius, Shadows & Motion */
     --radius-md: ...;
     --shadow-sm: ...;
     --transition-fast: ...;
   }
   ```

2. **`tokens.json`**: Estrutura JSON semântica (formato W3C Design Tokens, utilizando `$value` e `$type`) espelhando `tokens.css`.
   ```json
   {
     "color": {
       "background": {
         "primary": { "$value": "#ffffff", "$type": "color", "originalVar": "--bg-primary" }
       }
     },
     "typography": {
       "fontFamily": {
         "sans": { "$value": "Inter, sans-serif", "$type": "fontFamily" }
       }
     }
   }
   ```

3. **`DESIGN.md`**: Documentação completa para orientar futuras gerações de código por IA, contendo:
   - Resumo da direção estética e princípios visuais do site (URL de origem e data da extração).
   - Tabelas completas de tokens (cores, tipografia, espaçamentos, bordas, sombras, motion).
   - Anatomia e regras de uso de cada componente e seus estados interativos (`default`, `:hover`, `:focus-visible`, `:active`, `:disabled`).
   - Instruções curtas de como aplicar este sistema ao criar novas páginas (seja com Tailwind CSS, `django-cotton` ou CSS nativo).

4. **`preview.html`**: Página HTML única e auto-contida que importa `tokens.css` (ou embute as variáveis) e renderiza um catálogo visual interativo com:
   - Swatches de cores com código HEX/RGB e nome do token;
   - Escala tipográfica renderizada (`h1`–`h6`, `body`, `small`, `caption`, `code`);
   - Amostras de sombras (`box-shadow`), raios de borda (`border-radius`) e espaçamentos;
   - Componentes funcionais testáveis (header, botões nas variantes extraídas, inputs de formulário, badges, cards e alertas com estados `:hover`, `:focus-visible` e cliques reais).

---

## Script Auxiliar de Extração (`scripts/extract_dom_tokens.py`)

Para extrair estilos computados reais de SPAs e páginas dinâmicas via Playwright, execute:

```bash
python .agents/skills/extract-design-system/scripts/extract_dom_tokens.py <URL> --out docs/design-system/<slug-do-site>/raw-extraction.json
```

O script captura variáveis CSS declaradas em `:root`, fontes carregadas, paleta computada dos elementos visíveis, hierarquia tipográfica (`h1`–`h6`, `p`, `small`) e estilos computados dos componentes interativos (`button`, `a`, `input`, `select`, `[role="button"]`, cards).

---

## Verificação Final
Antes de concluir, confirme que:
- Todos os 4 arquivos (`tokens.css`, `tokens.json`, `DESIGN.md` e `preview.html`) foram criados na pasta `docs/design-system/<slug-do-site>/`.
- O `preview.html` abre sem erros de sintaxe e reflete fielmente os tokens do `DESIGN.md`.
- Informe ao usuário o caminho dos arquivos gerados e como referenciar o `@DESIGN.md` nos próximos prompts.
