---
name: sdd-project-init
description: Cria a pasta local com a estrutura SDD inicial (templates e skills do starter kit), o repositório Git privado e o projeto Supabase usando o project-slug-name. Lê GIT_TOKEN, GIT_USER_NAME e GIT_USER_EMAIL do .env. Não imprime nem versiona segredo.
---

# Skill: SDD Project Init

> **Documento:** SKILL.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **E-mail:** silverio.leitejr@og1.com.br · **Telefone:** (11) 96020-6334  
> **Versão:** 1.3  
> **Data:** 2026-11-23  

## 1. Missão

Inicializar um projeto novo com o mesmo identificador nos três destinos: diretório local (já com a estrutura SDD inicial, templates e skills do starter kit), repositório Git privado e projeto Supabase.

**Não faz:** escrever spec, escolher stack, criar tabela, gravar segredo no repositório, imprimir o token, nem seguir com dado em branco.

## 2. Ordem de Leitura (subconjunto)

1. `docs/GUIDELINE.md` §2.2 (setup do projeto)
2. `AGENTS.md` §5 e §9
3. `docs/GLOSSARY.md` §3, se existir

## 3. Entradas

Perguntar o que faltar e esperar. Não inventar.

| Campo | Significado |
|---|---|
| `project_name` | Nome de exibição do projeto |
| `project_slug_name` | Identificador único. kebab-case, minúsculas, sem espaço. É o nome da pasta, do repositório Git e do projeto Supabase |
| `local_path` | Diretório pai. A pasta do projeto é `{local_path}/{project_slug_name}` |

O slug que não estiver em kebab-case é recusado. Não converter em silêncio.

## 4. Credenciais

Ler somente do arquivo `.env` do ambiente de onde a skill executa. Nunca do chat. Nunca da pasta do projeto novo.

| Variável | Uso |
|---|---|
| `GIT_TOKEN` | Autenticação na API do GitHub para criar o repositório e enviar o primeiro commit |
| `GIT_USER_NAME` | `user.name` do Git, só neste repositório |
| `GIT_USER_EMAIL` | `user.email` do Git, só neste repositório |

Se uma das três não existir ou estiver vazia, parar antes de criar qualquer coisa. Dizer o nome da variável ausente. Não pedir o valor no chat.

Não copiar o `.env` para `{local_path}/{project_slug_name}`. Não escrever o `GIT_TOKEN` em arquivo, remote, commit ou resposta. O remote gravado no `.git/config` é a URL limpa, sem token.

## 5. Confirmação

Mostrar o plano e esperar um sim. No plano, o token aparece apenas como `presente` ou `ausente`.

1. Criar `{local_path}/{project_slug_name}`, a estrutura inicial de diretórios SDD e o `.git` dentro dessa pasta.
2. Copiar os arquivos de `C:\@projetos\app-dev-start-kit\docs\templates` para `{local_path}/{project_slug_name}/docs/templates`, os documentos base de `docs/` (a partir de `C:\@projetos\app-dev-start-kit\docs`, quando existirem) e as pastas/arquivos de `C:\@projetos\app-dev-start-kit\.agents\skills` para `{local_path}/{project_slug_name}/.agents/skills`.
3. Criar o repositório Git privado com o nome `project_slug_name`, autenticado pelo `GIT_TOKEN`.
4. Gravar `.gitignore` (ignorando `README.ini`, `readme.ini`, `.env` e `.env.*`), `README.md` e `README.ini` (apenas local), e enviar a estrutura inicial (sem `README.ini` nem `.env`) à branch `main`.
5. Criar o projeto Supabase com o nome `project_slug_name`.

Sem o sim, nenhum comando roda.

Parar, sem criar nada, se:

- `{local_path}/{project_slug_name}` já existe e não está vazio.
- `C:\@projetos\app-dev-start-kit\docs\templates` ou `C:\@projetos\app-dev-start-kit\.agents\skills` não existe.
- O repositório `project_slug_name` já existe na conta autenticada pelo `GIT_TOKEN`.
- O projeto Supabase com esse nome já existe.
- Falta `GIT_TOKEN`, `GIT_USER_NAME` ou `GIT_USER_EMAIL`.

## 6. Execução

Se um passo falhar, não executar o seguinte. Informar o que já foi criado.

### 6.1 Diretório local, estrutura inicial e cópias do starter kit

Criar `{local_path}/{project_slug_name}` com a seguinte estrutura inicial:

```text
{local_path}/{project_slug_name}/
│
├── docs/
│   │
│   ├── GUIDELINE.md                 ← AGNÓSTICO (metodologia SDD — reutilizar 100%)
│   ├── DATABASE-PATTERN.md          ← CUSTOMIZADO (padrões de banco)
│   ├── NAMING-CONVENTION.md         ← CUSTOMIZADO (convenções de código)
│   ├── DESIGN.md                    ← CUSTOMIZADO (identidade visual)
│   ├── TO-DO.md                     ← CUSTOMIZADO (status das entregas)
│   │
│   ├── templates/                   ← TEMPLATES MESTRES (reutilizáveis)
│   │   ├── USE-CASE-TEMPLATE.md     ← Modelo obrigatório de Use Case
│   │   └── ...
│   │
│   └── sdd/                         ← SPECS POR FUNCIONALIDADE
│
├── .agents/
│   └── skills/                      ← SKILLS PUBLICADAS (usadas pelos agentes)
│       ├── sdd-developer/
│       │   └── SKILL.md
│       ├── sdd-usecase-writer/
│       │   └── SKILL.md
│       └── ...
│
├── src/                             ← código da aplicação
├── db/                              ← schema, migrations, seeds
├── .gitignore
├── README.ini                       ← apenas local (ignorado pelo Git)
└── README.md
```

Regras de cópia e preenchimento:

1. **Templates:** copiar todos os arquivos de `C:\@projetos\app-dev-start-kit\docs\templates` para `{local_path}/{project_slug_name}/docs/templates`.
2. **Skills:** copiar recursivamente todas as pastas e arquivos de `C:\@projetos\app-dev-start-kit\.agents\skills` para `{local_path}/{project_slug_name}/.agents/skills`.
3. **Documentos base em `docs/`:** copiar `GUIDELINE.md` (100% agnóstico, sem alterar) e os documentos base (`DATABASE-PATTERN.md`, `NAMING-CONVENTION.md`, `DESIGN.md`, `TO-DO.md`) de `C:\@projetos\app-dev-start-kit\docs` quando existirem lá; para os que não existirem prontos na raiz de `docs/` do starter kit, gerar a partir dos templates correspondentes em `docs/templates/` (ou criar o placeholder inicial mínimo).
4. **Pastas vazias versionáveis:** criar `docs/sdd/.gitkeep`, `src/.gitkeep` e `db/.gitkeep` para que as pastas sejam preservadas no Git.
5. **Git local:** inicializar o `.git` dentro de `{local_path}/{project_slug_name}` (nunca em `local_path`) e configurar, apenas neste repositório:
   - `user.name` = valor de `GIT_USER_NAME`
   - `user.email` = valor de `GIT_USER_EMAIL`
   - Não alterar o `git config --global`.

### 6.2 Repositório Git

Com o `GIT_TOKEN` lido do `.env`, criar o repositório privado de nome `project_slug_name`, vazio, sem arquivo gerado pelo serviço. A URL pública resultante é `https://github.com/<dono>/{project_slug_name}`, em que `<dono>` é a conta que o token identifica. Visibilidade diferente de privada só se a pessoa pedir.

### 6.3 `.gitignore`, `README.md`, `README.ini` e commit inicial

Criar `.gitignore` na raiz da pasta do projeto contendo, no mínimo:

```gitignore
README.ini
readme.ini
.env
.env.*
```

Criar `README.md` na raiz da pasta do projeto com o título `{project_name}` e o identificador `{project_slug_name}`.

Criar `README.ini` apenas localmente na raiz da pasta do projeto, com este conteúdo e nada mais:

```ini
[project]
name = {project_name}
slug = {project_slug_name}
local_path = {local_path}/{project_slug_name}
github_url = https://github.com/<dono>/{project_slug_name}
```

Não incluir token, e-mail de serviço nem connection string. Não enviar `README.ini` nem `.env` para o repositório remoto.

Fazer o commit inicial na branch `main` (mensagem `chore: inicializa estrutura sdd do projeto`) contendo `.gitignore`, `README.md`, `docs/`, `.agents/skills/`, `src/` e `db/` (conferindo antes com `git status` que `README.ini` e `.env` não estão staged). Configurar remote `origin` com a URL limpa e fazer push usando o `GIT_TOKEN` só na autenticação da chamada.

### 6.4 Supabase

Criar o projeto Supabase com o nome `project_slug_name`. Não criar tabela. Não gravar chave do Supabase em arquivo do repositório. Credencial do Supabase, se a ferramenta exigir, também sai do `.env` e não do chat. Se a credencial de Supabase não estiver no `.env`, parar neste passo e dizer o nome da variável ausente, sem pedir o valor.

## 7. Encerramento

Informar, sem nenhum segredo:

- caminho `{local_path}/{project_slug_name}`
- resumo da estrutura inicial criada (templates e skills copiados)
- URL limpa do GitHub
- hash do commit inicial
- nome do projeto Supabase
- o que não foi feito, se algum passo parou

---

*Skill mantida em `docs/skills/sdd-project-init/SKILL.md`.*
