# XSDs oficiais NFe 4.00

Schemas XSD oficiais da Receita Federal para validar XML de NFe / NFCe / eventos /
inutilização **localmente** — antes de mandar pra SEFAZ.

Origem: `sped-nfe` (nfephp-org) snapshot `PL_009_V4`. Os arquivos sao
identicos aos publicados no Portal Nacional da NFe.

## Por que tao commitados aqui

A SEFAZ retorna `cStat=225 "Rejeição: Falha no Schema XML do lote de NFe"`
quando o XML quebra o XSD. A mensagem nao diz **o que** quebrou — vc fica
adivinhando entre 50+ possiveis violacoes.

Validando localmente contra o XSD oficial vc recebe o erro especifico
(`Element 'X' attribute 'Y': value 'Z' does not match...`). Foi assim que
descobrimos em 2026-05-19 que estavamos assinando com SHA-256 quando o
schema fixa SHA-1 (incidente de 7 emissoes rejeitadas antes do diagnostico).

## Como usar

### Opcao 1 — `xmllint` (CLI, recomendado se ja tem)

```bash
xmllint --noout --schema packages/nfe/xsd/nfe_v4.00.xsd nota-assinada.xml
```

Em Windows, instale via `choco install xsltproc` ou WSL. No Linux/Mac ja
vem com `libxml2-utils`.

### Opcao 2 — `libxmljs2` (Node, integrado em script)

```bash
npm install --no-save libxmljs2
```

```mjs
import { parseXml } from 'libxmljs2';
import fs from 'node:fs';

const xml = fs.readFileSync('nota.xml', 'utf-8');
const xsd = fs.readFileSync('packages/nfe/xsd/nfe_v4.00.xsd', 'utf-8');

const xmlDoc = parseXml(xml);
const xsdDoc = parseXml(xsd, { baseUrl: 'packages/nfe/xsd/' });

if (!xmlDoc.validate(xsdDoc)) {
  for (const e of xmlDoc.validationErrors) {
    console.error('- ', e.message.trim());
  }
  process.exit(1);
}
console.log('XML valido');
```

`libxmljs2` e nativo (requer build tools C++). Por isso nao e dependencia
runtime do api-nfe — fica opcional pra quem quer validar local.

## Arquivos

| XSD | Pra que serve |
|---|---|
| `nfe_v4.00.xsd` | NFe (modelo 55) **assinada** — schema completo com Signature |
| `leiauteNFe_v4.00.xsd` | Layout da NFe sem signature (sub-schema de `nfe_v4.00.xsd`) |
| `enviNFe_v4.00.xsd` | Envelope de envio do lote pra autorizacao |
| `retEnviNFe_v4.00.xsd` | Retorno sincrono do envio |
| `consReciNFe_v4.00.xsd` / `retConsReciNFe_v4.00.xsd` | Consulta de recibo (modo assincrono) |
| `consSitNFe_v4.00.xsd` / `retConsSitNFe_v4.00.xsd` | Consulta de situacao da NFe |
| `consStatServ_v4.00.xsd` / `retConsStatServ_v4.00.xsd` | Status do servico SEFAZ |
| `inutNFe_v4.00.xsd` / `retInutNFe_v4.00.xsd` | Inutilizacao de faixa de numeracao |
| `procNFe_v4.00.xsd` | NFe + protocolo (XML final autorizado) |
| `procInutNFe_v4.00.xsd` | Inutilizacao + protocolo |
| `tiposBasico_v4.00.xsd` | Tipos compartilhados (decimal, UF, datetime, etc) |
| `xmldsig-core-schema_v1.01.xsd` | XML Digital Signature W3C |

## Atualizar

Quando a Receita publicar nova versao (NT XXXX), baixar de:
- https://www.nfe.fazenda.gov.br/portal/ (oficial)
- ou https://github.com/nfephp-org/sped-nfe/tree/master/schemes (mirror)

E substituir os arquivos aqui. Bumpar versao da nota (4.00 → 4.10?) tambem
exige atualizar referencias no codigo (`@acbr-node/nfe/src/types/nfe.ts`).
