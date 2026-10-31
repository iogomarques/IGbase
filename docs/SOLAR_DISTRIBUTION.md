# Solar Distribution — rateio dos créditos de energia

Subsite `/solar-distribution/`, publicado na versão 1.10.10 (30/10/2026). Organiza quanto da energia de cada usina geradora vai para cada unidade consumidora (UC). Em cada usina o rateio fecha 100%.

## Regras definidas pelo usuário

- **Fonte da verdade:** as faturas e a planilha de exemplo do usuário (dados reais ficam só no computador, nunca no repositório).
- **Geração base:** potência (kWp) × fator 115 kWh/kWp/mês, como na planilha (padrão). Opcional, escolhido por usina em "Fonte da geração": geração real do monitoramento (APsystems, SolarEdge ou outro), informada à mão, ou a energia injetada lida na fatura da geradora (`injecaoFatura`, guardada à parte). Dados antigos com `usarGeracaoReal` continuam valendo como "outro monitoramento". Confirmado pelo sócio do usuário em 30/10/2026.
- **Geração para rateio** (planilha, "GERAÇÃO PARA RATEIO" = geração − consumo da geradora): da geração sai o consumo do mês da própria geradora que passar do mínimo dela (30/50/100). Abaixo do mínimo a concessionária cobra o mínimo e não usa crédito (Lei 14.300/2022, art. 16 §1º; excedente = injetada − consumida, art. 1º). Ex.: geradora de exemplo consumiu 64 kWh, mínimo trifásico 100 → nada é descontado (planilha tem 0). O fator (115) é editável por usina: 95, 120, 130 etc., e a sugestão de ampliação usa o fator da usina (a do sistema usa a média dos fatores).
- **Método:** proporcional ao **consumo médio (consumo total)** de cada unidade, mais o ajuste manual em pontos percentuais.
- **Porcentagens inteiras**, fechando 100% pelo método dos maiores restos.
- **Geradora:** opção de reservar uma parte para a própria geradora; padrão 0%.
- **Várias usinas:** uma unidade pode receber de várias. As usinas atendem na ordem da lateral. Cada usina atende primeiro as unidades que só podem receber dela; a energia que sobra vai para as que também recebem de usinas seguintes, e o que faltar passa para a próxima usina. Se sobrar energia, ela é dividida na mesma proporção, para fechar 100%.
- **Mínimo não compensado:** 30 kWh (monofásico), 50 (bifásico), 100 (trifásico), lido do "Tipo de fornecimento" e editável. Na fatura, "CONSUMO NÃO COMPENSADO" acima do mínimo significa que a geração não cobriu o consumo, e o site avisa. Nesse caso aparece a **sugestão de ampliação**: kWh acima do mínimo ÷ 115 = kWp a ampliar, convertido em placas de 620 W, ou aumentar a porcentagem da unidade (confirmado pelo sócio em 30/10/2026: não compensado acima de 30/50/100 = geração menor que o consumo).

## O que as faturas da Equatorial trazem (confirmado nos exemplos)

- `RAMAL: 0% <UC>`, `Tipo de fornecimento`, linha de datas (leitura anterior, atual, dias, próxima), titular e CPF/CNPJ.
- `INFORMAÇÕES DO SCEE`: geração do ciclo da geradora, excedente recebido (= geração do ciclo × % da unidade), crédito recebido, saldo, saldo a expirar.
- `CADASTRO RATEIO GERAÇÃO: UC <geradora> = N%`: rateio vigente. O site usa esse campo para ligar a unidade à usina e mostrar o "rateio atual".
- Histórico de 13 meses com LIDA/MÉDIA. A média desses valores é a média impressa na fatura e vira o consumo médio. Na geradora o histórico mistura geração e consumo; usa-se `ENERGIA GERAÇÃO` (medida) e o consumo do mês.
- Unidade lida antes ou no mesmo dia da geradora recebe o crédito do ciclo anterior. O site avisa comparando os dias de leitura.

## Regras de distribuidora consideradas (fontes públicas)

Percentuais somando 100% (o titular pode reservar parte para a geradora); no autoconsumo remoto, todas as UCs com o mesmo CPF/CNPJ da geradora; alteração vale a partir do ciclo seguinte ao pedido (pedir com cerca de 30 dias de antecedência); créditos válidos por 60 meses. Fontes: cartilha de faturamento GD da Cemig e formulário de compensação da Energisa (mesma regulação ANEEL).

## Estrutura

| Arquivo | Função |
| --- | --- |
| `solar-distribution/engine.js` (`SolarDistribution`) | Leitura da fatura (`parseInvoice`), modelo, `sugerir` (cascata entre usinas), `calcular` (ajustes, projeção, alertas), `inteiros`. Exporta CommonJS |
| `solar-distribution/store.js` (`IGDistributionStore`) | Grava em `configuracoes_documento.data.solarDistribution` (versão 1), relendo a linha e conferindo `updated_at`; preserva empresas, Budget e demais áreas |
| `solar-distribution/app.js` | Tela: lateral Usinas/Unidades, abas Rateio, Lançar faturas, Usinas, Unidades e Histórico; leitura de PDF com pdf.js; formulário de rateio em PDF com jsPDF |
| `solar-distribution/index.html`, `styles.css` | Página no esqueleto do Budget/Organization (usa `/solar-budget/styles.css` e `/shared/presentation.css`) |
| `tests/distribuicao.test.cjs` | 11 testes com dados fictícios |

Rascunho não salvo fica no navegador (`igbase:solar-distribution:v1:<userId>`) até "Salvar na conta". Rateios salvos no histórico são cópias fixas: não mudam quando o cadastro muda.

## Validação desta versão

- Suíte Node: 11 testes do Solar Distribution e 7 de faturamento.
- Teste completo no navegador com Supabase simulado e as 6 faturas reais de exemplo (localmente): leitura de todas, ligação automática à usina pelo rateio cadastrado, rateio 22/21/38/19% para 4 unidades com 33,3 kWp, ajuste bloqueando 103% e liberando 100%, formulário PDF, histórico após recarregar, celular sem rolagem lateral.
- Pendente: teste com a conta de teste no site publicado; confirmar com o usuário os pontos em aberto da primeira versão.

## Modos de distribuição e placa (usuário, 30/10/2026)

- **Homogênea** (padrão, como a planilha): toda a energia na proporção do consumo médio.
- **Prioritária**: unidades marcadas como prioritárias (coluna "Prioritária" no rateio ou caixa na ficha da unidade) recebem primeiro o suficiente para todo o consumo; o resto é dividido proporcionalmente entre as demais. Se nem as prioritárias couberem, elas dividem a energia entre si. O modo fica salvo junto com cada rateio do histórico.
- **Potência da placa**: depende do projeto, então é um campo por usina, 620 W por padrão (planilha). Vazio = a sugestão de ampliação mostra só os kWp. Na falta total do sistema, as placas só aparecem se todas as usinas usam a mesma placa.
- Ao lançar faturas com uma única usina cadastrada, unidades sem vínculo pelo rateio cadastrado (ex.: unidade nova, ainda com 0%) são ligadas a ela automaticamente.

## Teste oficial no site publicado (30/10/2026, 1.10.13, conta de teste)

Usuário selecionou os 6 PDFs reais de exemplo no navegador do app; todos lidos. Aplicadas as faturas, 33,3 kWp × 115 = 3.829 kWh. Rateio homogêneo: 7 / 20 / 35 / 20 / 18% (100%); consumo 4.266 kWh, falta 437 kWh (~3,8 kWp, 7 placas de 620 W). Modo prioritário com uma unidade marcada: 7% → 8%, total 100%. Formulário PDF gerado (download no computador do usuário; conteúdo não aberto por Claude). Rateio salvo na conta, página recarregada: usina, 5 unidades e histórico voltaram. Console sem erros.

## Estrutura igual aos outros subsites (1.10.14)

- Lateral como no Solar Organization: busca, filtros (unidades: tipo de ligação, situação — não compensado acima do mínimo, sem usina, prioritárias), ordenação e "Limpar filtros". Filtros só mudam a lista exibida; a ordem do rateio continua a ordem das usinas.
- Clique no item da lateral leva ao rateio (usina ou linha da unidade, destacada); o lápis abre a ficha para editar, como "Editar cliente" no Organization. Unidade com não compensado acima do mínimo tem o ponto em laranja.
- Etapas no topo de "Lançar faturas": 1 Faturas · 2 Conferência · 3 Rateio · 4 Formulário (como "Lançamento do mês").
- Tela de carregamento comum (`.ig-startup` em `shared/presentation.css`) igual à do Organization, usada no Distribution, Budget e Empresas.

## Caso Silas, média de 3 meses e consumo da geradora (31/10/2026, 1.10.16)

Exemplos em `IG SOLAR\ARQUIVOS IG\RATEIO SILAS` (pastas GERADORA 01 e 02 = fonte; planilhas de fora = em análise, não 100%).

- Plano do usuário: geradora 1 (loja, UC 3.187.902.012-59) atende apartamento, chácara e casa do pai; geradora 2 (casa, UC 2.965.543.012-72) dá 100% à casa do pai. Produção média informada: geradora 1 = 1.200 kWh, geradora 2 = 890 kWh.
- **Regra do IG Base**: geração = média dos últimos 3 meses (90 dias), ou dos meses que a usina tiver. Campo "Geração dos últimos 3 meses" na usina; sem meses, usa kWp × fator.
- **Consumo da geradora** (planilha v7: consumo na geração = produção − injeção + consumo da rede): geração para rateio = produção − (produção − injetada) − consumo da rede acima do mínimo. A fatura da geradora traz o histórico mês a mês (consumo da rede e injeção alternados; as duas primeiras linhas são as médias impressas); o site guarda os últimos 3 meses. Conferido com setembro: loja injetou 639, consumiu 400 (mín. 30) → 269 de excedente, igual ao "GERAÇÃO CICLO" nas faturas das unidades. Com a média de 3 meses: loja 319 kWh, casa 236 kWh para o rateio. Sem esse desconto, 1.200/890 dariam sobra de ~533 kWh, o contrário das faturas.
- **Leitura**: UC ao lado do CEP, "CADASTRO / RATEIO GERAÇÃO" quebrado em duas linhas e SCEE com duas geradoras agora são lidos; a unidade é ligada a todas as geradoras que aparecem. As ligações seguem o cadastro atual da Equatorial: confira e ajuste para o plano novo.
- **Várias usinas**: o cálculo começa pela usina que atende menos unidades (a geradora 2, só a casa do pai, entrega 100%) e a outra cobre o que falta proporcionalmente.
- Resultado no navegador simulado (plano das pastas): geradora 2 → casa do pai 100%; geradora 1 → apartamento 46%, casa do pai 31%, chácara 23%; falta ~256 kWh/mês.

## Respostas do Ivoney (sócio, 31/10/2026) e versão 1.10.20

- A geradora envia o **excedente** às beneficiadas; as porcentagens seguem o **consumo médio de cada fatura** incluída no rateio (já era assim; confirma a base "consumo total", sem tirar o mínimo).
- **Geração**: vem das unidades geradoras — é informada a geração esperada de cada UFV. O campo virou "Geração esperada da UFV (kWh/mês)", até 3 meses com média.
- **Formulário**: é a etapa final, onde se imprime ou gera o arquivo para a distribuidora. Agora segue o modelo da aba RATEIO da planilha (cabeçalho Equatorial, identificação da UC com classe, endereço, bairro, CEP, cidade, e-mail, telefone e celular; inclusão/alteração/exclusão; compensação normal/consórcio; lista UC · CNPJ/CPF · %; IMPORTANTE; assinatura) e abre na própria página, numa prévia desenhada com o mesmo leitor de PDF das faturas (funciona em qualquer navegador e no celular), com "Baixar PDF" e "Abrir em outra aba" (1.10.21: o navegador do app bloqueava a nova aba). Classe, endereço, bairro, CEP e cidade vêm da fatura da geradora; e-mail e telefones são informados na usina. CEP da Equatorial corrigido para 74805-180 (a planilha tem "704805-18"); a citação da REN 482/2012 foi mantida como no modelo.
- **Saldo**: meses de saldo = saldo ÷ consumo médio; a tabela mostra "saldo dura ~N meses · novo rateio em mês/ano".
- Ainda em aberto: mínimo da geradora e período (3 ou 13 meses) para injeção/consumo da geradora; saldo não reduz a porcentagem sozinho.

## Respostas finais do Ivoney (31/10/2026, versão 1.10.23)

- **Mínimo da geradora não é considerado:** o consumo da rede da geradora sai inteiro da geração (como a planilha v7). O campo "Mínimo da geradora" saiu da tela. Os mínimos 30/50/100 continuam valendo para as **unidades** (alerta de não compensado e sugestão de ampliação).
- **Média de 3 meses:** a geração considerada é a média dos últimos 3 meses; se a usina tiver menos, a média dos meses que existirem. Vale para a geração esperada informada e para a injeção e o consumo da rede lidos do histórico da fatura da geradora.
- Caso Silas com a regra final: geradora 1 = 1.200 − 566 (consumida na hora) − 346 (rede) = 289 kWh; geradora 2 = 890 − 223 − 531 = 136 kWh. Rateio: geradora 2 → casa do pai 100%; geradora 1 → apartamento 39%, casa do pai 42%, chácara 19%. Faltam ~386 kWh/mês.

## Correção do entendimento sobre o mínimo (31/10/2026, versão 1.10.24)

O usuário explicou que "o mínimo não é considerado" quer dizer: **o mínimo nunca é compensado**, então ninguém recebe crédito para ele. Exemplo dele: mínimo 100 e consumo 200 → só 100 precisam ser enviados à unidade. A 1.10.23 tinha entendido o contrário para a geradora; foi corrigido.

- **Unidades:** a base do rateio é o que cada unidade precisa compensar = consumo médio − mínimo (30/50/100). Coluna "A compensar" na tabela; o resumo mostra "A compensar (sem o mínimo)" e a falta do sistema usa essa soma.
- **Geradora:** desconta o consumo da rede acima do mínimo dela (como as faturas mostram: loja consumiu 400 e usou 370 de crédito). Campo "Mínimo da geradora" de volta.
- **Média de 3 meses:** mantida (geração esperada e histórico da fatura da geradora; com menos meses, a média dos que existirem).
- **Saldo (1.10.25, usuário):** meses de saldo = saldo ÷ (consumo médio − mínimo), a parte que realmente usa crédito. Chácara do Silas: 1.283 ÷ 99 ≈ 13 meses.
- Silas: a compensar 234 (apartamento) + 386 (casa do pai) + 99 (chácara) = 720 kWh; sobra geradora 1 = 319, geradora 2 = 236. Rateio: geradora 2 → casa do pai 100%; geradora 1 → apartamento 48%, casa do pai 31%, chácara 21%. Faltam ~166 kWh/mês.
