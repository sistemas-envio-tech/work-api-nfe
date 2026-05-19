# Contribuindo

Obrigado pelo interesse em contribuir com o `acbr-node`. Este guia cobre setup
local, padroes de codigo e o fluxo de pull request.

## Setup

Pre-requisitos:

- Node.js >= 20 (ver `.nvmrc`)
- pnpm 9.15.0 (definido em `packageManager`; pode ser ativado via `corepack enable pnpm`)

```bash
git clone git@github.com:sistemas-envio-tech/work-api-nfe.git
cd work-api-nfe
pnpm install        # instala todas as deps + roda husky prepare
pnpm build          # build inicial gera os .d.ts dos workspaces
pnpm test           # confirma que esta tudo verde
```

## Estrutura do monorepo

```
packages/
  core/       # XML, SOAP, certificado, dados SEFAZ (sem dominio NFe)
  nfe/        # Dominio NFe (autorizacao, eventos, consultas)
  danfe/      # Geracao do DANFE em PDF
  http-api/   # Microservice Express (deploy Railway)
```

`core` nao depende de ninguem. `nfe` e `danfe` dependem de `core`. `http-api`
depende dos 3. Sem dependencia circular.

## Fluxo de PR

1. Saia de `release` e crie uma branch com prefixo `feat-`, `fix-`, `chore-`
   ou `refactor-`.
2. Mantenha PRs focados num unico tema. Se o trabalho cresce, divida em commits
   logicos (ver "Commits" abaixo).
3. Antes de abrir o PR, rode `pnpm run validate` localmente. Tem que ficar
   100% verde.
4. Abra o PR contra `release`.
5. CI corre em push direto pra `release` (workflow_dispatch tambem disponivel).

## Quality gates (que o CI roda)

`pnpm run validate` encapsula tudo:

```bash
pnpm typecheck     # tsc --noEmit em cada package
pnpm lint          # ESLint flat config (eslint.config.mjs)
pnpm check:asany   # gate evolutivo: max .as-any-baseline ocorrencias em src/
pnpm check:tsc     # gate evolutivo: max .tsc-baseline erros TS
pnpm test          # vitest workspace (4 packages)
pnpm build         # turbo build
```

### Baselines evolutivas

`.tsc-baseline` e `.as-any-baseline` sao gates que so descem, nunca sobem.
Ambos atualmente em **0**. Se voce remover `as any` ou um erro TS, atualize:

```bash
pnpm baseline:asany    # regrava .as-any-baseline com a contagem atual
pnpm baseline:tsc      # regrava .tsc-baseline com a contagem atual
```

Se voce **adicionar** um `as any` necessario (caso raro, normalmente ha um tipo
melhor), o CI vai falhar com a contagem nova. Justifique no PR antes de
atualizar o baseline.

## Padroes de codigo

- TypeScript **strict** em todo lugar. Veja `tsconfig.base.json`.
- ESM nativo (`"type": "module"`). Imports relativos com `.js` mesmo em arquivos `.ts`.
- Nao usar `as any`. Para narrowing de XML parseado, use `asXmlNode` / `asXmlArray`
  de `@acbr-node/core` (ver `packages/danfe/src/danfe-data.ts` como referencia).
- Validacao de input: Zod (`@acbr-node/nfe` usa para o leiaute SEFAZ). Para http-api,
  validacoes minimas inline na rota antes de chamar `buildNFeClient`.
- Logger: use `appLogger` (em http-api) ou `LoggerInterface` injetado. Nao usar
  `console.*` diretamente em codigo de runtime.
- Testes: Vitest em `__tests__/` no nivel do package.

## Commits

Conventional Commits + escopo do package:

```
feat(http-api): rota POST /cancelamento/enviar
fix(core): handle proxy URL com porta nao-padrao
refactor: tipar parser XML do DANFE
chore(pipeline): atualizar ESLint para 9.39
```

Pre-commit (husky + lint-staged) roda `eslint --fix --max-warnings 0` nos
arquivos staged. Se voce nao tem pnpm no PATH (Windows/Git Bash), use
`corepack enable pnpm` ou faca commit do PowerShell.

## NFCe (modelo 65)

Atualmente nao implementado. O validator Zod aceita `mod: 65` mas as URLs SEFAZ
NFCe por UF nao estao em `servicos-nfe.json` e o gerador DANFCe 80mm nao existe.
Sera adicionado em PR dedicado quando houver demanda — ver auditoria interna.

## Reportar problemas

Issues via GitHub. Inclua:
- Versao do Node e do pnpm
- Stack trace completo
- XML de entrada (sem CNPJ/dados pessoais)
- Resposta SEFAZ quando aplicavel
