# Solar Replacement — base do subsite

Pedido do usuário em 20/11/2026: começar um subsite de acompanhamento de garantias a partir de uma ideia do sócio
(texto "Pacote MVP" + parte de RMA, fora do repositório). A ideia foi escrita como sistema novo (Next.js, banco próprio,
Storage, API de OCR); aqui ela foi adaptada à estrutura do IG Base. Nome definido pelo usuário em 20/11/2026: **Solar Replacement**
(troca solar). Além dos chamados de garantia, o subsite cobre rastreabilidade dos seriais por usina, estoque de backup,
logística reversa/depósito, conferência pelo monitoramento, ressarcimento e documentos.

## Onde está

- Pasta `solar-replacement/` (`index.html`, `engine.js`, `store.js`, `app.js`, `styles.css`), no modelo do Solar Distribution.
- Publicada em `/solar-replacement/`. Desde a 1.10.50 (22/11/2026) aparece no Hub (cartão "Em teste") e no menu Sistemas, a pedido do usuário, para os testes. A página segue com `meta robots noindex` até o lançamento oficial.
- Dados na linha da conta (`configuracoes_documento`), área própria `solarReplacement`. A gravação relê a linha e preserva
  as demais áreas (empresas, Budget, Distribution etc.), como no `solar-distribution/store.js`. Grava sozinho ~1 s após cada mudança.
- Testes: `tests/replacement.test.cjs`.

## O que a base faz

- **Usinas**: ID no monitoramento (âncora, ex.: IOGO/EMA), nome, cliente, marca, kWp, fator de geração (kWh/kWp/dia) e tarifa (R$/kWh).
- **Modelos** (Ajustes): marca, modelo, tipo, potência (kW) e número de entradas. Começa com DS3-D (2,0 kW, 2 entradas) e QS1-A (1,5 kW, 4 entradas).
- **Chamado**: usina, serial com defeito (12–15 dígitos), modelo, potência afetada (equipamento inteiro, 1 entrada ou outra),
  checklist 01–04 com a legenda da ideia, perda de geração confirmada, nº do caso no fabricante, link do vídeo, backup,
  depósito (destino garantia ou sucata) e troca final.
- **Etapas** pelo que já aconteceu: 1 visita e testes → 2 aguardando o fabricante (nº do caso) → 3 backup instalado (opcional)
  → 4 peça no depósito → 5 troca concluída.
- **Estoque de backup**: instalar backup marca "em uso" na usina; a troca final devolve o backup ao estoque, ativa o serial novo
  na usina e marca o defeituoso como em garantia (ou sucata).
- **Ressarcimento**: perda/dia = potência afetada × fator; dias parados = abertura → instalação do backup (padrão; sem backup, até a troca final;
  a opção "até a troca final" fica em Ajustes); dias indenizáveis = dias parados − carência (30 dias por padrão); valor = dias × perda/dia × tarifa, arredondado
  em centavos. Exemplo da ideia: 2,0 kW, fator 4,83, R$ 1,25, 45 dias indenizáveis = R$ 543,38 (0,5 kW = R$ 135,84).

## Próximas partes (ordem sugerida no plano)

1. Dossiê PDF para o fabricante (testes e fotos reduzidas; sem vídeo) e etiquetas térmica 100×50 mm e A4.
2. Leitura do serial pela câmera e conferência de prints do monitoramento por OCR no navegador (`situacaoSerial` já classifica
   ativo / em garantia / substituído / backup de outra usina).
3. Relatório por usina e período; preparação para outras integradoras.

## Decisões

Definidas em 20/11/2026: perda contada até a instalação do backup; carência de 30 dias para todos (pode mudar depois);
um login para a empresa toda no início.

Nome: Solar Replacement (20/11/2026).

Evidências por fotos, sem vídeo (20/11/2026: vídeo ocupa muito espaço e bagunça o lançamento). O campo "link do vídeo" da base sai quando as fotos entrarem.

Fotos: armazenamento do Supabase, pasta privada `solar-replacement` (autorizado em 20/11/2026). Cada conta só acessa a própria pasta (id do usuário); só imagens de até 2 MB; o site reduz cada foto para cerca de 100 a 300 KB e aceita até 20 por chamado. Script único: `docs/solar-replacement-fotos.sql` (rodar no SQL Editor do Supabase; o conector automático não conseguiu entrar no banco). O dossiê em PDF leva as fotos e é a cópia definitiva.

Espaço criado em 21/11/2026 pelo SQL Editor (projeto IG Base), com o usuário logado no painel. O SQL Editor avisa "operação destrutiva" por causa dos `drop policy if exists`: eles só apagam as quatro regras do próprio Solar Replacement, então pode confirmar. Testado na conta real: envio e leitura funcionam; pasta de outra conta, acesso sem login e arquivo que não é imagem são recusados.

Em aberto: impressora e tamanho da etiqueta.
