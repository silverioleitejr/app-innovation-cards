# DATABASE-PATTERN — {{PROJECT_NAME}}

> **Documento:** DATABASE-PATTERN.md  
> **Autor:** {{AUTHOR_NAME}} · {{AUTHOR_ROLE}}  
> **E-mail:** {{AUTHOR_EMAIL}} · **Telefone:** {{AUTHOR_PHONE}}  
> **Versão:** 0.1.0  
> **Data:** {{DATE}}  
> **Status:** Draft  

> **Regra:** este documento é a fonte para tudo que é banco de dados. `NAMING-CONVENTION.md` não repete estas regras.

---

## 1. Nomenclatura
- Tabelas: {{TABLE_NAMING_RULE}}
- Colunas: {{COLUMN_NAMING_RULE}}
- Prefixos de constraints/índices: `pk_`, `fk_`, `uk_`, `ck_`, `idx_`, `trg_` {{ADJUST_IF_NEEDED}}

## 2. Colunas de Auditoria
{{AUDIT_COLUMNS}}

## 3. Isolamento e Acesso por Linha
{{ROW_LEVEL_ISOLATION_RULES}}

## 4. Migrações
{{MIGRATION_RULES}} — migração já aplicada em ambiente compartilhado não é editada.

## 5. Ciclo de Vida dos Dados
{{SOFT_DELETE_RETENTION_RULES}}

## 6. Seeds e Dados de Referência
{{SEED_RULES}}
