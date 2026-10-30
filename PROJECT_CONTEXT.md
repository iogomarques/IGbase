# Contexto e histórico para continuidade

Atualizado em 23/10/2026. Este documento resume a conversa efetivamente disponível e o histórico Git consultado. O levantamento técnico original permanece em [docs/CONTEXTO_IGBASE.md](docs/CONTEXTO_IGBASE.md); a arquitetura atual está em [ARCHITECTURE.md](ARCHITECTURE.md).

## Origem e finalidade confirmadas pelo usuário

O projeto era desenvolvido localmente no notebook antigo. Após trocar de notebook, o usuário conectou esta pasta a um ambiente em nuvem para continuar o trabalho. Pediu explicitamente uma **atualização e continuidade** da IG Base existente, sem substituição ou reconstrução. Confirmou que a versão 1.10.04 recebida era a última daquele notebook e que a publicação usa GitHub Pages.

Site: [igbase.com.br](https://igbase.com.br). Repositório: [iogomarques/IGbase](https://github.com/iogomarques/IGbase). A pasta conectada é a referência técnica disponível. Não há uma documentação anterior externa recuperada nesta conversa que deva ser presumida conhecida pelo próximo assistente.

## Preferências e decisões que continuam válidas

- Priorizar faturamento. Os ajustes visuais serão numerosos, mas ainda não foram definidos em detalhes.
- Manter rascunhos no navegador do dispositivo em uso. Não foi solicitado implementar sincronização adicional.
- Preservar o site, as funcionalidades, as integrações e os históricos existentes.
- Corrigir erros comprovados na base disponível sem exigir um novo projeto ou documentação externa para trabalho que não dependa dela.
- Respeitar instruções anteriores efetivamente disponíveis, registrar os alinhamentos nos arquivos e ser transparente sobre o que foi ou não testado.
- O usuário pediu a migração ao **Claude Code**. Nesta etapa autorizou apenas preparação/documentação na mesma pasta; proibiu mudanças funcionais, refatorações, push e deploy sem autorização.

## Alinhamentos no Claude (23/10/2026)

- Desenvolvimento passou do ChatGPT para o Claude. Código oficial: GitHub `main`. A pasta local `SITE\publicacao` (1.10.04) é só histórico; índice em `SITE\00 - COMECE AQUI (CLAUDE)`.
- Função confirmada pelo usuário: Hub é a base que dá acesso aos subsites; Organization lança PDF da fatura, lê e devolve a fatura de aluguel de energia (GD1/GD2, cálculo considerado correto); Budget lê lista geral e cotações de fornecedores, compara materiais e devolve carrinhos por fornecedor e análise geral. Mais subsites virão.
- Padrão visual: **o Hub manda** (verde sustentável, tipografia, títulos/subtítulos, configurações). **Estrutura de referência: Solar Organization** (lateral, topo com título e conta, abas, conteúdo, rodapé). Budget deve seguir a estrutura do Organization; todos conectados como subsites do Hub.
- Lateral do Budget (usuário, 23/10/2026): ter as duas listas, cotações e fornecedores, com cotações como padrão e o usuário escolhendo.
- Solar Distribution (usuário, 30/10/2026): rateio proporcional ao consumo total (consumo médio), ajuste manual, porcentagens inteiras fechando 100%, geradora 0% por padrão (com opção), várias usinas em cascata. A verdade são as faturas e a planilha de exemplo; o usuário avisa quando algo mudar. Venda do produto não é prioridade. Respostas do sócio (30/10/2026) confirmaram: kWp × 115; geração real opcional por APsystems/SolarEdge/outro; proporcional + ajuste; geradora 0%; inteiros; não compensado acima de 30/50/100 = sugerir ampliação.
- Pasta local reorganizada em 30/10/2026: `SITE\\00` a `04` por subsite, `90 - HISTÓRICO`, `99 - PODE APAGAR`.
- Conta de teste criada pelo usuário e logada no navegador do app do Claude; usar para conferir telas autenticadas.
- Publicação automática autorizada, com exceções: ver regra 7 do [CLAUDE.md](CLAUDE.md).
- Saldo (usuário, 23/10/2026): créditos às vezes já foram cobrados e às vezes não; o usuário informa consumo e sobra e a comparação deve ser automática. Comportamento atual mantido: cobra a diferença com aviso quando o uso excede o saldo, e a opção "saldo já cobrado" evita cobrança dupla.

## Histórico observável

Os itens abaixo resumem mensagens reais de commits, não garantias de validação completa de cada funcionalidade:

| Referência Git | Mudança registrada |
| --- | --- |
| `9bb654f` e commits relacionados, 10/10/2026 | Correções de caminhos: Hub na raiz e Organization no subdiretório |
| `c9e0dab`, `aec3cf5`, 10/10/2026 | Vigências de tarifas, conferência tributária e esclarecimentos para 2027 |
| `f48de09`, 11/10/2026 | Inclusão do Solar Budget |
| `a40dc4c`, `6431f9f`, 11/10/2026 | Empresas compartilhadas, comparação e proteção contra gravações concorrentes; estoque/mínimos |
| `aafe509`, `9c7f0df`, `58f8ec0`, 11/10/2026 | PDFs Budget limitados por arquivo e ampliação da leitura de listas/documentos |
| `141c916`, `6482498`, 12/10/2026 | Arquivo de cotações/PDFs na conta e organização de versões/navegação |
| `ed10200`, `1abe126`, `9ed37b6`, 12/10/2026 | Conta/username no Hub, login compartilhado e suporte por Gmail |
| `528e4c2`, `b7d5990`, `74d3e02`, 12–13/10/2026 | Versão comum, manutenção das interfaces/sessões e versão recebida 1.10.04 |
| `99e09e9`, 23/10/2026 | Versão 1.10.05: correções do motor de faturamento, testes e documentação inicial |
| 23/10/2026 (Claude) | Versão 1.10.06: etapa 1 da padronização visual — tokens do Hub em `shared/presentation.css`, Organization com verde e títulos Poppins do Hub, fonte Inter removida (textos na fonte do sistema). Sem mudança em cálculos, dados ou documentos |
| 23/10/2026 (Claude) | Versão 1.10.07: modelos padrão não são mais regravados a cada entrada (comparação independente da ordem das chaves do jsonb); aviso só quando há mudança real; texto "contratos" removido do Hub. Sem mudança em cálculos |
| 23/10/2026 (Claude) | Versão 1.10.08: etapa 2 da padronização — Budget no esqueleto do Organization (lateral, topo com título/subtítulo e conta, abas, rodapé). Lateral alterna entre **Cotações salvas (padrão)** e **Fornecedores da cotação aberta**; escolha lembrada no navegador. Sem mudança no motor, dados ou PDFs |
| 23/10/2026 (Claude) | Versão 1.10.09: etapa 3 — rodapé único (`.ig-footer`) nas cinco páginas, topo com logo (`.ig-brand`) no Hub e no Suporte, Empresas no esqueleto do Organization com lista lateral de empresas. Status estático removido do Organization (fica só no Hub) |
| 30/10/2026 (Claude) | Versão 1.10.10: novo subsite **Solar Distribution** (rateio dos créditos de energia entre usinas e unidades). Ver [docs/SOLAR_DISTRIBUTION.md](docs/SOLAR_DISTRIBUTION.md). Hub com terceiro cartão; rodapé com o novo link |
| 30/10/2026 (Claude) | Versão 1.10.11: Solar Distribution com escolha da fonte da geração (estimada kWp × 115, APsystems, SolarEdge, outro monitoramento ou energia injetada na fatura) e sugestão de ampliação quando o não compensado passa do mínimo da fase. Respostas do sócio do usuário |
| 30/10/2026 (Claude) | Versão 1.10.12: Solar Distribution desconta da geração o consumo da geradora acima do mínimo dela (como a planilha, "geração − consumo da geradora"); ampliação calculada com o fator de cada usina. Conferido contra as faturas e a planilha de exemplo: 7/35/20/18/20% (planilha 7,1/34,8/19,7/17,8/20,5% antes dos ajustes) |
| 30/10/2026 (Claude) | Versão 1.10.13: Solar Distribution com modo de distribuição homogênea ou prioritária (escolha do usuário) e potência da placa por usina, opcional |

Para conferir detalhes, use `git log --oneline` e `git show <commit>`. O histórico `.git` permanece na mesma pasta; não foi convertido em uma cópia nova.

## O que foi feito nesta conversa antes da transferência

1. Inventário dos 24 arquivos originais e mapeamento dos aplicativos, dados e integrações.
2. Criação de README, AGENTS e documentação em `docs/`, com perguntas respondidas pelo usuário.
3. Reprodução de erros no motor de fórmulas do Organization: `&&` e `||` avaliavam operações que deveriam ser ignoradas; NaN/infinito podiam ser aceitos; total ausente ou estouro após ajustes não era bloqueado.
4. Correção pontual desses casos e adição de seis testes em `tests/faturamento.test.cjs`, sem reformular as regras comerciais, o visual ou a arquitetura.
5. Atualização para 1.10.05 e publicação explicitamente autorizada. Build e deploy do Pages concluíram com sucesso para `99e09e9bb942d5fddc96426c5d579e9bdf8806f2`: [execução confirmada](https://github.com/iogomarques/IGbase/actions/runs/39969075959).
6. Atualizações locais da documentação com o resultado da publicação e reforço da continuidade das instruções. Essas três alterações documentais já existiam sem commit no início da preparação ao Claude.

## Confirmações, limites e hipóteses

**Confirmado:** estrutura estática, Supabase configurado no código, versão 1.10.05 no commit publicado, sucesso daquela execução do Pages e testes de regressão. Isso não comprova operação integral de todos os fluxos.

**Não verificado:** esquema completo/políticas/permissões efetivas do Supabase, template de e-mail atual, dados de contas reais, homologação separada, compatibilidade de todos os formatos PDF/OCR e todos os dispositivos, nem recuperação de rascunhos do notebook antigo. Não foi executado teste ponta a ponta autenticado.

**Publicação:** `main` foi atualizada e disparou o workflow `pages build and deployment`. A configuração exata de fonte/pasta no painel Settings > Pages não foi lida. O domínio público foi bloqueado pelo proxy do ambiente Codex; esse bloqueio não demonstrou falha do site.

**Hipótese a não transformar em fato:** diferenças entre textos de interface e funcionalidades podem ser pendências de produto. O Hub menciona contratos e as configurações mencionam exclusão de empresa; os controles correspondentes não foram encontrados na base analisada. Confira com o usuário antes de implementar algo novo. Veja [TODO.md](TODO.md).

## Entrega ao Claude

Não há funcionalidade nova em desenvolvimento nesta transferência. A próxima tarefa deve partir da prioridade de faturamento e de uma solicitação concreta do usuário. O ponto de entrada é [CLAUDE.md](CLAUDE.md), sem depender desta conversa para entender os cuidados essenciais.
