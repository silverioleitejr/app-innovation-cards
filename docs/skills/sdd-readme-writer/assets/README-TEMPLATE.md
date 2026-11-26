# {{NOME_DO_PRODUTO}}

![{{RUNTIME}}](https://img.shields.io/badge/{{RUNTIME_LABEL}}-{{RUNTIME_VERSION}}-339933?style=for-the-badge&logo={{RUNTIME_LOGO}}&logoColor=white)
![{{LINGUAGEM}}](https://img.shields.io/badge/{{LINGUAGEM_LABEL}}-{{LINGUAGEM_VERSION}}-3178C6?style=for-the-badge&logo={{LINGUAGEM_LOGO}}&logoColor=white)
![{{FRAMEWORK_FRONTEND}}](https://img.shields.io/badge/{{FRONTEND_LABEL}}-{{FRONTEND_VERSION}}-61DAFB?style=for-the-badge&logo={{FRONTEND_LOGO}}&logoColor=0B1220)
![{{FRAMEWORK_BACKEND}}](https://img.shields.io/badge/{{BACKEND_LABEL}}-{{BACKEND_VERSION}}-000000?style=for-the-badge&logo={{BACKEND_LOGO}}&logoColor=white)
![{{BANCO_DE_DADOS}}](https://img.shields.io/badge/{{DB_LABEL}}-{{DB_VERSION}}-003B57?style=for-the-badge&logo={{DB_LOGO}}&logoColor=white)
![SDD](https://img.shields.io/badge/Metodologia-SDD-{{COR_PRIMARIA_HEX_SEM_HASH}}?style=for-the-badge)

{{DESCRICAO_EXECUTIVA_EM_UM_PARAGRAFO}}, desenvolvida sob a metodologia **Spec-Driven Development (SDD)**.

- **Repositório:** {{URL_REPOSITORIO}}
- **Contrato Operacional SDD:** [AGENTS.md](./AGENTS.md) · [docs/GUIDELINE.md](./docs/GUIDELINE.md)
- **Identidade Visual:** [docs/DESIGN.md](./docs/DESIGN.md)

---

## 1. Visão Geral das Funcionalidades

- **{{MODULO_OU_FUNCIONALIDADE_1}}:** {{DESCRICAO_OBJETIVA_BASEADA_NO_PRD}}
- **{{MODULO_OU_FUNCIONALIDADE_2}}:** {{DESCRICAO_OBJETIVA_BASEADA_NO_PRD}}
- **{{MODULO_OU_FUNCIONALIDADE_3}}:** {{DESCRICAO_OBJETIVA_BASEADA_NO_PRD}}

---

## 2. Stack Tecnológica e Identidade Visual

| Camada | Tecnologia | Papel |
|---|---|---|
| **Runtime & API** | {{RUNTIME_E_API}} | {{PAPEL_RUNTIME_E_API}} |
| **Frontend** | {{FRONTEND_STACK}} | {{PAPEL_FRONTEND}} |
| **Design System** | {{DESIGN_SYSTEM_STACK}} | {{PAPEL_DESIGN_SYSTEM}} |
| **Persistência** | {{DATABASE_STACK}} | {{PAPEL_DATABASE}} |

---

## 3. Como Executar Localmente

### Pré-requisitos
- **{{RUNTIME}}** `{{VERSAO_MINIMA}}` e **{{GERENCIADOR_PACOTES}}**

### Passo 1 — Instalar dependências

```bash
{{COMANDO_INSTALACAO}}
```

### Passo 2 — Configurar variáveis de ambiente (opcional)

Copie `.env.example` para `.env` caso necessário (nunca versione `.env`):

```bash
cp .env.example .env
```

### Passo 3 — Iniciar a aplicação

```bash
{{COMANDO_INICIO_DEV}}
```

{{OBSERVACAO_BANCO_OU_SEEDS_SE_APLICAVEL}}

### Passo 4 — Acessar e validar

- **Aplicação Web:** {{URL_LOCAL_WEB}}
- **Healthcheck:** {{URL_LOCAL_HEALTHCHECK}}

---

## 4. Scripts Disponíveis

| Script | Comando | Descrição |
|---|---|---|
| `{{SCRIPT_1}}` | `{{COMANDO_1}}` | {{DESCRICAO_1}} |
| `{{SCRIPT_2}}` | `{{COMANDO_2}}` | {{DESCRICAO_2}} |
| `{{SCRIPT_3}}` | `{{COMANDO_3}}` | {{DESCRICAO_3}} |

---

## 5. Estrutura do Projeto e Ordem de Leitura SDD

```text
{{SLUG_DO_PROJETO}}/
├── AGENTS.md                        # Contrato operacional dos agentes (raiz)
├── docs/
│   ├── GUIDELINE.md                 # Metodologia SDD e Ordem de Leitura Canônica (§4)
│   ├── TO-DO.md                     # Matriz de rastreabilidade e status de pacotes/melhorias
│   ├── PRD.md                       # Escopo funcional aprovado
│   ├── SAD.md                       # Arquitetura, segurança e ADRs
│   ├── ADR.md                       # Índice e registros operacionais de decisões
│   ├── DATABASE-PATTERN.md          # Convenções de banco de dados e transações
│   ├── NAMING-CONVENTION.md         # Convenções de código, banco, branches e commits
│   ├── DESIGN.md                    # Identidade visual e tokens do projeto
│   ├── GLOSSARY.md                  # Vocabulário oficial de domínio
│   ├── templates/                   # Templates mestres SDD
│   ├── skills/                      # Fonte da verdade das skills SDD
│   └── sdd/                         # Pacotes de especificação (NN-slug/)
├── .agents/
│   └── skills/                      # Skills publicadas para execução agêntica
└── {{DIRETORIOS_DE_CODIGO_FONTE}}
```

### Ordem de Leitura Canônica (`docs/GUIDELINE.md` §4)
1. `docs/GUIDELINE.md`
2. `AGENTS.md`
3. `docs/TO-DO.md`
4. `docs/PRD.md`
5. `docs/SAD.md`
6. `docs/ADR.md`
7. `docs/DATABASE-PATTERN.md`
8. `docs/NAMING-CONVENTION.md`
9. `docs/DESIGN.md`
10. `docs/sdd/NN-slug/` *(apoio de vocabulário sob demanda: `docs/GLOSSARY.md`)*

---

## 6. Principais Skills SDD Disponíveis

- **`sdd-workflow`:** coordenação das etapas SDD e verificação de gates de aprovação.
- **`sdd-structure-validator`:** auditoria somente-leitura da estrutura de pastas, fundação e pacotes.
- **`sdd-readme-writer`:** geração e padronização do `README.md` com badges Shields.io, stack, scripts e estrutura SDD.
- **`sdd-app-start`:** inicialização e verificação automatizada dos serviços definidos em `docs/SAD.md`.
