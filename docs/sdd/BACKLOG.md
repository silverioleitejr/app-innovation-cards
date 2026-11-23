# BACKLOG — Kit de Metodologia SDD

> **Documento:** BACKLOG.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **E-mail:** silverio.leitejr@og1.com.br · **Telefone:** (11) 96020-6334  
> **Versão:** 1.1.0  
> **Data:** 2026-11-19  
> **Status:** Ativo  

Ao iniciar um item, mover para `Em andamento`; ao concluir, `Concluído` com a versão do kit.

| ID | Item | Descrição | Prioridade | Status | Observações |
|----|------|-----------|------------|--------|-------------|
| BL-01 | Skill `sdd-spec-guardian` | Valida a consistência interna de um pacote (US × UC × TC): cobertura dos `CAU`, `RU` e `RNF`, ausência de conflito com PRD/SAD. | Alta | Pendente | Complementa o `sdd-structure-validator`, que cuida da estrutura. |
| BL-02 | Skill de arquitetura (SAD / DATABASE-PATTERN) | Gera `SAD.md` e `DATABASE-PATTERN.md` a partir do PRD (Etapa 1a). | Média | Pendente | Hoje a Etapa 1a usa só os templates. |
| BL-03 | Sincronização de skills | `scripts/sync-skills.sh` com publicação, remoção de órfãs e `--check` (diff recursivo). | Média | Concluído | v1.2.0 |
| BL-04 | Regeneração do deck | Deck alinhado à ordem canônica, Etapas 0/1a/1b, gates G1–G3 e 7 skills. | Média | Concluído | v1.2.0 |
| BL-05 | Neutralização do USE-CASE-TEMPLATE | Referências ao `SAD.md` §3–§9 em vez de stack fixa. | Alta | Concluído | v1.2.0 |
| BL-06 | Skill `sdd-adr-writer` | Registro de decisões em `ADR.md`, append-only. | Alta | Concluído | v1.2.0 (marcadores de inserção) |
| BL-07 | Bootstrapper | Automatiza o bootstrap: copia o kit, roda o sync e instancia os templates com metadados do projeto. | Média | Pendente | Citado no deck. |
| BL-08 | Verificação automática de consistência do kit | Script que checa IDs, referências a seções do GUIDELINE e a lista de skills nos documentos. | Baixa | Pendente | Reduz drift entre documentos e deck. |
