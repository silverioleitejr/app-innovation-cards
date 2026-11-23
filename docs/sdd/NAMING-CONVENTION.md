# NAMING CONVENTION — {{PROJECT_NAME}}

**Versão:** 1.0  
**Data:** {{DATE}}  
**Stack:** {{STACK}}  
**Status:** Draft  

## 1. Objetivo

Definir padrões de nomenclatura consistentes para código, arquivos, pastas, banco de dados e versionamento do projeto **{{PROJECT_NAME}}**. O objetivo é reduzir atrito cognitivo, facilitar onboarding de agentes de IA e manter a base de código legível e previsível.

## 2. Princípios Gerais

- Prefira clareza sobre brevidade.
- Use inglês para identificadores de código (variáveis, funções, classes, tabelas).
- Use português apenas em comentários de negócio ou documentação de produto quando fizer sentido.
- Seja consistente em todo o repositório.
- Nomes devem ser autoexplicativos (evite abreviações obscuras).

## 3. Pastas e Arquivos

| Tipo                    | Convenção                          | Exemplo                          |
|-------------------------|------------------------------------|----------------------------------|
| Pastas de domínio       | kebab-case                         | `user-management/`               |
| Componentes React/Vue   | PascalCase                         | `UserProfileCard.tsx`            |
| Páginas / Rotas         | kebab-case                         | `user-profile.tsx`               |
| Hooks / Utilitários     | camelCase com prefixo              | `useAuth.ts`, `formatDate.ts`    |
| Arquivos de teste       | mesmo nome + `.test` ou `.spec`    | `UserProfileCard.test.tsx`       |
| Constantes              | SCREAMING_SNAKE_CASE               | `MAX_RETRY_ATTEMPTS`             |
| Tipos / Interfaces      | PascalCase                         | `UserProfile`, `ApiResponse`     |

### Estrutura de pastas recomendada ({{STACK}})

```
src/
├── app/                  # Rotas (Next.js App Router)
├── components/
│   ├── ui/               # Componentes genéricos
│   └── domain/           # Componentes de domínio
├── lib/                  # Utilitários e clientes
├── hooks/
├── types/
└── styles/
```

## 4. Banco de Dados

- Tabelas: `snake_case` no plural (`users`, `order_items`)
- Colunas: `snake_case` (`created_at`, `user_id`)
- Chaves primárias: `id` (UUID preferencialmente)
- Chaves estrangeiras: `{tabela_singular}_id` (`user_id`)
- Índices: `idx_{tabela}_{coluna}`
- Constraints: `pk_`, `fk_`, `uq_`, `chk_`

## 5. Git e Versionamento

- Branches: `tipo/descricao-curta`  
  Exemplos: `feat/user-authentication`, `fix/login-redirect`, `chore/update-deps`
- Commits: Conventional Commits  
  Exemplos: `feat: add user profile page`, `fix: resolve null pointer in auth`
- Pull Requests: título descritivo + referência à issue quando existir

## 6. Variáveis de Ambiente

- Prefixo por ambiente quando necessário: `NEXT_PUBLIC_`, `DATABASE_URL`
- Nomes em `SCREAMING_SNAKE_CASE`
- Nunca commitar valores sensíveis

## 7. Exemplos de Boas Práticas

| Ruim                        | Bom                              |
|-----------------------------|----------------------------------|
| `usrPrfl`                   | `userProfile`                    |
| `getData`                   | `getUserById`                    |
| `comp1.tsx`                 | `UserAvatar.tsx`                 |
| `tbl_usr`                   | `users`                          |

## 8. Exceções e Regras Específicas da Stack

- **{{STACK}}**: (preencher regras específicas da stack escolhida)
- Bibliotecas de terceiros: seguir a convenção da própria biblioteca quando integrar.

---

*Documento vivo. Atualize conforme o projeto evolui.*
