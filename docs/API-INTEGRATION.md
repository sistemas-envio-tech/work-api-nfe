# work-api-nfe — Guia de Integração

> **Audiência**: este documento é destinado a quem vai consumir as APIs deste
> microservice a partir de outra aplicação (ex.: o ERP `work-manager`, ou
> qualquer agente Claude trabalhando nesse outro repo).
>
> A leitura deste guia deve ser suficiente para implementar um cliente HTTP
> completo sem precisar abrir o código deste repositório.

---

## 1. Visão geral

`work-api-nfe` é um microservice HTTP que envelopa a lib `@acbr-node/nfe` para
emissão de documentos fiscais brasileiros via SEFAZ. Roda em Node.js 20+,
deploy típico Railway. Stateless: certificado, CSC e dados da empresa são
passados em cada request — o servidor não persiste nada.

**Modelos suportados**:
- NF-e (modelo 55) — Nota Fiscal Eletrônica B2B/B2C
- NFC-e (modelo 65) — Nota Fiscal de Consumidor Eletrônica (cupom 80mm)

**Cobertura SEFAZ**: 27 UFs brasileiras, modo produção + homologação,
contingência SVC para NF-e.

---

## 2. Autenticação

Toda rota exceto `GET /health` exige o header:

```
X-Internal-Token: <valor configurado no env INTERNAL_TOKEN do servidor>
```

Sem o header ou com valor incorreto: **401 Unauthorized**.

> O token é compartilhado entre cliente e servidor via variável de ambiente.
> Não é JWT, não rotaciona — é um secret de longo prazo. Trate como senha de
> serviço.

### Header opcional: `X-Request-Id`

Pode ser enviado pelo cliente para correlação de logs. Se omitido, o
servidor gera um UUID v4. O valor (recebido ou gerado) é **sempre** ecoado no
response header `X-Request-Id`, e logado no início de cada request no servidor.

```
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
```

Use isto para correlacionar suas chamadas com os logs do server em troubleshooting.

---

## 3. Formato base de requisição

`Content-Type: application/json` em todas as rotas mutadoras. Body é JSON,
limite 10MB (suficiente para XMLs grandes).

### Payload comum (`NFeClientPayload`)

A maioria das rotas exige um payload base com certificado + identificação da
empresa. Os campos são:

```typescript
interface NFeClientPayload {
  // Obrigatórios
  ambiente: 1 | 2;          // 1=produção, 2=homologação
  uf: string;               // sigla 2 letras: 'SP', 'RJ', 'MG', etc.
  cnpj: string;             // CNPJ do emitente, 14 dígitos sem máscara
  certificado: {
    pfxBase64: string;      // PFX A1 codificado em base64
    senha: string;          // senha do PFX
  };

  // Opcionais — defaults indicados
  razaoSocial?: string;          // default 'SEM RAZAO SOCIAL'
  nomeFantasia?: string;
  inscricaoEstadual?: string;    // default 'ISENTO'
  inscricaoMunicipal?: string;
  crt?: 1 | 2 | 3;               // 1=Simples, 2=Simples-excesso, 3=Normal. Default 3.

  // Endereço da empresa — necessário para emissão NF-e/NFC-e completa.
  // Para eventos (cancelamento/CCe/inutilização) basta o CNPJ.
  enderecoEmpresa?: {
    xLgr: string;            // logradouro
    nro: string;             // número (string, não número)
    xCpl?: string;           // complemento
    xBairro: string;
    cMun: number;            // código IBGE do município
    xMun: string;            // nome do município
    UF: string;              // sigla UF
    CEP: string;             // 8 dígitos sem máscara
    cPais?: number;          // default 1058 (Brasil)
    xPais?: string;          // default 'BRASIL'
    fone?: string;
  };

  // NFCe (modelo 65) — obrigatório se for emitir NFCe.
  csc?: string;              // Código de Segurança do Contribuinte (token SEFAZ)
  cscId?: string;            // ID do CSC, zero-padded a 6 dígitos (ex.: '000001')

  logXml?: boolean;          // default false. Loga XML req/resp sanitizado (sem CSC).
}
```

> O certificado é enviado **em cada request**. O servidor carrega na memória
> apenas durante o request, descarta no fim. Isso permite multi-tenant sem
> persistência mas tem custo de parsing PFX a cada chamada (~50-200ms).

---

## 4. Respostas e erros

### Sucesso

Cada rota retorna JSON com a chave `operacao` identificando a ação executada
+ campos específicos do retorno SEFAZ.

```json
{
  "operacao": "Autorizacao_Enviar",
  "cStat": "100",
  "xMotivo": "Autorizado o uso da NF-e",
  "protNFe": { ... },
  "xmlAutorizado": "<nfeProc>...</nfeProc>",
  "...": "..."
}
```

### Erro de validação de input (400)

```json
{ "error": "chNFe (44 digitos) obrigatoria" }
```

### Erro de autenticação (401)

```json
{ "error": "Token invalido" }
```

### Erro SEFAZ (502)

Erros vindos do SEFAZ (cStat 1xx ou xxx de rejeição) ou erros SOAP de transporte.

```json
{
  "error": "SefazError",
  "cStat": "108",
  "xMotivo": "Servico paralisado momentaneamente",
  "retryable": true
}
```

**`retryable: true`** → cStat 105/108/109 (lote em processamento ou serviço
paralisado). Cliente pode esperar e retentar.

```json
{
  "error": "SoapError",
  "message": "Timeout na comunicação com SEFAZ"
}
```

### Erro interno (500)

```json
{ "error": "InternalError", "message": "..." }
```

Cobre erros não-mapeados: parsing PFX inválido, CSC ausente para NFCe, NCM
malformado capturado pelo Zod, etc.

---

## 5. Rotas

### 5.1 `GET /health` — Healthcheck

Sem auth, sem body. Retorna status do serviço. Usado pelo Railway pra detectar
unhealthy deploys.

**Response 200**:
```json
{
  "status": "ok",
  "service": "acbr-node-http-api",
  "timestamp": "2026-05-19T12:34:56.789Z"
}
```

---

### 5.2 `POST /certificado/info`

Parseia o PFX e retorna metadados (CN, validade, CNPJ). **Stateless** — não
persiste o certificado. Útil pra validar credenciais antes de cadastrar uma
filial no ERP.

**Request**:
```json
{
  "pfxBase64": "MIIK...",
  "senha": "minhaSenha"
}
```

**Response 200**:
```json
{
  "subject": {
    "CN": "EMPRESA TESTE LTDA:08043291000155",
    "OU": "AC SOLUTI v5",
    "O": "ICP-Brasil"
  },
  "validFrom": "2025-01-15T00:00:00.000Z",
  "validTo": "2026-01-15T23:59:59.000Z",
  "daysUntilExpiry": 241,
  "isExpired": false,
  "issuer": { "CN": "AC SOLUTI..." },
  "serialNumber": "..."
}
```

> Use `daysUntilExpiry` para alertar a equipe operacional 30+ dias antes do
> vencimento do certificado.

---

### 5.3 `POST /consulta-nfe/status-servico`

Consulta status do serviço SEFAZ pra UF do emitente. Use antes de emitir em
larga escala pra confirmar que o serviço está respondendo.

**Request**: `NFeClientPayload`

**Response 200**:
```json
{
  "operacao": "ConsultaNFE_StatusServico",
  "tpAmb": "2",
  "verAplic": "SP_NFE_PL009_V4",
  "cStat": "107",
  "xMotivo": "Servico em Operacao",
  "cUF": "35",
  "dhRecbto": "2026-05-19T12:30:00-03:00",
  "tMed": "1"
}
```

`cStat=107` = serviço em operação. `108`/`109` = paralisado/sem retorno.

---

### 5.4 `POST /consulta-nfe/distribuicao-dfe-por-ult-nsu`

Pagina manifestações por NSU (Número Sequencial Único). Use pra puxar NFes
emitidas contra o CNPJ no SEFAZ Nacional.

**Request** (`NFeClientPayload` + `ultNSU`):
```json
{
  "ambiente": 2,
  "uf": "SP",
  "cnpj": "08043291000155",
  "certificado": { "pfxBase64": "...", "senha": "..." },
  "ultNSU": "0"
}
```

**Response 200**: array de documentos com `docs[].docZip` (XML compactado em
base64 + gzip).

---

### 5.5 `POST /consulta-nfe/distribuicao-dfe-por-chave-acesso`

Mesma rota, mas busca por chave específica em vez de paginar.

**Request**: `NFeClientPayload` + `chNFe: string` (44 dígitos)

---

### 5.6 `POST /manifestacao/enviar` (single)

Manifesta uma NFe (ciência/confirmação/desconhecimento/não-realizada).
Usado quando o ERP recebe NFe de fornecedor e precisa responder à SEFAZ.

**Request**:
```json
{
  "ambiente": 2, "uf": "SP", "cnpj": "...", "certificado": {...},
  "chNFe": "35230612345678901234550010000010011003290410",
  "tipo": "ciencia",
  "xJust": "opcional, obrigatorio para desconhecimento/nao_realizada (min 15 chars)"
}
```

**`tipo` válidos**: `confirmacao`, `ciencia`, `desconhecimento`, `nao_realizada`.

**Response 200**:
```json
{
  "operacao": "Manifestacao_Enviar",
  "tipo": "ciencia",
  "chNFe": "...",
  "cStat": "135",
  "xMotivo": "Evento registrado e vinculado a NF-e",
  "nProt": "...",
  "dhRegEvento": "2026-05-19T12:30:00-03:00",
  "tpEvento": "210210",
  "nSeqEvento": "1"
}
```

### 5.7 `POST /manifestacao/enviar-lote`

Manifesta múltiplas NFes em sequência. Mesmo payload, mas `chaves: string[]`
em vez de `chNFe`. Retorna agregado `{ total, sucesso, falha, resultados }`.

---

### 5.8 `POST /autorizacao/enviar` — **Emissão NF-e ou NFC-e**

A rota principal. Aceita objeto NFe completo conforme leiaute SEFAZ 4.00.
Auto-detecta NFe vs NFCe via `nfe.ide.mod`.

**Request**:
```json
{
  "ambiente": 2, "uf": "SP", "cnpj": "...", "certificado": {...},
  "enderecoEmpresa": { ... },
  "csc": "secret",              // só se mod=65
  "cscId": "000001",            // só se mod=65
  "sincrono": true,             // default true. false = recibo + polling automático
  "nfe": {
    "ide": {
      "cUF": 35,
      "natOp": "VENDA DE MERCADORIA",
      "mod": 55,                // 55=NFe, 65=NFCe
      "serie": 1,
      "nNF": 1001,
      "dhEmi": "2026-05-19T12:00:00-03:00",
      "tpNF": 1,                // 0=entrada, 1=saída
      "idDest": 1,              // 1=interna, 2=interestadual, 3=exterior
      "cMunFG": 3550308,
      "tpImp": 1,               // 1=retrato A4 (NFe), 4=portrait 80mm (NFCe)
      "tpEmis": 1,              // 1=normal
      "tpAmb": 2,               // 1=produção, 2=homologação
      "finNFe": 1,              // 1=normal, 2=complementar, 3=ajuste, 4=devolução
      "indFinal": 1,            // 0=normal, 1=consumidor final (NFCe sempre 1)
      "indPres": 1,             // 1=presencial (NFCe não pode ser 0)
      "procEmi": 0,
      "verProc": "meu-erp-1.0"
    },
    "emit": { ... },
    "dest": { ... },
    "det": [ { "nItem": 1, "prod": {...}, "imposto": {...} }, ... ],
    "total": { "ICMSTot": { "vProd": 100, "vNF": 100, ... } },
    "transp": { "modFrete": 9 },
    "pag": { "detPag": [ { "tPag": "01", "vPag": 100 } ] }
  }
}
```

**Response 200 (autorizada, modo síncrono)**:
```json
{
  "operacao": "Autorizacao_Enviar",
  "sincrono": true,
  "tpAmb": "2",
  "verAplic": "SP_NFE_PL009_V4",
  "cStat": "100",
  "xMotivo": "Autorizado o uso da NF-e",
  "cUF": "35",
  "dhRecbto": "2026-05-19T12:00:30-03:00",
  "protNFe": {
    "tpAmb": "2",
    "verAplic": "...",
    "chNFe": "35230612345...",
    "dhRecbto": "...",
    "nProt": "135000000000001",
    "digVal": "...",
    "cStat": "100",
    "xMotivo": "Autorizado o uso da NF-e"
  },
  "xmlAutorizado": "<?xml...?><nfeProc>...</nfeProc>"   // XML pronto pra arquivar
}
```

**Importante para NFCe** (`mod=65`): além de `csc`+`cscId` obrigatórios,
o objeto NFe deve obedecer:
- `ide.idDest = 1` (operação interna)
- `ide.indFinal = 1` (consumidor final)
- `ide.indPres ≠ 0` (sempre presencial)
- `transp.modFrete = 9` (sem frete)
- sem `cobr.dup` (venda à vista, sem duplicatas)

Violações retornam **400** com mensagem específica.

---

### 5.9 `POST /cancelamento/enviar`

Evento de cancelamento (tpEvento=110111). NFe pode ser cancelada até 24h após
autorização; NFCe até 30min.

**Request**:
```json
{
  "ambiente": 2, "uf": "SP", "cnpj": "...", "certificado": {...},
  "chNFe": "35230612345...",
  "nProt": "135000000000001",
  "xJust": "Erro no preenchimento dos dados do destinatario"
}
```

`xJust` entre 15 e 255 caracteres. Modelo é detectado automaticamente da
chave (posições 20-21).

**Response 200**:
```json
{
  "operacao": "Cancelamento_Enviar",
  "cStat": "135",
  "xMotivo": "Evento registrado e vinculado a NF-e",
  "chNFe": "...",
  "tpEvento": "110111",
  "nProt": "..."
}
```

---

### 5.10 `POST /carta-correcao/enviar`

Carta de Correção Eletrônica (tpEvento=110110). **Apenas NFe (mod=55)** —
NFCe não permite CC-e (retorna 502 se chNFe for de NFCe).

**Request**:
```json
{
  "ambiente": 2, "uf": "SP", "cnpj": "...", "certificado": {...},
  "chNFe": "35230612345...",
  "xCorrecao": "Corrigir descricao do produto X conforme...",
  "nSeqEvento": 1
}
```

`xCorrecao` entre 15 e 1000 caracteres. `nSeqEvento` 1..20 (cliente controla
sequência; apenas a última é considerada vigente pela SEFAZ).

---

### 5.11 `POST /inutilizacao/enviar`

Inutiliza faixa de numeração quebrada (ex.: nNF 51..60 não usados após erro).

**Request**:
```json
{
  "ambiente": 2, "uf": "SP", "cnpj": "...", "certificado": {...},
  "ano": 26,                  // últimos 2 dígitos do ano
  "serie": 1,
  "nNFIni": 51,
  "nNFFin": 60,
  "xJust": "Quebra de numeracao por falha no sistema...",
  "modelo": 55                // opcional: 55 (default) ou 65
}
```

---

### 5.12 `POST /danfe/gerar`

Gera o documento auxiliar em PDF. Auto-detecta NFe (A4) vs NFCe (80mm cupom)
via presença de `<infNFeSupl>` no XML ou via `ide.mod`.

**Request**:
```json
{
  "xml": "<?xml...?><nfeProc>...</nfeProc>",
  "modelo": 65,                       // opcional: força modo NFCe/NFe
  "mensagemRodape": "Troca em 7 dias" // opcional, só NFCe
}
```

**Response 200**:
- `Content-Type: application/pdf`
- `Content-Length: <bytes>`
- Body: PDF binário

> Para grandes volumes, considere cache no cliente (mesma chNFe sempre gera o
> mesmo PDF — o XML autorizado é imutável).

---

## 6. Tipos da NFe (resumo do leiaute 4.00)

Para emitir NF-e completa, o objeto `nfe` segue a estrutura abaixo. Campos
omitidos abaixo estão na lib `@acbr-node/nfe/src/types/nfe.ts` no repositório
do work-api-nfe.

```typescript
interface NFe {
  ide: Identificacao;
  emit: Emitente;
  dest?: Destinatario;              // opcional em NFCe sem CPF
  det: Detalhe[];                   // 1..990 itens
  total: { ICMSTot: ICMSTot };
  transp: { modFrete: 0|1|2|3|4|9; transporta?: ...; vol?: Volume[] };
  cobr?: { fat?: Fatura; dup?: Duplicata[] };  // NFCe: omitir
  pag: { detPag: DetalhePagamento[]; vTroco?: number };
  infAdic?: { infAdFisco?: string; infCpl?: string; ... };
  infRespTec?: { CNPJ, xContato, email, fone, idCSRT?, hashCSRT? };
}
```

### Formas de pagamento (`detPag.tPag`)

| Código | Descrição |
|---|---|
| 01 | Dinheiro |
| 02 | Cheque |
| 03 | Cartão de Crédito |
| 04 | Cartão de Débito |
| 05 | Crédito Loja |
| 10 | Vale Alimentação |
| 11 | Vale Refeição |
| 15 | Boleto Bancário |
| 17 | PIX |
| 18 | Transferência Bancária |
| 90 | Sem Pagamento |
| 99 | Outros |

### Status SEFAZ (`cStat`) comuns

| cStat | Significado | Ação |
|---|---|---|
| 100 | Autorizado | ✅ emitir DANFE |
| 101 | Cancelamento autorizado | ✅ |
| 102 | Inutilização autorizada | ✅ |
| 103 | Lote recebido (assíncrono) | aguardar polling |
| 104 | Lote processado | ler protNFe |
| 105 | Lote em processamento | retentar (retryable) |
| 107 | Serviço em operação | ✅ |
| 108 | Serviço paralisado | aguardar (retryable) |
| 110 | Uso denegado | ❌ corrigir IE/inscrição |
| 135 | Evento registrado e vinculado | ✅ |
| 136 | Evento registrado, não vinculado | ⚠️ revisar |
| 215 | Falha de schema XML | ❌ corrigir leiaute |
| 539 | Duplicidade de NF-e | ❌ chNFe já existe |

---

## 7. Exemplo de fluxo completo (NFe modelo 55)

```typescript
// 1. Validar certificado (opcional, mas recomendado no setup da filial)
const certInfo = await fetch(`${BASE}/certificado/info`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Internal-Token': TOKEN },
  body: JSON.stringify({ pfxBase64, senha }),
}).then(r => r.json());

if (certInfo.isExpired || certInfo.daysUntilExpiry < 30) {
  throw new Error('Certificado expirado ou expira em <30 dias');
}

// 2. Conferir SEFAZ online
const status = await fetch(`${BASE}/consulta-nfe/status-servico`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Internal-Token': TOKEN },
  body: JSON.stringify({
    ambiente: 2, uf: 'SP', cnpj, certificado: { pfxBase64, senha },
  }),
}).then(r => r.json());

if (status.cStat !== '107') throw new Error('SEFAZ offline');

// 3. Emitir NFe
const resultado = await fetch(`${BASE}/autorizacao/enviar`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Internal-Token': TOKEN },
  body: JSON.stringify({
    ambiente: 2, uf: 'SP', cnpj,
    certificado: { pfxBase64, senha },
    enderecoEmpresa: { ... },
    nfe: { ide: {...}, emit: {...}, dest: {...}, det: [...], ... },
  }),
}).then(r => r.json());

if (resultado.cStat === '100') {
  // Persistir XML autorizado
  await db.nfe.create({ chave: resultado.protNFe.chNFe, xml: resultado.xmlAutorizado });

  // Gerar DANFE
  const pdfResponse = await fetch(`${BASE}/danfe/gerar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Token': TOKEN },
    body: JSON.stringify({ xml: resultado.xmlAutorizado }),
  });
  const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
  // ... salvar/enviar pdf ao cliente
}
```

## 8. Exemplo de fluxo completo (NFCe modelo 65)

Idêntico ao acima, mas:

1. **`csc` + `cscId`** obrigatórios no payload (fornecidos pela SEFAZ-UF
   quando a empresa habilita NFCe).
2. **`nfe.ide.mod = 65`** + `idDest=1`, `indFinal=1`, `indPres≥1`.
3. **`transp.modFrete = 9`** (sem frete).
4. **Sem `cobr.dup`** (NFCe é à vista).
5. **`tpImp = 4`** (portrait 80mm, para o DANFCe).
6. DANFCe (80mm cupom) é gerado automaticamente em `/danfe/gerar`.

---

## 9. Modo assíncrono

`POST /autorizacao/enviar` com `sincrono: false`:
- SEFAZ retorna recibo (`cStat=103`, `nRec=...`).
- O server faz **polling automático** de `NFeRetAutorizacao4` por até 10
  tentativas com backoff (3s, 5s, 7s, ...).
- Cliente recebe o resultado final só quando SEFAZ processa.

Use o modo síncrono (default) sempre que possível. O modo assíncrono é útil
em períodos de pico da SEFAZ ou quando o lote excede 1 NFe (esta lib emite
sempre lotes unitários, mas o protocolo permite agrupamento futuro).

---

## 10. Limites & cuidados

- **Timeout da SEFAZ**: 30s padrão. Configurável via `NFEClientConfig.timeout`
  (não exposto via HTTP — fixo no servidor).
- **Tamanho do PFX**: tipicamente <8KB. Em base64 fica <12KB. Não há limite
  específico, mas o JSON tem cap de 10MB pra o body inteiro.
- **Concorrência**: o servidor não tem lock por CNPJ. Se o ERP disparar 2
  emissões simultâneas com mesma `nNF`, ambas vão pro SEFAZ e a segunda
  retorna `cStat=539` (duplicidade). Coordene no cliente.
- **Retentativas**: trate `retryable: true` no body do erro 502. Espere 5-10s
  e tente novamente, máximo 3 tentativas. Erros não-retryable são definitivos.
- **Logs**: o servidor loga inicio de cada request com `reqId`. Para troubleshooting,
  envie `X-Request-Id` e compartilhe com o time que opera o servidor.

---

## 11. Variáveis de ambiente (servidor)

Para referência — não afetam o cliente, mas explicam comportamentos:

| Var | Default | Descrição |
|---|---|---|
| `HTTP_API_HOST` | `0.0.0.0` | Bind address |
| `HTTP_API_PORT` | `3002` | Porta |
| `INTERNAL_TOKEN` | (vazio) | Token de auth — **sem isto, qualquer um acessa** |
| `LOG_LEVEL` | `info` | `debug`/`info`/`warn`/`error` |
| `LOG_XML` | `false` | Loga XML SEFAZ sanitizado (sem CSC/cert) |
| `NFE_API_INSECURE_TLS` | `false` | **DEV ONLY** — desabilita verificação cadeia TLS SEFAZ |

---

## 12. Override de URLs SEFAZ NFCe (em runtime)

Se uma UF mudar o endpoint NFCe e o pacote ainda não tem a URL atualizada,
o **servidor** pode receber um patch sem deploy via env futura, ou o cliente
pode trabalhar com o repositório atualizado. Caso urgente, abra issue/PR no
repo `work-api-nfe`.

Para uso programático local (não exposto via HTTP):

```typescript
import { definirOverrideUrlSefaz, definirOverrideUrlQrCodeNFCe } from '@acbr-node/core';
definirOverrideUrlSefaz('SP', 'producao', 'NFCeAutorizacao4', 'https://novo.url/...', 65);
definirOverrideUrlQrCodeNFCe('SP', 'producao', { qrCode: '...', urlChave: '...' });
```

---

## 13. Versionamento

Versão atual: `0.1.0` (pre-1.0, breaking changes podem ocorrer). O `package.json`
de cada subpackage carrega a versão. Antes de 1.0:
- Renomeação de campos pode ocorrer (verificar CHANGELOG quando existir).
- URLs SEFAZ podem ser atualizadas em patches sem aviso.
- Suporte a NFCe deve estabilizar após primeiros testes em homologação real.

---

## 14. Reportar problemas

Para o time de manutenção do `work-api-nfe`:
- Inclua **`X-Request-Id`** da requisição falha
- Inclua **`cStat` + `xMotivo`** do erro retornado
- Inclua **UF + ambiente + modelo** (55/65)
- Não envie o `pfxBase64` nem `csc` em issues públicas
- Se for erro de URL SEFAZ, especifique se já testou via `definirOverrideUrlSefaz`
