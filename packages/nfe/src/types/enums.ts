/** Tipo de operação: 0=Entrada, 1=Saída */
export enum TipoOperacao {
  ENTRADA = 0,
  SAIDA = 1,
}

/** Finalidade da NFe */
export enum FinalidadeNFe {
  NORMAL = 1,
  COMPLEMENTAR = 2,
  AJUSTE = 3,
  DEVOLUCAO = 4,
}

/** Tipo de impressão do DANFE */
export enum TipoImpressao {
  SEM_DANFE = 0,
  RETRATO = 1,
  PAISAGEM = 2,
  SIMPLIFICADO = 3,
  NFCE = 4,
  NFCE_MSG_ELETRONICA = 5,
}

/** Tipo de emissão */
export enum TipoEmissao {
  NORMAL = 1,
  FS_IA = 2,
  SCAN = 3,
  EPEC = 4,
  FS_DA = 5,
  SVC_AN = 6,
  SVC_RS = 7,
  OFFLINE = 9,
}

/** Destino da operação */
export enum DestinoOperacao {
  INTERNA = 1,
  INTERESTADUAL = 2,
  EXTERIOR = 3,
}

/** Indicador de presença do comprador */
export enum IndicadorPresenca {
  NAO_SE_APLICA = 0,
  PRESENCIAL = 1,
  INTERNET = 2,
  TELEATENDIMENTO = 3,
  NFCE_ENTREGA_DOMICILIO = 4,
  PRESENCIAL_FORA_ESTABELECIMENTO = 5,
  OUTROS = 9,
}

/** Indicador de consumidor final */
export enum IndicadorConsumidorFinal {
  NORMAL = 0,
  CONSUMIDOR_FINAL = 1,
}

/** Processo de emissão */
export enum ProcessoEmissao {
  APLICATIVO_CONTRIBUINTE = 0,
  AVULSA_FISCO = 1,
  AVULSA_CONTRIBUINTE = 2,
  APLICATIVO_FISCO = 3,
}

/** Modalidade do frete */
export enum ModalidadeFrete {
  EMITENTE = 0,
  DESTINATARIO = 1,
  TERCEIROS = 2,
  PROPRIO_REMETENTE = 3,
  PROPRIO_DESTINATARIO = 4,
  SEM_FRETE = 9,
}

/** Modelo do documento fiscal */
export enum ModeloDocumento {
  NFE = 55,
  NFCE = 65,
}

/** Ambiente */
export enum Ambiente {
  PRODUCAO = 1,
  HOMOLOGACAO = 2,
}

/** CRT - Código de Regime Tributário */
export enum RegimeTributario {
  SIMPLES_NACIONAL = 1,
  SIMPLES_EXCESSO = 2,
  NORMAL = 3,
}

/** Indicador de IE do destinatário */
export enum IndicadorIEDestinatario {
  CONTRIBUINTE = 1,
  ISENTO = 2,
  NAO_CONTRIBUINTE = 9,
}

/** Forma de pagamento */
export enum FormaPagamento {
  DINHEIRO = '01',
  CHEQUE = '02',
  CARTAO_CREDITO = '03',
  CARTAO_DEBITO = '04',
  CREDITO_LOJA = '05',
  VALE_ALIMENTACAO = '10',
  VALE_REFEICAO = '11',
  VALE_PRESENTE = '12',
  VALE_COMBUSTIVEL = '13',
  BOLETO = '15',
  DEPOSITO = '16',
  PIX = '17',
  TRANSFERENCIA = '18',
  CASHBACK = '19',
  SEM_PAGAMENTO = '90',
  OUTROS = '99',
}

/** Indicador de pagamento */
export enum IndicadorPagamento {
  A_VISTA = 0,
  A_PRAZO = 1,
  OUTROS = 2,
}

/** Bandeira do cartão */
export enum BandeiraCartao {
  VISA = '01',
  MASTERCARD = '02',
  AMERICAN_EXPRESS = '03',
  SOROCRED = '04',
  DINERS = '05',
  ELO = '06',
  HIPERCARD = '07',
  AURA = '08',
  CABAL = '09',
  OUTROS = '99',
}

/** Origem da mercadoria */
export enum OrigemMercadoria {
  NACIONAL = 0,
  ESTRANGEIRA_IMPORTACAO_DIRETA = 1,
  ESTRANGEIRA_ADQUIRIDA_MERCADO_INTERNO = 2,
  NACIONAL_CONTEUDO_IMPORTACAO_SUPERIOR_40 = 3,
  NACIONAL_PROCESSOS_BASICOS = 4,
  NACIONAL_CONTEUDO_IMPORTACAO_INFERIOR_40 = 5,
  ESTRANGEIRA_IMPORTACAO_DIRETA_SEM_SIMILAR = 6,
  ESTRANGEIRA_MERCADO_INTERNO_SEM_SIMILAR = 7,
  NACIONAL_CONTEUDO_IMPORTACAO_SUPERIOR_70 = 8,
}

/** CST ICMS */
export enum CST_ICMS {
  TRIBUTADA_INTEGRALMENTE = '00',
  TRIBUTADA_COM_COBRANCA_POR_ST = '10',
  COM_REDUCAO_BASE_CALCULO = '20',
  ISENTA_OU_NAO_TRIBUTADA_COM_ST = '30',
  ISENTA = '40',
  NAO_TRIBUTADA = '41',
  SUSPENSAO = '50',
  DIFERIMENTO = '51',
  COBRADO_ANTERIORMENTE_POR_ST = '60',
  COM_REDUCAO_E_COBRANCA_ST = '70',
  OUTROS = '90',
}

/** CSOSN - Simples Nacional */
export enum CSOSN {
  TRIBUTADA_COM_CREDITO = '101',
  TRIBUTADA_SEM_CREDITO = '102',
  ISENCAO_PARA_FAIXA_RECEITA = '103',
  TRIBUTADA_COM_CREDITO_E_ST = '201',
  TRIBUTADA_SEM_CREDITO_COM_ST = '202',
  ISENCAO_COM_ST = '203',
  IMUNE = '300',
  NAO_TRIBUTADA = '400',
  COBRADO_ANTERIORMENTE_ST = '500',
  OUTROS = '900',
}

/** CST PIS/COFINS */
export enum CST_PIS_COFINS {
  OPERACAO_TRIBUTAVEL_ALIQUOTA = '01',
  OPERACAO_TRIBUTAVEL_QUANTIDADE = '02',
  OPERACAO_TRIBUTAVEL_ALIQUOTA_DIFERENCIADA = '03',
  OPERACAO_TRIBUTAVEL_MONOFASICA_REVENDA = '04',
  OPERACAO_TRIBUTAVEL_ST = '05',
  OPERACAO_TRIBUTAVEL_ALIQUOTA_ZERO = '06',
  ISENTA = '07',
  SEM_INCIDENCIA = '08',
  SUSPENSAO = '09',
  OUTRAS_OPERACOES = '49',
  CREDITO_ALIQUOTA = '50',
  CREDITO_QUANTIDADE = '51',
  CREDITO_ALIQUOTA_DIFERENCIADA = '52',
  CREDITO_ALIQUOTA_ZERO = '56',
  OUTRAS_OPERACOES_CREDITO = '99',
}

/** Tipo de evento */
export enum TipoEvento {
  CANCELAMENTO = '110111',
  CARTA_CORRECAO = '110110',
  EPEC = '110140',
  MANIFESTACAO_CIENCIA = '210210',
  MANIFESTACAO_CONFIRMACAO = '210200',
  MANIFESTACAO_DESCONHECIMENTO = '210220',
  MANIFESTACAO_NAO_REALIZADA = '210240',
}
