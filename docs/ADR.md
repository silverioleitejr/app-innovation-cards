# ADRs — Arquitetura de Decisões

> **Localização:** `docs/ADR.md`
> **Convenção:** Cada decisão importante deve ter sua própria ADR em `docs/adrs/ADR-NN-descri-resumida.md`. Este arquivo serve como índice/resumo geral.

---

## 📋 Índice de ADRs

| ID | Título | Status | Contexto |
|----|--------|--------|----------|
| **ADR-01** | Problema ao iniciar servidor Node.js | ✅ Resolvido | Problemas de importação e estrutura de transação no `db.ts` |
| **ADR-02** | [Próxima ADR] | — | — |
| **ADR-05** | Processo de Lint e Build Automatizado | ✅ Concluído | Erros de lint/build, reestruturação de componentes e script automatizado |

---

## ADR-01: Problema ao iniciar servidor Node.js

- **Status:** ✅ **Resolvido**
- **Data:** 2026-11-25
- **Autor:** Agente SDD
- **Requisitos Relacionados:** `RF-01`, `server.ts`, `db/db.ts`, `PRD.md`

---

### 1. Contexto

Durante o desenvolvimento do **Innovation Board**, ao tentar iniciar o servidor Node.js via comando `npx tsx server.ts`, o sistema apresentava erros de módulo não encontrado e problemas de sintaxe no arquivo `db/db.ts`.

**Sintomas:**
- `Cannot find module 'C:\@projetos\app-innovation-cards\db.ts' importado de server.ts`
- `Transform failed with 1 error: Expected "{" but found ";"` no `db.ts:1760`
- Servidor não conseguia iniciar, bloqueando o ambiente de desenvolvimento.

**Causas identificadas:**
1. **Caminho de importação incorreto** em `server.ts`: O import `./db.ts` apontava para um caminho inexistente na raiz, enquanto o arquivo `db.ts` estava localizado na pasta `db/`.
2. **Estrutura de transação mal fechada** no `db.db.ts`: O bloco `db.transaction(() => { ... }` não tinha o fechamento adequado do loop `for` e da chamada `tx()`, causando erro de "Unexpected end of file" durante a compilação TypeScript/WASM (esbuild).

**Forças influenciadoras:**
- Convencão de pastas do projeto (códigos de banco em `db/`, código server em raiz).
- Padrao de transações SQLite via `better-sqlite3`.
- Uso de `tsx` para execução direta de TypeScript em desenvolvimento.

---

### 2. Opções Consideradas

| Opção | Descrição | Vantagens | Desvantagens |
|-------|-----------|-----------|--------------|
| **Opção A:** Corrigir caminhos e estrutura | Ajustar import `./db.ts` para `./db/db.ts` e reorganizar o bloco `transaction` no `db.ts` | • Mantém organização original de pastas<br• Corrige a causa raiz do erro<br• Servidor inicia corretamente | • Requer pequenas alterações em dois arquivos |
| **Opção B:** Mover `db.ts` para raiz | Mover `db/db.ts` para `server.ts` ou raiz e ajustar imports |• Menor número de alterações de linha<br• Caminho de importação direto |• Quebra convenção de pastas do projeto<br• Reorganização maior de arquivos |
| **Opção C:** Usar alias de importação (tsconfig) | Configurar `@db` alias no `tsconfig.json` para `db/db.ts` |• Mantém caminhos curtos<br• Padrão modernidade |• Requer configuração adicional<br• Pode quebrar outras importações existentes |

---

### 3. Decisão

**Selecionada: Opção A** — Corrigir caminhos e estrutura.

**Ações executadas:**
1. **Correção do import em `server.ts`** (linha 26):
   - De: `import { ... } from './db.ts';`
   - Para: `import { ... } from './db/db.ts';`
   
2. **Correção da estrutura de transação em `db/db.ts`** (linhas 1723-1763):
   - Reestruturação do bloco `db.transaction(() => { ... }` para incluir corretamente:
     - O `for` loop sobre `newCards`
     - A chamada `appendAuditLog()` dentro do loop
     - A chamada `tx()` ao final do loop (fora do `for`, mas dentro da transação)
     - O fechamento `});` da função da transação
   - Adição do fechamento final do arquivo para evitar "Unexpected end of file"

**Comando de inicialização verificado:**
```bash
npx tsx server.ts
```
Servidor inicia na porta 3000 (definida no `.env` como `PORT=3000`).

---

### 4. Consequências e Trade-offs

#### Impactos Positivos (Ganhos)
- ✅ Servidor Node.js inicia sem erros
- ✅ Healthcheck `http://localhost:3000/api/health` retorna `{"status":"ok"}`
- ✅ Endpoints de autenticação funcionam (`/api/auth/demo-accounts`, `/api/auth/login`)
- ✅ Convenção de pastas do projeto mantida (`db/` para banco de dados)
- ✅ Fácil para novos desenvolvedores conseguirem rodar o ambiente

#### Trade-offs & Riscos Aceitos
- ⚠️ Pequena refatoração em dois arquivos (`server.ts` e `db/db.ts`)
- ⚠️ Nenhum risco detectado; alterações são de correção de bugs, não de redesign

---

### 5. Comando de Verificação Pós-Correção

Para confirmar que o ambiente está funcionando normalmente após as correções:

```bash
# 1. Iniciar o servidor (em um terminal)
cd C:\@projetos\app-innovation-cards
npx tsx server.ts

# 2. Em outro terminal, testar healthcheck
curl -s http://localhost:3000/api/health
# Expected: {"status":"ok"}

# 3. Testar endpoints de autenticação
curl -s http://localhost:3000/api/auth/demo-accounts
# Expected: JSON com lista de 6 contas demo

curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"silverio.leitejr@og1.com.br","password":"og1@2026"}'
# Expected: JSON com token de autenticação e dados do usuário

# 4. Verificar se a aplicação está acessível
open http://localhost:3000
```

---

### Rodando relacionado

| ID | Título | Status |
|----|--------|--------|
| **RF-01** | Autenticação Híbrida e Unificação de Conta por E-mail | ✅ Aprovado (PRD v0.4.0) |
| **RN-07.1** | Voto +1 somente com votação aberta | ✅ Resolvido |
| **RN-07.2** | Máximo 1 Voto +1 por usuário/sessão | ✅ Resolvido |
| **ADR-005** | Processo de Lint e Build Automatizado | ✅ Concluído |

---
*Documento gerado via skill `architecture-decision-records` / ADR padrão. Para novas ADRs, sugerido criar em `docs/adrs/ADR-NN-titulo-resumido.md` seguindo este padrão.*