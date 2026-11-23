# SAD — SDD Project Bootstrapper (MVP)

Nov 18, 2026 · @Junior Leite

| Campo | Valor |
| --- | --- |
| **Autor** | Silverio Leite Jr (Junior) |
| **Cargo** | Senior Solution Architect — OG1 TI |
| **E-mail** | silverio.leitejr@og1.com.br |
| **Telefone** | (11) 96020-6334 |
| **PRD de Referência** | `docs/PRD.md` (v1.0.0-MVP — *ver Nota de Alinhamento §1.3*) |
| **Guia de Banco de Dados** | `docs/DATABASE-PATTERN.md` (v2.0 — PostgreSQL 16+) |
| **Skill Arquitetural** | `web-solutions-architect` (Boundary Enforcement, GenAIFactory, Resiliência & SDD) |
| **Versão** | 2.0.0-MVP |
| **Status** | Aprovado para Implementação |
| **Data** | 2026-11-18 |

---

## 1. Framework, Stack Tecnológica e Alinhamento de Escopo

O **SDD Project Bootstrapper** adota uma arquitetura web full-stack em camadas baseada no ecossistema **Node.js 20+ / TypeScript**, consolidando interface reativa, camada de API/BFF serverless, camada isolada de serviços de domínio, persistência relacional gerenciada, integração Git nativa via SDK e motor agnóstico de Inteligência Artificial.

### 1.1 Visão Geral dos Componentes da Stack

| Camada | Tecnologia / Serviço | Papel Arquitetural |
| --- | --- | --- |
| **Framework Full-Stack** | **Next.js 15 (App Router)** sobre **Node.js 20+ Runtime** | Unifica a interface web (Client/Server Components) e os endpoints REST (`/api/*`) em um único pipeline de build e deploy |
| **Front-end & UI** | **React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui** | Biblioteca de componentes fortemente tipados para o pipeline de 9 etapas, editores Markdown, explorador de árvore Git e catálogo de skills |
| **Camada de Domínio** | **TypeScript Pure Services (`src/services/`)** | Isolamento estrito de regras de negócio, orquestração transacional e contratos de domínio desacoplados de HTTP e SDKs externos |
| **Banco de Dados** | **Supabase PostgreSQL 16+** (Transaction Pooler porta `6543`, `prepare: false`) | Persistência relacional padronizada (`DATABASE-PATTERN.md`) de projetos, templates SDD, prompts de IA, artefatos, skills e trilha de auditoria |
| **ORM, Migrations & Seeds** | **Drizzle ORM + Drizzle Kit + `db/seeds/`** | Mapeamento relacional type-safe, migrations SQL versionadas e carga idempotente de templates, prompts e skills padrão |
| **Autenticação** | **Supabase Auth (JWT)** | Gestão de identidade, sessões via cookies seguros e isolamento lógico multi-tenant por `owner_id` |
| **Serviço de IA** | **Google Gemini AI (`@google/genai`) via `GenAIFactory`** | Motor de IA abstraído via Adapter Pattern para geração/revisão de `PRD.md`, `SAD.md`, `DESIGN.md` e `AGENTS.md` |
| **Integração GitHub** | **Octokit SDK (`@octokit/rest`)** | Criação de repositórios, commits atômicos via Git Data API, listagem recursiva de árvore e leitura de arquivos remotos sem terminal |
| **Hospedagem & Deploy** | **Vercel** | Deploy contínuo serverless do front-end e das funções Node.js (`/api/*`) com gestão criptografada de segredos |

### 1.2 Justificativa Técnica para a Escolha da Stack

1. **Next.js 15 (React + TypeScript) vs. Vite + React (SPA Isolada):**
   - Embora o Vite seja excelente para empacotar SPAs puramente estáticas, ele executa 100% no navegador e exigiria manter um servidor backend separado para proteger credenciais críticas (`GITHUB_TOKEN`, `GEMINI_API_KEY`, `DATABASE_URL`).
   - O **Next.js App Router** mantém toda a interatividade do **React + TypeScript** na interface e fornece nativamente **Route Handlers Node.js (`/api/*`)** no mesmo projeto, eliminando CORS, simplificando o deploy na **Vercel** e garantindo fronteira segura entre cliente e servidor.
2. **Separação Estrita `Route Handlers` ↔ `Services` ↔ `Adapters`:**
   - Os Route Handlers atuam exclusivamente como adaptadores HTTP (validação Zod + autenticação JWT + serialização de resposta), delegando toda lógica de negócio para `src/services/`. Isso permite testar 100% das regras de negócio unitariamente sem depender do runtime HTTP do Next.js.
3. **Supabase (PostgreSQL 16+ + Auth) com Drizzle ORM:**
   - Entrega PostgreSQL 16+ gerenciado e autenticação JWT prontos para produção, enquanto o Drizzle ORM e as migrations SQL puras garantem portabilidade imediata para qualquer instância PostgreSQL padrão sem *vendor lock-in*.
4. **Google Gemini AI via `GenAIFactory` (Adapter Pattern):**
   - A ampla janela de contexto do Gemini ingere documentos completos (`PRD.md` + `DATABASE-PATTERN.md`) para gerar `SAD.md` e `AGENTS.md` consistentes, enquanto o padrão `GenAIFactory` evita acoplamento direto ao SDK e permite trocar ou adicionar provedores LLM futuros sem alterar os serviços.
5. **Octokit (`@octokit/rest`) + Git Data API:**
   - Elimina completamente o uso de terminal local ou scripts Bash, materializando repositórios e múltiplos arquivos em um único commit atômico diretamente via HTTPS.

### 1.3 Nota de Alinhamento com o `PRD.md` (Resolução de Drift)

> **Governança SDD:** O `PRD.md` (`v1.0.0-MVP`) foi originalmente redigido prevendo persistência em `localStorage` e exportação de script `init-project.sh`. Por decisão arquitetural aprovada neste `SAD.md` (`v2.0.0-MVP`), esses dois mecanismos foram **substituídos** respectivamente por **persistência centralizada no Supabase PostgreSQL 16+** e **integração direta via GitHub API/SDK (`@octokit/rest`) sem execução de terminal**, além da inclusão de **assistência via Google Gemini AI**. O `PRD.md` deve ser atualizado para `v1.1.0-MVP` refletindo essas premissas antes do início da sprint de construção.

---

## 2. Segurança da Aplicação, Segurança de Dados e Tratamento de Dados Sensíveis

### 2.1 Classificação e Tratamento de Dados Sensíveis

| Categoria de Dado | Exemplos no Sistema | Classificação | Estratégia de Armazenamento e Proteção |
| --- | --- | --- | --- |
| **Credenciais de Infraestrutura e IA** | `GEMINI_API_KEY`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | **Crítico (Segredo de Servidor)** | Armazenadas exclusivamente nas *Environment Variables* criptografadas da **Vercel** (e `.env.local` ignorado no Git); nunca prefixadas com `NEXT_PUBLIC_` |
| **Credenciais de Acesso ao GitHub** | `GITHUB_TOKEN` (Fine-Grained PAT ou OAuth Token) | **Crítico (Token de Escrita Remota)** | Manipulado exclusivamente no `GitHubOctokitAdapter` no servidor Node.js; jamais persistido em `localStorage`, cookies não-HttpOnly ou logs de auditoria |
| **Dados de Identidade e Rede** | E-mail, nome, `github_username`, `ip_address` (`INET`), tokens JWT | **Sensível (PII / LGPD)** | Senhas e fluxos OAuth delegados integralmente ao **Supabase Auth**; sessões mantidas via cookies `HttpOnly`, `Secure` e `SameSite=Lax` |
| **Propriedade Intelectual dos Projetos** | Conteúdo de `PRD.md`, `SAD.md`, `DESIGN.md`, `AGENTS.md` e skills privadas | **Confidencial (Dados de Negócio)** | Persistidos no Supabase PostgreSQL com isolamento lógico estrito por `owner_id`; enviados à API de IA apenas sob acionamento explícito do usuário |
| **Trilha de Auditoria** | `bootstrap_runs` (`actor_id`, `commit_sha`, `run_status`, `ip_address`) | **Integridade Operacional** | Protegida por trigger de imutabilidade no PostgreSQL (`trg_fn_prevent_audit_mutation`) com sanitização prévia contra vazamento de segredos |

### 2.2 Arquitetura de Segurança em Camadas

1. **Fronteira Zero-Trust (BFF Pattern):**
   - O front-end React **nunca** acessa diretamente o banco de dados, a API do GitHub ou a API do Google Gemini. Toda operação passa pelos Route Handlers (`/api/*`), que validam obrigatoriamente o JWT via `supabase.auth.getUser()`.
2. **Isolamento Multi-Tenant por `owner_id`:**
   - Todos os repositórios de dados (`src/repositories/`) exigem o parâmetro explícito `ownerId` e aplicam `WHERE owner_id = :ownerId` em `projects`, `project_artifacts`, `project_skills` e `bootstrap_runs`.
   - Registros globais (`owner_id IS NULL` em `artifact_templates`, `system_prompts` e `skills`) são estritamente somente leitura para usuários autenticados.
3. **Sanitização Preventiva (PII & Secrets Redaction) antes da IA:**
   - Antes de enviar qualquer conteúdo Markdown ao `GenAIFactory`, o `SanitizerService` aplica expressões regulares para mascarar padrões acidentais de credenciais (`ghp_*`, `github_pat_*`, `AIza*`, `postgres://*`, tokens Bearer) substituindo-os por `[REDACTED_SECRET]`.
4. **Princípio do Menor Privilégio (Least Privilege) no GitHub:**
   - O token GitHub opera com permissões restritas exclusivamente a `Administration: Read and write` (criação de repositório) e `Contents: Read and write` (leitura e commit de arquivos).
5. **Prevenção contra Injeção e Path Traversal:**
   - Validação de entrada com schemas **Zod** em todas as rotas.
   - Normalização e bloqueio de sequências `..`, barras iniciais `/` e caracteres de controle em `file_path` e `target_path` nas operações GitHub.
   - Queries SQL parametrizadas nativamente via Drizzle ORM.

### 2.3 Trade-offs de Segurança e Mitigações

| Decisão / Trade-off | Benefício Ganho | Risco Residual Assumido | Mitigação Aplicada no Projeto |
| --- | --- | --- | --- |
| **Autorização na camada de Serviços (Node.js) vs. RLS complexa no Supabase** | Portabilidade total do PostgreSQL, testabilidade unitária e zero acoplamento a PL/pgSQL proprietário | Acesso direto via Supabase PostgREST (`anon` key) não teria filtros RLS granulares | Habilitar RLS com política `DENY ALL` para a role `anon` no Supabase e restringir toda conexão exclusivamente ao backend Node.js via `DATABASE_URL` |
| **Token GitHub centralizado no servidor (MVP) vs. OAuth individual por usuário** | Zero fricção de onboarding no MVP para uso individual ou interno da OG1 TI | Repositórios criados ficam vinculados à conta detentora do token configurado | Utilizar Fine-Grained PAT restrito às organizações autorizadas, auditar o `actor_id` e `ip_address` real em `bootstrap_runs` e evoluir para GitHub App OAuth na v2.0 |
| **Envio de especificações (`PRD.md` / `SAD.md`) para API externa do Gemini AI** | Geração e revisão arquitetural automatizada de alta qualidade em segundos | Tráfego de documentação técnica para serviço externo de LLM | Uso exclusivo via backend autenticado, sanitização de segredos (`SanitizerService`), política de não-treinamento da API paga Google AI e consentimento explícito por clique na UI |

---

## 3. Visão Geral da Arquitetura (C4 Model & 6 Camadas)

### 3.1 Diagrama de Contexto (Nível 1)

```text
+-----------------------------------+
|  Arquiteto / Dev AI-First         |
|  (Silverio Leite Jr / Equipe)     |
+-----------------+-----------------+
                  |
                  | 1. Autentica, gerencia projetos, edita/gera docs SDD,
                  |    seleciona skills e publica no GitHub via UI
                  v
+-----------------------------------+       2. HTTPS / Octokit SDK (Backoff + Retry)    +-----------------------+
|     SDD Project Bootstrapper      | ------------------------------------------------> |     GitHub Cloud      |
|  (Next.js 15 + React + TS + BFF)  | <------------------------------------------------ |    (REST API v3)      |
+--------+-----------------+--------+       3. Retorna árvore de arquivos, SHAs         +-----------------------+
         |                 |                   e conteúdo decodificado
         |                 |
         |                 | 4. Prompts sanitizados via GenAIFactory              +-----------------------+
         |                 +----------------------------------------------------------> |   Google Gemini AI    |
         |                 <---------------------------------------------------------- |   (@google/genai SDK) |
         |                   5. Retorna rascunhos de PRD, SAD, DESIGN e AGENTS
         |
         | 6. Persiste projetos, templates, prompts,
         |    catálogo de skills, docs e auditoria
         v
+-----------------------------------+
|         Supabase Platform         |
|  (PostgreSQL 16+ Pooler + Auth)   |
+-----------------------------------+
```

### 3.2 Arquitetura em 6 Camadas (Boundary Enforcement)

```text
+-----------------------------------------------------------------------------------+
| 1. PRESENTATION LAYER (src/components/ & src/app/**/page.tsx)                     |
|    React Client/Server Components, Tailwind CSS v4, shadcn/ui, Editores Markdown  |
+-----------------------------------------+-----------------------------------------+
                                          | fetch() + Zod DTOs + JWT Cookie
+-----------------------------------------v-----------------------------------------+
| 2. ROUTING / CONTROLLERS LAYER (src/app/api/**/route.ts)                          |
|    Validação Zod, Extração de Sessão JWT (AuthGuard), Mapeamento HTTP Status      |
+-----------------------------------------+-----------------------------------------+
                                          | Chamadas tipadas de domínio
+-----------------------------------------v-----------------------------------------+
| 3. BUSINESS LOGIC / SERVICES LAYER (src/services/)                                |
|    ProjectService, ArtifactService, SkillService, BootstrapService, AIService     |
+--------------------+--------------------+-----------------------------------------+
                     |                    |
+--------------------v---+  +-------------v-----------------------------------------+
| 4. DATA ACCESS LAYER   |  | 5. EXTERNAL ECOSYSTEM ADAPTERS (src/infra/)           |
|  (src/repositories/)   |  |    - GitHubOctokitAdapter (Octokit + Backoff/Retry)   |
|  Drizzle ORM +         |  |    - GenAIFactory -> GeminiAdapter (@google/genai)    |
|  TemplateEngine        |  |    - SupabaseAuthAdapter (Validação JWT)              |
+--------------------+---+  +-------------+-----------------------------------------+
                     |                    |
+--------------------v--------------------v-----------------------------------------+
| 6. INFRASTRUCTURE & PERSISTENCE (Supabase PostgreSQL 16+, GitHub API, Gemini API) |
+-----------------------------------------------------------------------------------+
```

---

## 4. Estratégia de Resiliência e Governança de IA

### 4.1 Resiliência em Integrações Externas (GitHub & Gemini)

Todas as chamadas externas encapsuladas em `src/infra/github/` e `src/infra/ai/` implementam um utilitário compartilhado `withResiliencePolicy`:

* **Timeout Explícito:** `15.000 ms` para operações GitHub REST/Git Data e `45.000 ms` para geração de documentos longos via LLM.
* **Retry com Exponential Backoff + Jitter:** Até **3 tentativas** automáticas (`500ms → 1500ms → 3500ms` + jitter aleatório) exclusivamente para erros transitórios:
  * `HTTP 429` (Too Many Requests / Rate Limit — respeitando o header `Retry-After` quando presente).
  * `HTTP 502`, `503`, `504` (Bad Gateway / Service Unavailable / Gateway Timeout).
  * Falhas de rede transitórias (`ECONNRESET`, `ETIMEDOUT`).
* **Fail-Fast para Erros de Cliente:** Status `400`, `401`, `403`, `404` e `422` (ex.: repositório já existente) não sofrem retry e são convertidos em erros de domínio tipados (`DomainError`) para feedback imediato na UI.

### 4.2 Governança de IA (`GenAIFactory` & `system_prompts`)

* **Desacoplamento de Provedor (`GenAIFactory`):** A camada `AIService` depende apenas da interface `LLMProviderPort` (`generateMarkdown(request): Promise<LLMResponse>`). A fábrica instancia `GeminiAdapter` (`gemini-2.5-pro` / `gemini-2.5-flash`) por padrão, permitindo adicionar provedores secundários (ex.: Anthropic, OpenAI ou Ollama) via configuração sem alterar os serviços.
* **Prompts Versionados em Banco (`system_prompts`):** Os prompts de sistema para cada etapa (`PRD`, `SAD`, `DESIGN`, `AGENTS`) são armazenados na tabela `system_prompts` (populados via `db/seeds/prompts/`), permitindo ajustar instruções arquiteturais sem redeploy, com *fallback* automático para os arquivos seed.
* **Telemetria FinOps:** Cada geração registra modelo utilizado, latência e contagem de tokens (`prompt_tokens`, `completion_tokens`) nos metadados da resposta para controle de custos.

---

## 5. Schema do Banco de Dados (PostgreSQL 16+ / Supabase)

### 5.1 Regras de Padronização Aplicadas (`DATABASE-PATTERN.md`)

* **Idioma e Casing:** Exclusivamente em **inglês** (*US English*), `snake_case`, caracteres `[a-z0-9_]`, máximo de 63 bytes, sem aspas duplas `""` e sem palavras reservadas isoladas.
* **Chaves Primárias e Estrangeiras:** Sempre `id UUID NOT NULL DEFAULT gen_random_uuid()` (`pk_<table_name>`) e FKs com sufixo `_id` (`fk_<source_table>_<target_role>`) acompanhadas de índices B-Tree.
* **Unicidade & Domínio:** Constraints nomeadas `uk_<table_name>_<column_name>`, índices únicos parciais `udx_<table_name>_<desc>` e validações `ck_<table_name>_<rule_description>`.
* **Tipos Nativos:** `VARCHAR(N)` para domínios limitados, `TEXT` para conteúdos Markdown, `JSONB` com índices GIN para estruturas flexíveis, `INET` para endereços IP de auditoria e `TIMESTAMPTZ` com trigger `trg_fn_set_updated_at()`.
* **Imutabilidade de Auditoria:** A tabela `bootstrap_runs` bloqueia `UPDATE` e `DELETE` via trigger `trg_fn_prevent_audit_mutation()`.

### 5.2 Estrutura Detalhada da Tabela `skills` (Catálogo de Skills Disponíveis)

| Coluna | Tipo PostgreSQL | Restrições | Descrição |
| --- | --- | --- | --- |
| `id` | `UUID` | `NOT NULL DEFAULT gen_random_uuid()` (`pk_skills`) | Identificador único da skill |
| `owner_id` | `UUID` | `NULL` (`fk_skills_owner -> profiles.id`) | `NULL` para skills globais padrão (seed); preenchido para skills customizadas do usuário |
| `slug` | `VARCHAR(80)` | `NOT NULL` | Identificador técnico em kebab-case usado no caminho (ex.: `sdd-spec-guardian`) |
| `name` | `VARCHAR(120)` | `NOT NULL` | Nome legível exibido na interface (ex.: `SDD Spec Guardian`) |
| `category` | `VARCHAR(30)` | `NOT NULL DEFAULT 'GENERAL'` | Categoria validada via `ck_skills_category_valid` (`ARCHITECTURE`, `BACKEND`, `FRONTEND`, `DATABASE`, `QA`, `DEVOPS`, `GENERAL`) |
| `description` | `TEXT` | `NOT NULL DEFAULT ''` | Resumo objetivo do propósito e gatilhos da skill |
| `target_path` | `VARCHAR(255)` | `NOT NULL DEFAULT '.agents/skills/{{slug}}/SKILL.md'` | Caminho relativo de destino onde o arquivo será gerado no repositório |
| `content` | `TEXT` | `NOT NULL` | Conteúdo Markdown completo da skill (frontmatter YAML + instruções operacionais) |
| `compatible_stacks` | `JSONB` | `NOT NULL DEFAULT '["all"]'::jsonb` | Lista de stacks recomendadas para sugestão automática (indexada via GIN) |
| `tags` | `JSONB` | `NOT NULL DEFAULT '[]'::jsonb` | Etiquetas de busca rápida |
| `semantic_version` | `VARCHAR(20)` | `NOT NULL DEFAULT '1.0.0'` | Versão semântica da definição da skill |
| `is_default` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Indica se a skill vem pré-selecionada ao criar um novo projeto |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Permite desativar skills sem comprometer histórico de projetos antigos |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Data/hora de criação |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Data/hora da última atualização (mantida via trigger) |

### 5.3 Script DDL Completo (Production-Ready — PostgreSQL 16+)

```sql
-- ============================================================================
-- DDL Script: SDD Project Bootstrapper — Core Schema
-- Engine: PostgreSQL 16+ (Supabase)
-- Standard: DATABASE-PATTERN.md v2.0
-- Author: Silverio Leite Jr / DBA Junior Leite
-- ============================================================================

BEGIN;

-- 1. Funções Utilitárias de Trigger
CREATE OR REPLACE FUNCTION trg_fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_fn_prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'bootstrap_runs is append-only: UPDATE and DELETE operations are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

-- 2. Tabela: profiles (espelha auth.users do Supabase Auth)
CREATE TABLE profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    github_username VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_profiles PRIMARY KEY (id),
    CONSTRAINT uk_profiles_email UNIQUE (email)
);

-- 3. Tabela: artifact_templates (templates mestre SDD via seed + customizações)
CREATE TABLE artifact_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    owner_id UUID NULL,
    artifact_key VARCHAR(30) NOT NULL,
    name VARCHAR(120) NOT NULL,
    default_file_path VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_artifact_templates PRIMARY KEY (id),
    CONSTRAINT fk_artifact_templates_owner FOREIGN KEY (owner_id)
        REFERENCES profiles (id) ON DELETE CASCADE,
    CONSTRAINT ck_artifact_templates_key_valid CHECK (
        artifact_key IN ('PRD', 'SAD', 'DESIGN', 'AGENTS', 'README')
    ),
    CONSTRAINT ck_artifact_templates_version_positive CHECK (
        version_number >= 1
    )
);

-- 4. Tabela: system_prompts (prompts governados para geração assistida via GenAIFactory)
CREATE TABLE system_prompts (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    owner_id UUID NULL,
    prompt_key VARCHAR(40) NOT NULL,
    name VARCHAR(120) NOT NULL,
    system_instruction TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL,
    preferred_model VARCHAR(60) NOT NULL DEFAULT 'gemini-2.5-pro',
    temperature NUMERIC(3,2) NOT NULL DEFAULT 0.20,
    version_number INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_system_prompts PRIMARY KEY (id),
    CONSTRAINT fk_system_prompts_owner FOREIGN KEY (owner_id)
        REFERENCES profiles (id) ON DELETE CASCADE,
    CONSTRAINT ck_system_prompts_key_valid CHECK (
        prompt_key IN ('GENERATE_PRD', 'GENERATE_SAD', 'REVIEW_DESIGN', 'GENERATE_AGENTS')
    ),
    CONSTRAINT ck_system_prompts_temperature_range CHECK (
        temperature >= 0.00 AND temperature <= 2.00
    )
);

-- 5. Tabela: projects (workspaces SDD)
CREATE TABLE projects (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    tech_stack VARCHAR(200) NOT NULL,
    workspace_root VARCHAR(120) NOT NULL DEFAULT 'src/',
    github_owner VARCHAR(100) NOT NULL,
    github_repo VARCHAR(100) NOT NULL,
    github_visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    github_branch VARCHAR(80) NOT NULL DEFAULT 'main',
    repo_url VARCHAR(255) NULL,
    last_commit_sha VARCHAR(64) NULL,
    steps_status JSONB NOT NULL DEFAULT '{"0":"PENDING","1":"PENDING","2":"PENDING","3":"PENDING","4":"PENDING","5":"PENDING","6":"PENDING","7":"PENDING","8":"PENDING"}'::jsonb,
    design_checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_projects PRIMARY KEY (id),
    CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id)
        REFERENCES profiles (id) ON DELETE CASCADE,
    CONSTRAINT uk_projects_owner_id_slug UNIQUE (owner_id, slug),
    CONSTRAINT ck_projects_visibility_valid CHECK (
        github_visibility IN ('PRIVATE', 'PUBLIC')
    )
);

-- 6. Tabela: project_artifacts (documentos SDD instanciados por projeto)
CREATE TABLE project_artifacts (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    template_id UUID NULL,
    artifact_key VARCHAR(30) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    last_synced_sha VARCHAR(64) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_project_artifacts PRIMARY KEY (id),
    CONSTRAINT fk_project_artifacts_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_artifacts_template FOREIGN KEY (template_id)
        REFERENCES artifact_templates (id) ON DELETE SET NULL,
    CONSTRAINT uk_project_artifacts_project_id_key UNIQUE (project_id, artifact_key),
    CONSTRAINT ck_project_artifacts_key_valid CHECK (
        artifact_key IN ('PRD', 'SAD', 'DESIGN', 'AGENTS', 'README')
    ),
    CONSTRAINT ck_project_artifacts_version_positive CHECK (
        version_number >= 1
    )
);

-- 7. Tabela: skills (catálogo de skills agênticas disponíveis)
CREATE TABLE skills (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    owner_id UUID NULL,
    slug VARCHAR(80) NOT NULL,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
    description TEXT NOT NULL DEFAULT '',
    target_path VARCHAR(255) NOT NULL DEFAULT '.agents/skills/{{slug}}/SKILL.md',
    content TEXT NOT NULL,
    compatible_stacks JSONB NOT NULL DEFAULT '["all"]'::jsonb,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    semantic_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_skills PRIMARY KEY (id),
    CONSTRAINT fk_skills_owner FOREIGN KEY (owner_id)
        REFERENCES profiles (id) ON DELETE CASCADE,
    CONSTRAINT ck_skills_category_valid CHECK (
        category IN ('ARCHITECTURE', 'BACKEND', 'FRONTEND', 'DATABASE', 'QA', 'DEVOPS', 'GENERAL')
    )
);

-- 8. Tabela: project_skills (vínculo N:N entre projetos e skills selecionadas na Etapa 7)
CREATE TABLE project_skills (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    skill_id UUID NOT NULL,
    custom_content TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_project_skills PRIMARY KEY (id),
    CONSTRAINT fk_project_skills_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_skills_skill FOREIGN KEY (skill_id)
        REFERENCES skills (id) ON DELETE RESTRICT,
    CONSTRAINT uk_project_skills_project_id_skill_id UNIQUE (project_id, skill_id)
);

-- 9. Tabela: bootstrap_runs (trilha de auditoria append-only de publicações no GitHub)
CREATE TABLE bootstrap_runs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    actor_id UUID NULL,
    run_status VARCHAR(20) NOT NULL,
    commit_sha VARCHAR(64) NULL,
    commit_url VARCHAR(255) NULL,
    files_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    payload_snapshot JSONB NULL,
    ip_address INET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_bootstrap_runs PRIMARY KEY (id),
    CONSTRAINT fk_bootstrap_runs_project FOREIGN KEY (project_id)
        REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_bootstrap_runs_actor FOREIGN KEY (actor_id)
        REFERENCES profiles (id) ON DELETE SET NULL,
    CONSTRAINT ck_bootstrap_runs_status_valid CHECK (
        run_status IN ('SUCCESS', 'FAILED')
    ),
    CONSTRAINT ck_bootstrap_runs_files_count_non_negative CHECK (
        files_count >= 0
    )
);

-- 10. Índices Padronizados (B-Tree, Unique Parciais e GIN)
CREATE UNIQUE INDEX udx_artifact_templates_global_key
    ON artifact_templates (artifact_key) WHERE owner_id IS NULL AND is_default = TRUE;
CREATE UNIQUE INDEX udx_artifact_templates_owner_key
    ON artifact_templates (owner_id, artifact_key) WHERE owner_id IS NOT NULL AND is_default = TRUE;
CREATE INDEX idx_artifact_templates_owner_id ON artifact_templates (owner_id);

CREATE UNIQUE INDEX udx_system_prompts_global_key
    ON system_prompts (prompt_key) WHERE owner_id IS NULL AND is_active = TRUE;
CREATE UNIQUE INDEX udx_system_prompts_owner_key
    ON system_prompts (owner_id, prompt_key) WHERE owner_id IS NOT NULL AND is_active = TRUE;
CREATE INDEX idx_system_prompts_owner_id ON system_prompts (owner_id);

CREATE INDEX idx_projects_owner_id_updated_at ON projects (owner_id, updated_at DESC);

CREATE INDEX idx_project_artifacts_project_id ON project_artifacts (project_id);
CREATE INDEX idx_project_artifacts_template_id ON project_artifacts (template_id);

CREATE UNIQUE INDEX udx_skills_global_slug
    ON skills (slug) WHERE owner_id IS NULL;
CREATE UNIQUE INDEX udx_skills_owner_slug
    ON skills (owner_id, slug) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_skills_owner_id ON skills (owner_id);
CREATE INDEX idx_skills_category_is_active ON skills (category, is_active);
CREATE INDEX idx_skills_compatible_stacks_gin ON skills USING GIN (compatible_stacks);

CREATE INDEX idx_project_skills_project_id ON project_skills (project_id);
CREATE INDEX idx_project_skills_skill_id ON project_skills (skill_id);

CREATE INDEX idx_bootstrap_runs_project_id_created_at ON bootstrap_runs (project_id, created_at DESC);
CREATE INDEX idx_bootstrap_runs_actor_id ON bootstrap_runs (actor_id);
CREATE INDEX idx_bootstrap_runs_payload_snapshot_gin ON bootstrap_runs USING GIN (payload_snapshot);

-- 11. Triggers de Atualização Automática e Imutabilidade de Auditoria
CREATE TRIGGER trg_profiles_set_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION trg_fn_set_updated_at();

CREATE TRIGGER trg_artifact_templates_set_updated_at
    BEFORE UPDATE ON artifact_templates
    FOR EACH ROW EXECUTE FUNCTION trg_fn_set_updated_at();

CREATE TRIGGER trg_system_prompts_set_updated_at
    BEFORE UPDATE ON system_prompts
    FOR EACH ROW EXECUTE FUNCTION trg_fn_set_updated_at();

CREATE TRIGGER trg_projects_set_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION trg_fn_set_updated_at();

CREATE TRIGGER trg_project_artifacts_set_updated_at
    BEFORE UPDATE ON project_artifacts
    FOR EACH ROW EXECUTE FUNCTION trg_fn_set_updated_at();

CREATE TRIGGER trg_skills_set_updated_at
    BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION trg_fn_set_updated_at();

CREATE TRIGGER trg_project_skills_set_updated_at
    BEFORE UPDATE ON project_skills
    FOR EACH ROW EXECUTE FUNCTION trg_fn_set_updated_at();

CREATE TRIGGER trg_bootstrap_runs_immutable
    BEFORE UPDATE OR DELETE ON bootstrap_runs
    FOR EACH ROW EXECUTE FUNCTION trg_fn_prevent_audit_mutation();

COMMIT;
```

---

## 6. Estrutura de Diretórios e Governança SDD

### 6.1 Estrutura do Código-Fonte (`sdd-project-bootstrapper`)

```text
sdd-project-bootstrapper/
├── db/
│   ├── schema.ts                       # Definição das tabelas Drizzle ORM alinhada ao DDL
│   ├── index.ts                        # Conexão Postgres (Supabase Pooler 6543)
│   ├── migrations/                     # Migrations SQL versionadas (Drizzle Kit)
│   └── seeds/
│       ├── seed.ts                     # Runner idempotente (upsert) para templates, prompts e skills
│       ├── templates/                  # Arquivos fonte dos templates SDD padrão
│       │   ├── PRD.template.md
│       │   ├── SAD.template.md
│       │   ├── DESIGN.template.md
│       │   ├── AGENTS.template.md
│       │   └── README.template.md
│       ├── prompts/                    # Arquivos fonte dos prompts de IA padrão
│       │   ├── generate-prd.md
│       │   ├── generate-sad.md
│       │   ├── review-design.md
│       │   └── generate-agents.md
│       └── skills/                     # Arquivos fonte das skills agênticas padrão
│           ├── web-solutions-architect.md
│           ├── sdd-spec-guardian.md
│           ├── postgres-migration-safety.md
│           └── ui-design-system-guard.md
├── docs/
│   ├── PRD.md                          # Especificação de produto
│   ├── SAD.md                          # Este documento de arquitetura
│   ├── DESIGN.md                       # Tokens visuais e diretrizes de UI
│   ├── DATABASE-PATTERN.md             # Guia obrigatório de nomenclatura e DDL PostgreSQL 16+
│   └── sdd/                            # Documentação granular de execução SDD por caso de uso
│       └── UC-001-bootstrap-github/
│           ├── PLAN-001-bootstrap-github.md
│           ├── UC-001-bootstrap-github.md
│           └── EV-001-bootstrap-github.md
├── src/
│   ├── app/
│   │   ├── api/                        # Camada 2: Controllers / Route Handlers (Zod + AuthGuard)
│   │   │   ├── projects/
│   │   │   ├── templates/
│   │   │   ├── skills/
│   │   │   ├── ai/generate/route.ts
│   │   │   └── github/
│   │   │       ├── repos/route.ts
│   │   │       ├── bootstrap/route.ts
│   │   │       ├── tree/route.ts
│   │   │       └── file/route.ts
│   │   ├── login/page.tsx
│   │   └── page.tsx
│   ├── services/                       # Camada 3: Business Logic (desacoplada de HTTP)
│   │   ├── project.service.ts
│   │   ├── artifact.service.ts
│   │   ├── skill.service.ts
│   │   ├── bootstrap.service.ts
│   │   ├── ai-generation.service.ts
│   │   └── sanitizer.service.ts        # Redação preventiva de PII e segredos antes de LLMs
│   ├── repositories/                   # Camada 4: Data Access Layer (Drizzle ORM)
│   │   ├── project.repository.ts
│   │   ├── artifact.repository.ts
│   │   ├── template.repository.ts
│   │   ├── prompt.repository.ts
│   │   └── skill.repository.ts
│   ├── domain/                         # Tipos puros, interfaces (Ports) e regras de interpolação
│   │   ├── models.ts
│   │   ├── ports/
│   │   │   ├── github.port.ts
│   │   │   └── llm-provider.port.ts
│   │   ├── template-engine.ts
│   │   └── artifact-assembler.ts
│   ├── infra/                          # Camada 5: Implementações de Adaptadores Externos
│   │   ├── http/
│   │   │   └── resilience.ts           # Timeout + Retry Exponential Backoff + HTTP 429 handling
│   │   ├── ai/
│   │   │   ├── genai.factory.ts        # Factory agnóstica de provedor LLM
│   │   │   └── gemini.adapter.ts       # Implementação @google/genai
│   │   ├── github/
│   │   │   └── octokit.adapter.ts      # Implementação @octokit/rest
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── server.ts
│   └── components/                     # Camada 1: Presentation Layer (React + Tailwind v4)
├── tests/                              # Testes unitários isolados da camada services/ e domain/
│   └── services/
├── .env.example                        # Contrato explícito de variáveis de ambiente obrigatórias
├── docker-compose.yml                  # Ambiente local opcional PostgreSQL 16+ para paridade
└── package.json
```

### 6.2 Estrutura Materializada no Repositório GitHub Alvo

```text
<github-owner>/<github-repo>/
├── .agents/
│   └── skills/
│       └── <skill-slug>/
│           └── SKILL.md                # Skills agênticas selecionadas na Etapa 7 (tabela skills)
├── docs/
│   ├── PRD.md                          # Especificação persistida em project_artifacts
│   ├── SAD.md                          # Arquitetura persistida em project_artifacts
│   ├── DESIGN.md                       # Diretrizes visuais persistidas em project_artifacts
│   └── sdd/                            # Pasta base preparada para PLAN-NNN / UC-NNN / EV-NNN
├── src/
│   └── .gitkeep                        # Estrutura inicial do diretório de código
├── .gitignore                          # Regras padrão de exclusão
├── AGENTS.md                           # Contrato operacional dos agentes (Etapa 8)
└── README.md                           # Documentação inicial do projeto
```

---

## 7. Contratos de API Interna (Route Handlers)

| Endpoint | Método | Payload / Query | Resposta (`200 OK`) | Descrição |
| --- | --- | --- | --- | --- |
| `/api/projects` | `GET` / `POST` | `{ name, slug, techStack, githubOwner, githubRepo, githubVisibility }` | `{ project, artifacts, skills }` | Lista ou cria projeto via `ProjectService` interpolando templates e skills padrão |
| `/api/projects/[id]/artifacts` | `PUT` | `{ artifactKey, content }` | `{ id, versionNumber, updatedAt }` | Salva alterações de `PRD`, `SAD`, `DESIGN`, `AGENTS` ou `README` |
| `/api/projects/[id]/skills` | `PUT` | `{ skillIds: string[], overrides?: Record<string, string> }` | `{ linkedCount }` | Atualiza as skills selecionadas na Etapa 7 para o projeto |
| `/api/templates` | `GET` / `PUT` / `POST` | `{ artifactKey, name, content, action?: 'reset_seed' }` | `{ templates: [...] }` | Lista/edita templates mestre no Supabase ou restaura do arquivo *seed* |
| `/api/skills` | `GET` / `POST` | `?category=...&stack=...` / `{ slug, name, category, description, content, isDefault }` | `{ skills: [...] }` | Lista skills disponíveis (globais + do usuário) ou cria nova skill |
| `/api/skills/[id]` | `PATCH` / `DELETE` | `{ name?, description?, content?, isActive? }` | `{ skill }` | Atualiza ou desativa uma skill customizada do usuário |
| `/api/ai/generate` | `POST` | `{ projectId, promptKey, userContext? }` | `{ generatedContent, modelUsed, tokensUsed }` | Gera ou refina `PRD`, `SAD`, `DESIGN` ou `AGENTS` usando `AIGenerationService` + `GenAIFactory` |
| `/api/github/repos` | `POST` | `{ projectId, name, description, private, org? }` | `{ owner, repo, htmlUrl, defaultBranch }` | Cria repositório no GitHub via `BootstrapService` e atualiza `projects.repo_url` |
| `/api/github/bootstrap` | `POST` | `{ projectId, message }` | `{ commitSha, commitUrl, filesCount }` | Orquestra commit atômico via Git Trees API e grava registro imutável em `bootstrap_runs` |
| `/api/github/tree` | `GET` | `?owner=...&repo=...&branch=main` | `{ tree: [{ path, type, sha, size }] }` | Lista pastas e arquivos do repositório remoto |
| `/api/github/file` | `GET` | `?owner=...&repo=...&path=...&branch=main` | `{ path, sha, content }` | Recupera e decodifica um arquivo específico do GitHub |

---

## 8. Paridade de Ambientes, Observabilidade e Testes

1. **Paridade de Ambientes e Segredos:**
   * Todos os parâmetros sensíveis (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_TOKEN`, `GEMINI_API_KEY`) são documentados em `.env.example` e injetados via Vercel Environment Variables em Staging/Produção.
   * Para desenvolvimento local isolado sem depender de internet, o projeto fornece `docker-compose.yml` opcional subindo `postgres:16-alpine` compatível com as mesmas migrations Drizzle.
2. **Observabilidade Estruturada:**
   * Logs estruturados em JSON nos Route Handlers e Services registrando `correlation_id`, `actor_id`, `service_name`, `duration_ms` e status HTTP (sem registrar payloads contendo tokens ou segredos).
3. **Estratégia de Testes SDD (Vitest):**
   * **Testes Unitários de Domínio e Serviços (`tests/services/`):** Cobertura obrigatória das regras de `ArtifactAssembler`, `SanitizerService`, `BootstrapService` e `AIGenerationService` utilizando *mocks* das interfaces `GitHubPort` e `LLMProviderPort`, garantindo execução rápida e isolada da camada HTTP.
   * **Testes de Contrato SQL:** Validação automatizada das migrations Drizzle contra PostgreSQL 16+ verificando triggers (`trg_fn_set_updated_at`, `trg_fn_prevent_audit_mutation`) e constraints (`pk_`, `fk_`, `uk_`, `ck_`).

---

## 9. Decisões Arquiteturais (ADRs)

### ADR-001: Framework Full-Stack Next.js 15 (React + TypeScript) em Detrimento de SPA Vite Isolada
* **Contexto:** A aplicação requer interface interativa rica em React + TypeScript, mas também precisa realizar operações privilegiadas no servidor usando `GITHUB_TOKEN` e `GEMINI_API_KEY`.
* **Decisão:** Adotar **Next.js 15 (App Router)** com React e TypeScript hospedado na Vercel, utilizando Route Handlers (`/api/*`) como camada HTTP e `src/services/` como camada de negócio isolada.
* **Consequências:** Proteção nativa das chaves de API no servidor Node.js, tipagem compartilhada end-to-end e deploy unificado sem necessidade de manter um segundo servidor backend separado.

### ADR-002: Supabase PostgreSQL 16+ + Drizzle ORM em Conformidade com `DATABASE-PATTERN.md`
* **Contexto:** Necessidade de persistência centralizada multi-dispositivo, catálogo compartilhado de skills, governança de prompts de IA, histórico auditável de publicações e conformidade estrita com `DATABASE-PATTERN.md`.
* **Decisão:** Adotar Supabase (PostgreSQL 16+ + Auth) com Drizzle ORM e migrations SQL versionadas, aplicando `snake_case` em inglês, PKs `UUID` (`gen_random_uuid()`), prefixos padronizados (`pk_`, `fk_`, `uk_`, `ck_`, `idx_`, `udx_`, `trg_`), triggers de `updated_at` e imutabilidade *append-only* na trilha `bootstrap_runs`.
* **Consequências:** Integridade referencial robusta, trilha auditável inviolável e 100% de aderência às regras de code review de banco de dados.

### ADR-003: Governança de IA via `GenAIFactory` e Prompts em Banco (`system_prompts`)
* **Contexto:** Acoplar serviços diretamente ao SDK de um único fornecedor LLM e manter prompts *hardcoded* dificulta ajustes de engenharia de prompt e evolução tecnológica.
* **Decisão:** Abstrair chamadas de IA atrás da interface `LLMProviderPort` instanciada por `GenAIFactory` (com `GeminiAdapter` como implementação primária), armazenar prompts na tabela `system_prompts` (com fallback para `db/seeds/prompts/`) e sanitizar segredos via `SanitizerService` antes do envio.
* **Consequências:** Agnosticismo de provedor LLM, ajuste dinâmico de prompts sem redeploy e mitigação ativa contra vazamento de credenciais.

### ADR-004: Integração Direta via `@octokit/rest` com Resiliência HTTP (Sem Terminal)
* **Contexto:** Criação de repositório, envio de arquivos, listagem de estrutura e leitura de documentos devem ocorrer diretamente pela página da aplicação, sem terminal local ou CLI `gh`.
* **Decisão:** Encapsular `@octokit/rest` (GitHub REST & Git Data API) em `GitHubOctokitAdapter` protegido por `withResiliencePolicy` (timeout, exponential backoff e tratamento de HTTP 429).
* **Consequências:** Zero dependência de ferramentas locais no dispositivo do usuário, commits atômicos via Git Trees API e resiliência contra instabilidades transitórias de rede.

### ADR-005: Armazenamento Híbrido de Templates, Prompts e Skills (Supabase DB + Arquivos Seed)
* **Contexto:** Manter templates de `PRD.md`, `SAD.md`, `DESIGN.md`, `AGENTS.md`, prompts de IA e skills agênticas *hardcoded* em código exige redeploy a cada ajuste metodológico.
* **Decisão:** Manter os artefatos oficiais versionados em `db/seeds/templates/`, `db/seeds/prompts/` e `db/seeds/skills/`, carregados no Supabase por um script de *seed* idempotente, permitindo customização pela UI e restauração do padrão a qualquer momento.
* **Consequências:** Versionamento claro em Git da linha de base metodológica, evolução dinâmica em produção sem redeploy e resiliência garantida via *fallback* para os arquivos *seed*.