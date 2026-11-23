# DATABASE PATTERN — {{PROJECT_NAME}}

**Versão:** 1.0  
**Data:** {{DATE}}  
**Stack:** {{STACK}}  
**Status:** Draft  

## 1. Objetivo

Definir padrões de modelagem, nomenclatura, migrações e boas práticas de banco de dados para o projeto **{{PROJECT_NAME}}**. Garante consistência, segurança e facilidade de manutenção.

## 2. Princípios Gerais

- Modelo relacional normalizado até a 3ª forma normal, com desnormalização justificada.
- Preferência por UUIDs como chave primária (facilita distribuição e integração).
- Todas as tabelas devem ter colunas de auditoria.
- Soft delete quando fizer sentido de negócio.
- Row Level Security (RLS) obrigatório em ambientes multi-tenant ou com dados sensíveis (especialmente Supabase/Postgres).

## 3. Padrão de Colunas de Auditoria

Toda tabela de negócio deve conter:

| Coluna         | Tipo          | Descrição                          |
|----------------|---------------|------------------------------------|
| `id`           | `uuid`        | Chave primária (default `gen_random_uuid()`) |
| `created_at`   | `timestamptz` | Data de criação (default `now()`)  |
| `updated_at`   | `timestamptz` | Data da última atualização         |
| `created_by`   | `uuid`        | Usuário que criou (opcional)       |
| `updated_by`   | `uuid`        | Usuário que atualizou (opcional)   |
| `deleted_at`   | `timestamptz` | Soft delete (nullable)             |

## 4. Nomenclatura

- Tabelas: `snake_case` no plural (`users`, `project_members`)
- Colunas: `snake_case`
- Índices: `idx_{tabela}_{coluna}`
- Unique constraints: `uq_{tabela}_{coluna}`
- Foreign keys: `fk_{tabela}_{coluna}`

## 5. Padrões de Relacionamento

| Tipo              | Padrão Recomendado                          |
|-------------------|---------------------------------------------|
| 1:N               | FK na tabela filha                          |
| N:N               | Tabela de junção com nome descritivo        |
| Hierarquia        | `parent_id` + constraint de auto-referência |
| Multi-tenant      | `tenant_id` ou `organization_id` obrigatório|

## 6. Migrações

- Usar ferramenta de migração da stack (ex.: Supabase migrations, Prisma, Drizzle, Alembic).
- Uma mudança por migração sempre que possível.
- Nome do arquivo: `YYYYMMDDHHMMSS_descricao_curta.sql`
- Sempre incluir rollback quando viável.
- Nunca alterar migrações já aplicadas em produção.

## 7. Segurança e Acesso

- Habilitar RLS em todas as tabelas públicas.
- Políticas devem ser explícitas e testadas.
- Evitar acesso direto via service role no cliente.
- Usar views ou funções para abstrair complexidade quando necessário.

## 8. Performance

- Índices em colunas usadas em `WHERE`, `JOIN` e `ORDER BY` frequentes.
- Evitar `SELECT *` em produção.
- Considerar particionamento apenas quando volume justificar.
- Monitorar queries lentas periodicamente.

## 9. Exemplos de Tabela Padrão

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);
```

## 10. Regras Específicas da Stack ({{STACK}})

- (Preencher com regras específicas: Supabase RLS, Prisma schema, etc.)

---

*Documento vivo. Atualize conforme o modelo de dados evolui.*
