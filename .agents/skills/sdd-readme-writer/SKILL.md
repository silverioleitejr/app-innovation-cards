---
name: sdd-readme-writer
description: Cria ou atualiza o artefato README.md padronizado no modelo canônico SDD, incluindo badges Shields.io das tecnologias reais do projeto, visão geral das funcionalidades, tabela de stack e identidade visual, guia de execução local, tabela de scripts, árvore de estrutura com Ordem de Leitura Canônica e lista de skills SDD. Use sempre que o usuário pedir para criar, gerar, atualizar, revisar ou padronizar o README.md de um projeto.
---

# Skill: sdd-readme-writer

> **Documento:** SKILL.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **E-mail:** silverio.leitejr@og1.com.br · **Telefone:** (11) 96020-6334  
> **Versão:** 1.0.0  
> **Data:** 2026-11-26  

---

## 1. Missão

Produzir ou atualizar o arquivo `README.md` na raiz do repositório seguindo estritamente o template padronizado em `assets/README-TEMPLATE.md`, garantindo que todas as informações (versões, badges, funcionalidades, comandos, portas, endpoints, estrutura de pastas e skills) sejam extraídas de fontes reais do projeto — nunca inventadas.

- **Saída obrigatória:** `README.md` na raiz do projeto, em português (documentação em português; nomes de scripts, comandos e identificadores técnicos preservados no original, conforme `AGENTS.md` §2).
- **Não faz:** alterar código de produção, instalar dependências, inventar requisitos/scripts/URLs inexistentes ou expor segredos (`.env`, tokens, senhas reais de produção).

---

## 2. Fontes de Verdade e Ordem de Leitura

Antes de redigir ou atualizar `README.md`, leia apenas os arquivos existentes no projeto nesta ordem:

1. **Template canônico desta skill:** `assets/README-TEMPLATE.md`
2. **Governança e links institucionais:** `AGENTS.md` e `docs/GUIDELINE.md` (§4 Ordem de Leitura Canônica)
3. **Escopo funcional e arquitetura:** `docs/PRD.md` e `docs/SAD.md`
4. **Identidade visual (se existir):** `docs/DESIGN.md` (capturar cor primária hex, fontes e origem dos tokens)
5. **Manifesto de dependências e scripts:** `package.json`, `pyproject.toml`, `requirements.txt`, `Cargo.toml` ou equivalente real do projeto
6. **Configuração de ambiente e git:** `.env.example` (nunca `.env`) e `git remote -v` (para URL do repositório)
7. **Estrutura real de arquivos e skills:** diretórios reais da raiz, `docs/`, `.agents/skills/` e `docs/skills/`

---

## 3. Estrutura Obrigatória do `README.md`

Use sempre as 6 seções numeradas e o cabeçalho padronizado de `assets/README-TEMPLATE.md`:

1. **Cabeçalho (`# <Nome do Produto>`)**
   - Bloco de badges Shields.io (`style=for-the-badge`) imediatamente abaixo do `H1`
   - Resumo executivo de 1 parágrafo descrevendo propósito, domínio e metodologia **Spec-Driven Development (SDD)**
   - Lista curta de links canônicos: **Repositório**, **Contrato Operacional SDD** (`AGENTS.md` · `docs/GUIDELINE.md`) e **Identidade Visual** (`docs/DESIGN.md`, se existir)
2. **`## 1. Visão Geral das Funcionalidades`**
   - Lista com *bullet points* objetivos derivados de `docs/PRD.md` e das telas/fluxos reais implementados
3. **`## 2. Stack Tecnológica e Identidade Visual`**
   - Tabela Markdown com 3 colunas exatas: `Camada | Tecnologia | Papel`
   - Cobrir Runtime/API, Tempo Real (se houver), Frontend, Design System, Persistência e Exportação/Integrações reais
4. **`## 3. Como Executar Localmente`**
   - `### Pré-requisitos` (versões reais de runtime/gerenciador de pacotes)
   - `### Passo 1 — Instalar dependências`
   - `### Passo 2 — Configurar variáveis de ambiente (opcional)` (referenciando `.env.example`, reforçando nunca versionar `.env`)
   - `### Passo 3 — Iniciar a aplicação` (comandos reais + observação sobre inicialização/seed de banco quando aplicável)
   - `### Passo 4 — Acessar e validar` (URLs locais, healthcheck e WebSocket/API conforme `docs/SAD.md`)
5. **`## 4. Scripts Disponíveis`**
   - Tabela Markdown com 3 colunas exatas: `Script | Comando | Descrição`
   - Incluir apenas scripts reais presentes no manifesto do projeto (`package.json` / `Makefile` / scripts `.ps1`/`.sh` oficiais)
6. **`## 5. Estrutura do Projeto e Ordem de Leitura SDD`**
   - Bloco `text` com árvore limpa dos diretórios e arquivos principais realmente existentes (sem `node_modules/`, `dist/`, `.git/` ou arquivos temporários)
   - Subseção `### Ordem de Leitura Canônica (\`docs/GUIDELINE.md\` §4)` numerada fielmente ao `docs/GUIDELINE.md`
7. **`## 6. Principais Skills SDD Disponíveis`**
   - Lista com as skills SDD efetivamente presentes em `docs/skills/` ou `.agents/skills/`

---

## 4. Regras dos Badges (Shields.io)

- Usar sempre o estilo `style=for-the-badge` em todas as tags para uniformidade visual:
  ```markdown
  ![<Label>](https://img.shields.io/badge/<Label>-<Versao_ou_Detalhe>-<HEX>?style=for-the-badge&logo=<simple-icons-slug>&logoColor=<white_ou_0B1220>)
  ```
- **Fidelidade às versões:** extrair as versões diretamente do manifesto (`package.json`, `pyproject.toml`, etc.) — usar major ou major.minor limpo (ex.: `Node.js-22%2B`, `React-19`, `TypeScript-7.0`, `Vite-8.3`, `Tailwind_CSS-v4`).
- **Escaping em URL Shields.io:**
  - Espaços: `_`
  - Hífen literal dentro de texto: `--` (ex.: `better--sqlite3`)
  - Sinal `+`: `%2B`
- **Contraste de ícone:** usar `logoColor=white` em fundos escuros e `logoColor=0B1220` em fundos claros (ex.: React `#61DAFB`, Motion `#FFF312`).
- **Badge SDD obrigatório no final do bloco:**
  - Usar a cor primária de `docs/DESIGN.md` quando disponível (padrão `#0B41CD`):
  ```markdown
  ![SDD](https://img.shields.io/badge/Metodologia-SDD-0B41CD?style=for-the-badge)
  ```
- Não incluir badges de bibliotecas que não estejam instaladas no projeto.

---

## 5. Fluxo de Execução Passo a Passo

1. **Inspecionar o Projeto:** ler os arquivos listados na seção 2 (em paralelo sempre que possível).
2. **Coletar Dados Reais:**
   - Nome do produto, descrição e URL do repositório (`git remote -v` ou `docs/PRD.md`).
   - Tecnologias, versões exatas e scripts a partir do manifesto de dependências.
   - Funcionalidades consolidadas de `docs/PRD.md` e `docs/SAD.md`.
   - Árvore real de pastas e skills disponíveis.
3. **Preencher o Template:** aplicar `assets/README-TEMPLATE.md` substituindo todos os placeholders `{{...}}` por dados reais. Remover linhas/subitens que não se apliquem ao projeto (ex.: remover linha de WebSocket se o projeto não usar WebSocket).
4. **Revisar Checklist de Qualidade:**
   - Nenhum placeholder `{{...}}` restante no arquivo final.
   - Nenhum segredo, token ou conteúdo de `.env` vazado.
   - Todos os badges correspondem a tecnologias reais do projeto e usam `style=for-the-badge`.
   - Todos os links relativos (`./AGENTS.md`, `./docs/GUIDELINE.md`, `./docs/DESIGN.md`) apontam para arquivos existentes.
   - Todos os comandos da seção 3 e 4 existem no manifesto ou scripts do repositório.
5. **Salvar e Reportar:** gravar `README.md` na raiz do projeto e entregar o relatório final conforme `docs/GUIDELINE.md` §8.
