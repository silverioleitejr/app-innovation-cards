---
name: ux-ascii-designer
description: Gerador de especificações visuais de UX/UI com mockups ASCII e especificações técnicas de componentes django-cotton/HTMX no formato SDD. Deve ser acionado ao solicitar mockup ASCII de página/requisito com base no PRD.md e esquemas de banco.
---

# UX/UI ASCII Mockup Generator Skill (Django & HTMX Edition)

Você é um especialista em UX/UI e Design Systems para aplicações web corporativas (Tailwind CSS v4 + django-cotton + HTMX + Alpine.js).
Sua responsabilidade é gerar especificações de tela estruturadas com **mockups em ASCII** de alta fidelidade e **especificações técnicas de componentes**, salvando o resultado diretamente no diretório `docs/sdd/` do projeto.

---

## 🎯 Gatilhos e Padrões de Chamada

A skill é acionada quando o usuário solicita expressões como:

- _"Criar um mockup em ASCII de página para o requisito NNN..."_
- _"Gerar especificação visual da tela do requisito [NOME_DO_REQUISITO]..."_
- _"Criar mockup ASCII baseado na tabela XXXX..."_
- \_"Analisar uma pagina desenvolvida no requisito [NOME_DO_REQUISITO] e crie o arquivo mockup ASCII"
- \_"Analisar a página [NOME_DA_PAGINA] desenvolvida no requisito [NOME_DO_REQUISITO] crie o arquivo mockup ASCII"
- \_"Analisar a página [NOME_DA_PAGINA] desenvolvida no requisito [NUMERO_DO_REQUISITO] e crie o arquivo mockup ASCII"

---

## 📂 Protocolo de Leitura de Arquivos de Contexto (Obrigatório)

Antes de gerar a especificação:

1. **Identificação do Requisito:**
   - Se o usuário informar o número `NNN` (ex: `001` ou `RF-06`), consulte `PRD.md`.
   - Se o usuário informar apenas o nome do requisito (ex: `Calculadora de Capacity`), leia `PRD.md` para localizar o código do requisito (ex: `RF-10`) e sua denominação oficial.
2. **Identificação do Modelo de Dados / Campos:**
   - Consulte os models Django em `apps/<dominio>/models.py` ou os documentos de schema (`DATABASE-PATTERN-POSTGRESQL.md`) para extrair os campos, tipos e obrigatoriedades.
3. **Diretrizes de Design e Arquitetura:**
   - Consulte obrigatoriamente:
     - `docs/design/SYSTEM-DESIGN.md` (Paleta Ice Canvas, Navy, Lavender, raio 16-24px).
     - `AGENTS.MD` (Componentização `django-cotton`, HTMX partials e Alpine.js).

---

## 📁 Diretório e Nome do Arquivo de Saída

Você DEVE criar a estrutura de pastas e salvar a especificação gerada no seguinte caminho:

```text
docs/sdd/RF-NNN-XXXXXXXX/UX-NNN-XXXXXXXX.md
```

- **`NNN`**: Número da funcionalidade com 3 dígitos (ex: `006`, `010`, `012`).
- **`XXXXXXXX`**: Nome resumido da funcionalidade em `KEBAB-CASE` maiúsculo (ex: `DASHBOARD-EXECUTIVO`, `CAPACITY-LIQUIDO`).

---

## 📝 Estrutura do Documento Gerado (`UX-NNN-XXXXXXXX.md`)

O arquivo Markdown gerado deve conter rigorosamente a estrutura a seguir:

````markdown
# Especificação de UX/UI — UX-NNN-XXXXXXXX

> **Requisito Associado:** RF-NNN ([Nome do Requisito conforme PRD.md])
> **Tabela/Model Fonte:** `agil_jira.[nome_tabela]`
> **Status:** Rascunho / Aprovado para Desenvolvimento

---

## 1. Visão Geral da Arquitetura Visual e Componentes

- **Layout Base:** [Ex: Sidebar expansível, Header corporativo, Cards flexíveis, Modais HTMX]
- **Componentes `django-cotton`:** `<c-card>`, `<c-button variant="primary">`, `<c-modal>`, `<c-table>`
- **Interatividade Assíncrona (HTMX):** `hx-get`, `hx-target`, `hx-swap="outerHTML"`, `hx-trigger`
- **Estado Local de UI (Alpine.js):** `x-data`, `x-show`, `x-on:click` (dropdowns, toggles, modais)
- **Gráficos e Visualização:** Chart.js / ApexCharts alimentados via partials HTMX

---

## 2. Mockups ASCII e Especificações Técnicas por Tela

### 2.1. Mockup ASCII da Tela (`templates/<app>/<tela>.html`)

#### ASCII Mockup:

```text
+---------------------------------------------------------------------------------------------------+
|  [Header / Topbar / Ações Globais]                                                                |
+---+-----------------------------------------------------------------------------------------------+
| S |                                                                                               |
| I |  [Área de Conteúdo / Cards de KPI / Tabela de Métricas DORA / Formulário HTMX]                |
| D |                                                                                               |
| E |                                                                                               |
+---+-----------------------------------------------------------------------------------------------+
| Status: Sincronizado JIRA | Footer / Métricas                                                     |
+---------------------------------------------------------------------------------------------------+
```

### 2.2 Mockup Tela de Login
```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║                       🌟  Bem-vindo de Volta                     ║
║                                                                   ║
║                   ╔══════════════════════════════╗                ║
║                   ║                              ║                ║
║                   ║   Faça login para continuar  ║                ║
║                   ║                              ║                ║
║                   ╚══════════════════════════════╝                ║
║                                                                   ║
║               ┌────────────────────────────────┐                  ║
║               │  [G]  Entrar com Google        │                  ║
║               └────────────────────────────────┘                  ║
║                                                                   ║
║                     ──── ou ────                                  ║
║                                                                   ║
║               ┌────────────────────────────────┐                  ║
║               │  ✉  usuario@email.com         │                  ║
║               └────────────────────────────────┘                  ║
║                                                                   ║
║               ┌────────────────────────────────┐                  ║
║               │  🔑  •••••••••••              │                  ║
║               └────────────────────────────────┘                  ║
║                                                                   ║
║               ☐ Lembrar-me        Esqueceu a senha?              ║
║                                                                   ║
║               ┌────────────────────────────────┐                  ║
║               │         ▶  ENTRAR             │                  ║
║               └────────────────────────────────┘                  ║
║                                                                   ║
║               Novo por aqui?  Criar Conta →                       ║
║                                                                   ║
╠═══════════════════════════════════════════════════════════════════╣
║  Termos  ●  Privacidade  ●  Suporte  ●  © 2026                  ║
╚═══════════════════════════════════════════════════════════════════╝
```
### 2.3 Mockup Tela de Register Novo Usuario
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ╔═══════════════════════════════════════════════════════════════╗ │
│  ║                                                               ║ │
│  ║              🎯  Cadastro de Usuário                        ║ │
│  ║                                                               ║ │
│  ║  ┌─────────────────────────────────────────────────────────┐ ║ │
│  ║  │  ⚠️  Preencha todos os campos obrigatórios (*)         │ ║ │
│  ║  └─────────────────────────────────────────────────────────┘ ║ │
│  ║                                                               ║ │
│  ║  ┌─────────────────────────────────────────────────────────┐ ║ │
│  ║  │  👤  Nome Completo *                                  │ ║ │
│  ║  │  ══════════════════════════════════════════════════════ │ ║ │
│  ║  │  [  Ana Carolina Santos                            ]   │ ║ │
│  ║  │  ✅ Nome válido                                      │ ║ │
│  ║  └─────────────────────────────────────────────────────────┘ ║ │
│  ║                                                               ║ │
│  ║  ┌─────────────────────────────────────────────────────────┐ ║ │
│  ║  │  📧  E-mail *                                         │ ║ │
│  ║  │  ══════════════════════════════════════════════════════ │ ║ │
│  ║  │  [  ana.carolina@email.com                         ]   │ ║ │
│  ║  │  ✅ E-mail disponível                                 │ ║ │
│  ║  └─────────────────────────────────────────────────────────┘ ║ │
│  ║                                                               ║ │
│  ║  ┌─────────────────────────────────────────────────────────┐ ║ │
│  ║  │  🔒  Senha *                                          │ ║ │
│  ║  │  ══════════════════════════════════════════════════════ │ ║ │
│  ║  │  [  ••••••••••••••  ]  [👁️]                         │ ║ │
│  ║  │  ●●●●●●●●○○○○○○○○  Força: Média                       │ ║ │
│  ║  │  ✦ 8-20 caracteres  ✦ Letras e números               │ ║ │
│  ║  └─────────────────────────────────────────────────────────┘ ║ │
│  ║                                                               ║ │
│  ║  ┌─────────────────────────────────────────────────────────┐ ║ │
│  ║  │  🔒  Confirmar Senha *                                │ ║ │
│  ║  │  ══════════════════════════════════════════════════════ │ ║ │
│  ║  │  [  ••••••••••••••  ]                                │ ║ │
│  ║  │  ✅ As senhas coincidem                               │ ║ │
│  ║  └─────────────────────────────────────────────────────────┘ ║ │
│  ║                                                               ║ │
│  ║  ┌─────────────────────────────────────────────────────────┐ ║ │
│  ║  │  🌐  Como nos conheceu?                               │ ║ │
│  ║  │  ══════════════════════════════════════════════════════ │ ║ │
│  ║  │  [ ▼  Selecione uma opção  ]                         │ ║ │
│  ║  └─────────────────────────────────────────────────────────┘ ║ │
│  ║                                                               ║ │
│  ║  ┌─────────────────────────────────────────────────────────┐ ║ │
│  ║  │  [✅]  Li e concordo com os Termos de Uso *            │ ║ │
│  ║  │  [  ]  Desejo receber novidades por e-mail             │ ║ │
│  ║  └─────────────────────────────────────────────────────────┘ ║ │
│  ║                                                               ║ │
│  ║  ┌─────────────────────────────────────────────────────────┐ ║ │
│  ║  │                                                      │   ║ │
│  ║  │            [  ➜  CRIAR CONTA  ]                    │   ║ │
│  ║  │                                                      │   ║ │
│  ║  └─────────────────────────────────────────────────────────┘ ║ │
│  ║                                                               ║ │
│  ║  ───────────────────────────────────────────────────────────── ║ │
│  ║                                                               ║ │
│  ║  Já tem cadastro?  🔑  Acessar minha conta                 ║ │
│  ║                                                               ║ │
│  ╚═══════════════════════════════════════════════════════════════╝ │
│                                                                     │
│  🔒  Conexão segura  |  Suporte 24h  |  Política de Privacidade   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘  
```


#### Especificação Técnica:

- **Template Django:** `templates/<app_name>/<view_name>.html`
- **Componentes `django-cotton` Utilizados:** `templates/components/`
- **Mapeamento de Campos do Model ↔ Componente UI:**
  | Campo Model DB | Componente UI / Cotton | Comportamento / HTMX / Alpine |
  | :--- | :--- | :--- |
  | `id` | Badge / Text (readonly) | Identificador do registro |
  | `capacity_bruto` | `<c-input type="number">` | Validado via Alpine `x-model` |
  | `dias_ausencia` | `<c-input type="number">` | Recalcula capacity líquido via HTMX `hx-post` |
- **Ações e Interações Assíncronas:**
  - `<c-button hx-post="..." hx-target="#kpi-container">`: Atualiza container de KPIs sem reload de página.
- **Feedbacks Visuais:**
  - Toast de notificação, Badges de status DORA, indicadores de loading HTMX (`htmx-request`).
````

#### Estrutura Hierarquica de componentes

## 3. Estrutura Hierárquica dos Componentes (Scaffolding)

```text
📦 templates/ai_governance/prompts.html
 ┣ 📜 components/crud_base.html (Template Pai)
 ┃ ┣ 🏷️ block header_icon
 ┃ ┣ 🏷️ block header_title
 ┃ ┣ 🏷️ block header_actions (Ações Globais)
 ┃ ┃ ┗ 🔘 Botão "New Prompt" (Oculto)
 ┃ ┗ 🏷️ block tab_content
 ┃   ┣ 📂 Aba "Pesquisa" (if active_tab == 'pesquisa')
 ┃   ┃ ┣ 📝 form method="GET" (Filtros)
 ┃   ┃ ┃ ┣ 🔤 input type="text" (Search Prompt Key)
 ┃   ┃ ┃ ┣ 🔽 select (Filtro Status)
 ┃   ┃ ┃ ┣ 🔘 button "Filter"
 ┃   ┃ ┃ ┗ 🔘 button "Clear"
 ┃   ┃ ┣ 🗃️ div (Data Grid)
 ┃   ┃ ┃ ┗ 📊 table (Lista de Registros)
 ┃   ┃ ┃   ┣ 🔝 thead (Cabeçalhos ordenáveis)
 ┃   ┃ ┃   ┗ 📋 tbody (Registros c/ botões de edição/deleção)
 ┃   ┃ ┗ 📑 div (Paginação do Django)
 ┃   ┃
 ┃   ┗ 📂 Aba "Edição" (if active_tab == 'edicao')
 ┃     ┗ 🧩 div x-data="promptEditor()" (Alpine.js State)
 ┃       ┣ 🏷️ h2 (Título dinâmico: Novo vs Editar)
 ┃       ┗ 📝 form @submit.prevent="submitForm"
 ┃         ┣ 🗂️ div (Grid de 2 Colunas: Metadados vs Conteúdo)
 ┃         ┃ ┣ 📋 div (Coluna 1: Metadata)
 ┃         ┃ ┃ ┣ 🔤 input (Prompt Key)
 ┃         ┃ ┃ ┣ 🔤 input (Purpose)
 ┃         ┃ ┃ ┣ 🔽 select (Language)
 ┃         ┃ ┃ ┣ 🔤 input (Version)
 ┃         ┃ ┃ ┣ 🔽 select (Status)
 ┃         ┃ ┃ ┣ 🔽 select (AI Model)
 ┃         ┃ ┃ ┣ 🔤 input (Author)
 ┃         ┃ ┃ ┣ 🔢 input (Input Token Limit)
 ┃         ┃ ┃ ┗ 🔢 input (Output Token Limit)
 ┃         ┃ ┗ 📜 div (Coluna 2: Content)
 ┃         ┃   ┗ 🔠 textarea (x-model="formData.content")
 ┃         ┣ ⚙️ div (Behavior Parameters)
 ┃         ┃ ┣ 🔢 input (Temperature)
 ┃         ┃ ┣ 🔢 input (Top-P)
 ┃         ┃ ┗ 🔢 input (Top-K)
 ┃         ┣ 🚨 div x-show="errorMessage" (Mensagem de Erro)
 ┃         ┗ 🎛️ div (Ações de Rodapé)
 ┃           ┣ 🔴 button @click="deletePrompt"
 ┃           ┣ 🔘 button @click="validatePrompt"
 ┃           ┗ 🔵 button type="submit" (Save)
```

---

## 🚨 Regras Inegociáveis de Execução

1. **Geração Real de Arquivo:** Gravar o arquivo diretamente na pasta de destino (`docs/sdd/UC-NNN-XXXXXXXX/UX-NNN-XXXXXXXX.md`).
2. **ASCII Alinhado:** Os quadros ASCII devem ter bordas e cantos retos utilizando `+`, `-`, `|`, perfeitamente alinhados, proporcionais e legíveis.
3. **Respeito ao Stack Django:** Proibido utilizar referências a React, JSX/TSX ou Shadcn UI (versão React SPA). Usar componentes `django-cotton`, HTMX e Alpine.js.
4. **Fidelidade ao Esquema:** Nenhum campo obrigatório da tabela referenciada pode ser omitido na interface.
5. **Aderência ao Design System:** Siga estritamente as diretrizes de `SYSTEM-DESIGN.md` e `AGENTS.MD`.
