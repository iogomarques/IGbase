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
