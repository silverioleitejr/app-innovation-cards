---
name: sdd-app-start
description: Skill para inicialização automatizada de serviços do projeto (servidor, banco de dados, containers Docker) baseada nas definições de SAD.md. Verifica disponibilidade e apresenta URLs de entrada.
---

# Skill: sdd-app-start

> **Documento:** SKILL.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **Versão:** 1.0  
> **Data:** 2026-11-25  

## 1. Missão

Executar a inicialização automatizada dos serviços necessários ao projeto Innovation Board, baseando-se nas definições do documento `SAD.md`. A skill:

- Lê as definições de serviços do `SAD.md` (servidor, banco de dados, containers Docker, etc.)
- Tenta iniciar cada serviço identificado
- Verifica se todos os serviços estão em execução após o tentativa de inicialização
- Emite alertas detalhados em caso de falhas, com propostas de resolução
- Mostra as URLs de entrada da aplicação assim que todos os serviços estiverem disponíveis

**Regra fixa:** A skill nunca modifica arquivos de configuração nem injeta segredos. Apenas lê o `SAD.md` e tenta executar comandos de inicialização já definidos no projeto.

## 2. Ordem de Leitura (subconjunto)

1. `docs/SAD.md` — Definições de serviços e porta (seção 1 e 2)
2. `docs/GUIDELINE.md` §5 — Quando pedir aprovação humana (para mudanças de modelo de dados ou portas)
3. `AGENTS.md` §5 — Quando aprovação humana é necessária para mudanças de infraestrutura

## 3. Verificações e Definições de Serviços

O `SAD.md` deve conter uma seção ou metadados identificando os serviços a iniciar. Caso o `SAD.md` não contenha essa informação explicitamente, a skill utiliza o mapeamento padrão do projeto Innovation Board:

### 3.1 Serviços Padrão (Innovation Board)

| # | Serviço | Comando de Inicialização | Porta Padrão | Dependências |
|---|---------|-------------------------|--------------|--------------|
| 1 | **Servidor Node.js + Express** | `npx tsx server.ts` ou `npm run dev` | 3000 | `db/` (raiz), `src/`, `server.ts` |
| 2 | **Banco de Dados SQLite** | `db/db.ts` (auto-inicializa na abertura) | N/A (embarcado) | Arquivo `innovation-board.db` em `db/` |
| 3 | **WebSocket Server** | Iniciado junto com o servidor Express (porta 3000) | 3000 (ws://localhost:3000/ws) | Servidor Express ativo |

### 3.2 Comando de Inicialização Padrão

A skill tenta executar, em ordem:

1. `cd C:\\@projetos\\app-innovation-cards && npx tsx server.ts`
2. Caso falhe, tenta: `cd C:\\@projetos\\app-innovation-cards && npm run dev`
3. Caso falhe novamente, tenta: `cd C:\\@projetos\\app-innovation-cards && node server.js` (se existir)

### 3.3 Verificação de Disponibilidade

Após cada tentativa de inicialização, a skill executa:

- **Ping de porta:** Tenta conexão TCP na porta 3000 (`nc -z localhost 3000` ou equivalente)
- **Rota de healthcheck:** `GET http://localhost:3000/api/health` (se o servidor Express estiver rodando)
- **SDB status:** Verifica se o banco de dados responde a queries básicas

## 4. Fluxo de Execução

### 4.1 Início

A skill é acionada e:

1. **Lê `SAD.md`** para identificar quais serviços iniciar (usa o mapeamento padrão se não houver explicitamente definido)
2. **Exibe mensagem inicial:** "Iniciando serviços definidos em SAD.md..."
3. **Tenta executar** o comando de inicialização do servidor Node.js (passo 1 acima)

### 4.2 Verificação

Após cada tentativa, a skill:

1. **Aguarda** até 15 segundos para o serviço iniciar
2. **Verifica disponibilidade** da porta 3000 e da rota `/api/health`
3. **Registra status** de cada serviço (iniciado, falha, pulado)

### 4.3 Relatório Final

Ao final, a skill emite um relatório com:

- **Status de cada serviço:** iniciado / falha / pulado
- **Erros encontrados** (se houver) com mensagens detalhadas
- **Proposta de resolução** para cada erro encontrado
- **URLs de entrada da aplicação** (se todos os serviços estiverem disponíveis)

## 5. Exemplos de Saída

### 5.1 Sucesso

```
=== RELATÓRIO DE INICIALIZAÇÃO DE SERVIÇOS ===

[OK] Servidor Node.js + Express - Iniciado na porta 3000
[OK] Banco de Dados SQLite - Disponível (arquivo innovation-board.db)
[OK] WebSocket Server - Ativo em ws://localhost:3000/ws

=== URLs DE ENTRADA ===
- Aplicação HTTP: http://localhost:3000
- WebSocket: ws://localhost:3000/ws
- Healthcheck: http://localhost:3000/api/health

=== Todos os serviços disponíveis. A aplicação está pronta para uso. ===
```

### 5.2 Com Erros

```
=== RELATÓRIO DE INICIALIZAÇÃO DE SERVIÇOS ===

[ERRO] Servidor Node.js - Falha ao iniciar após 15s
   Motivo: Porta 3000 já em uso por outro processo ou erro de sintaxe em server.ts
   Proposta de resolução:
   - Verifique se outra aplicação está usando a porta 3000 e encerre-a
   - Confira se o arquivo server.ts não possui erros de sintaxe (`npm run lint`)
   - Tente reiniciar: `kill <processo>` && `npx tsx server.ts`

[OK] Banco de Dados SQLite - Disponível (arquivo innovation-board.db)
[ERRO] WebSocket Server - Não detectado após 10s
   Motivo: Servidor HTTP não iniciado corretamente
   Proposta de resolução:
   - Verifique o log acima do servidor HTTP
   - Execute manualmente: `npx tsx server.ts`
   - Confira se as dependências estão instaladas: `npm install`

[OK] Banco de Dados SQLite - Disponível

=== URLs Parciais (somente serviços disponíveis) ===
- Healthcheck: (verificar se servidor HTTP iniciou)
- A aplicação ainda não está totalmente disponível. Corrija os erros listados acima.
```

### 5.3 Nenhum Serviço Iniciado

```
=== RELATÓRIO DE INICIALIZAÇÃO DE SERVIÇOS ===

[ERRO] Nenhum serviço pôde ser iniciado automaticamente.

Motivo provável: O projeto requer configuração prévia ou dependências não instaladas.

Proposta de resolução:
- Execute `npm install` para instalar dependências
- Execute `npm run build` para compilar TypeScript
- Verifique o arquivo `SAD.md` para definições manuais de inicialização
- Consulte a documentação: `README.md` na raiz do projeto

=== URLs DE ENTRADA ===
- Nenhuma URL disponível no momento. Inicialize os serviços manualmente.
```

## 5. Integração com Outras Skills

| Skill | Papel |
|-------|-------|
| `sdd-structure-validator` | **Validante** | Verifica se a estrutura do projeto está correta antes da inicialização |
| `sdd-developer` | **Dependente** | Pode ser acionado após a inicialização para desenvolver funcionalidades |
| `sdd-prd-writer` | **Referência** | O `SAD.md` é gerado a partir do `PRD.md`; consistência entre os documentos |
| `sdd-adr-writer` | **Referência** | Decisões de arquitetura (ADRs) afetam como serviços são inicializados |

## 6. Critérios de Dependência

- **Obrigatório:** `docs/SAD.md` deve existir e conter definições de porta (ou o projeto deve seguir o padrão de porta 3000)
- **Recomendado:** `package.json` com scripts `dev`, `start` e `build` definidos
- **Condição de bloqueio:** Se `SAD.md` não indicar portas e o padrão de 3000 não estiver disponível, a skill aborta e pede ao usuário que especifique a porta manualmente

## 7. Exemplos de Comando de Acionamento

A skill pode ser acionada via tool `skill` com os seguintes parâmetros:

```
skill id="sdd-app-start"
```

Ou, se houver parâmetros no futuro:

```
skill id="sdd-app-start" --servidor --banco --docker
```

## 7. Próximos Passos Após Execução

- **Se todos os serviços iniciarem:** A aplicação estará disponível nas URLs mostradas no relatório. O próximo passo seria abrir o navegador em `http://localhost:3000` e testar as funcionalidades.
- **Se houver erros:** Corrigir conforme as propostas de resolução e reaplicar a skill.
- **Se nenhum serviço iniciar:** Seguir as propostas de resolução manual e, se necessário, consultar o `README.md` ou o `SAD.md` para definições manuais.

---