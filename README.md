# acbr-node

Port do ACBr (Component Brazil) para Node.js — biblioteca + microservice HTTP para
emissao de documentos fiscais brasileiros (NF-e, em breve NFC-e).

## Estrutura (pnpm + turbo)

| Package | Responsabilidade |
| --- | --- |
| `@acbr-node/core` | XML, SOAP, certificado digital, dados SEFAZ por UF |
| `@acbr-node/nfe` | Dominio NF-e (autorizacao, cancelamento, consulta, eventos) |
| `@acbr-node/danfe` | Geracao do DANFE em PDF |
| `@acbr-node/http-api` | Microservice Express que expoe a lib (deploy Railway) |

## Requisitos

- Node.js >= 20 (ver `.nvmrc`)
- pnpm 9.15.0 (definido em `packageManager`)

## Setup

```bash
pnpm install   # instala todas as deps do workspace
pnpm build     # build de todos os packages (turbo)
pnpm test      # testes unitarios (vitest)
```

## Pipeline de qualidade

| Comando | O que faz |
| --- | --- |
| `pnpm typecheck` | `tsc --noEmit` em cada package |
| `pnpm lint` | ESLint flat config (`eslint.config.mjs`) |
| `pnpm check:tsc` | Compara contagem de erros TS com `.tsc-baseline` |
| `pnpm check:asany` | Compara contagem de `as any` em src/ com `.as-any-baseline` |
| `pnpm test` | Testes unitarios em todos os packages |
| `pnpm build` | Build incremental via turbo |
| `pnpm validate` | Roda todos os checks acima em sequencia (mesmo conjunto do CI) |

### Baselines evolutivas

Dois arquivos atuam como portao: `.tsc-baseline` (erros TypeScript permitidos) e
`.as-any-baseline` (`as any` permitidos em `packages/*/src/`). O CI falha se o numero
**crescer**. Para baixar o baseline depois de remover ocorrencias:

```bash
pnpm baseline:tsc      # regrava .tsc-baseline com o numero atual
pnpm baseline:asany    # regrava .as-any-baseline com o numero atual
```

## Hooks (husky + lint-staged)

`pnpm install` ja roda `husky` (script `prepare`). O pre-commit roda
`lint-staged`, que aplica `eslint --fix` nos arquivos com staged changes.

## CI

`.github/workflows/ci.yml` roda em PRs e push para `release`. Bloqueia merge se:

- houver erro TypeScript novo (alem do `.tsc-baseline`)
- houver violacao do ESLint
- houver `as any` novo em src/ (alem do `.as-any-baseline`)
- algum teste falhar
- o build quebrar

## HTTP API

Rotas atuais (em `packages/http-api/src/routes/`):

- `GET  /health`
- `POST /certificado/validar`
- `POST /consulta-nfe/...`
- `POST /manifestacao/...`
- `POST /autorizacao/enviar` — NF-e modelo 55
- `POST /cancelamento/enviar` — evento de cancelamento (tpEvento=110111)
- `POST /carta-correcao/enviar` — CC-e (tpEvento=110110)
- `POST /inutilizacao/enviar` — inutilizacao de faixa de numeracao
- `POST /danfe/gerar`

Todas as rotas mutadoras exigem o header `X-Internal-Token`. Ver
[`packages/http-api/src/middleware/auth.ts`](packages/http-api/src/middleware/auth.ts).

## Licenca

MIT — ver `LICENSE`.
