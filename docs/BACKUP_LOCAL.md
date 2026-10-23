# Backup local do notebook antigo — levantamento complementar

Levantamento feito em 23/10/2026 pelo Claude, somente leitura, na pasta do computador do usuário `IOGO\` (OneDrive). Nada foi alterado nessa pasta. Complementa [CONTEXTO_IGBASE.md](CONTEXTO_IGBASE.md), [ARCHITECTURE.md](../ARCHITECTURE.md) e [SETUP.md](../SETUP.md).

> **Repositório público.** O GitHub `iogomarques/IGbase` é público. Nada da pasta `CONTAS`, de `verificacao/` com dados extraídos de faturas, nem nomes de clientes pode ser copiado para este repositório. Este documento cita esses materiais apenas de forma agregada.

## Estrutura encontrada

| Pasta em `IOGO\` | Conteúdo | Observação |
| --- | --- | --- |
| `SITE\publicacao\` | Código do site | Exatamente a **1.10.04** (commit `74d3e02`). Diferenças em relação ao GitHub são só as da 1.10.05: versão/cache/novidades no Hub e 34 linhas no Organization. Não é a fonte atual do código. |
| `SITE\banco-de-dados\` | Quatro SQLs de referência | Detalhados abaixo. |
| `SITE\ferramentas\` | `continuidade.py`, `gerar-backup.py`, `testar-portatil.cjs` | Feitos para o layout `SITE\publicacao\`, não para este repositório. |
| `SITE\verificacao\` | Testes e evidências de cada versão (até 1.10.04) | Bem mais amplos que `tests/` deste repositório. Alguns contêm dados reais. |
| `SITE\Relatórios de Atualização\` | 30 relatórios (1.06.1 a 1.10.04) e 2 de organização/continuidade | Histórico das regras de negócio por versão. |
| `SITE\AGENTS.md` (59 KB), `LEIA-ME.md`, `00-COMECE-AQUI.md`, `documentacao\CONTINUIDADE\` | Orientações e log detalhado por versão | Mais detalhados que o `AGENTS.md` deste repositório. Usam a versão 1.10.04 como referência. |
| `SITE\backups\`, `temporarios\`, `arquivos-gerados\` | Backups de cada atualização, temporários, PDFs gerados | Histórico; não restaurar sem pedido. |
| `CONTAS\` | Faturas reais da concessionária de clientes | Ver seção própria. Fora de `SITE`. |
| `ORÇAMENTO DE ALUGUEL\` | Uma planilha geral de aluguel de usinas e um modelo `.docx` | Não analisados em detalhe. |
| `FINANÇAS\` | Não inspecionada | — |

A listagem recursiva de `SITE` passou de 2.000 itens; `backups\` e `verificacao\` não foram percorridos integralmente.

## SQLs (`SITE\banco-de-dados\`)

| Arquivo | O que define | Preenche lacuna? |
| --- | --- | --- |
| `setup-supabase.sql` | `perfis_faturamento`, `clientes`, `orcamentos` + RLS | Idêntico ao `setup-supabase[1].sql` do repositório. |
| `adicionar-tabela-documento.sql` | `configuracoes_documento (user_id PK, data jsonb, updated_at)` + RLS select/insert/update/delete pelo próprio usuário | **Sim** — DDL antes ausente. |
| `supabase-perfis-usuario.sql` | `perfis_usuario (user_id, username, email, created_at)`, índice único em `lower(username)`, RLS select/insert/update (sem delete), RPC `username_disponivel(p_username)` `security definer`, executável por `anon` e `authenticated` | **Sim** — DDL e RPC antes ausentes. |
| `solar-budget.sql` | `solar_budget_cotacoes` + RLS + índice | Marcado no próprio arquivo como "proposta, NÃO executada automaticamente". O Budget atual grava em `configuracoes_documento.data.solarBudgetArquivo`; essa tabela é só leitura legada, se existir. |

Continua faltando:

- Definição da RPC `email_por_username`. Os registros antigos (AGENTS.md local, 1.09.11) dizem que ela existe em produção e foi testada por consulta pública somente leitura, mas o código SQL não está em nenhum arquivo.
- Template de e-mail/OTP, redirects e demais configurações de Auth.
- Confirmação de que esses SQLs são o que realmente está instalado (o banco nunca foi exportado).

Ponto para revisar no futuro (hipótese, não incidente): uma RPC pública que devolve o e-mail de um username permite descobrir e-mails de contas a partir do nome. Avaliar com o usuário antes de qualquer mudança; envolve banco e login.

Nenhum SQL foi executado.

## Testes do backup (`SITE\verificacao\`)

O repositório tem apenas `tests/faturamento.test.cjs` (6 testes do motor de fórmulas). O backup tem, segundo `MAPA-DE-TESTES.md`:

- Suíte portátil Budget (`node ferramentas/testar-portatil.cjs`): motor (49), simulações (350 cotações, 15.866 verificações), importação (33 modelos), biblioteca (23), arquivo da conta (16). Dados fictícios.
- Entrega 1.10.04 (`verificacao\atualizacao-1.10.04\`): testes de navegador (interface, login com API fictícia, biblioteca, suporte) que dependem de Playwright/Chrome; `gd2.cjs` (144 meses simulados, 72 pares manual/PDF); `regressao-leitura.cjs` (26 verificações do leitor Equatorial); `faturas-validacao.cjs` (64 verificações sobre seis faturas reais).
- `faturas-fontes-privadas.json`, `fatura-*.txt`, `faturas-extraidas.json` e imagens de faturas originais contêm **dados reais de clientes**.

Esses testes foram feitos para a 1.10.04 e para os caminhos do notebook antigo; alguns usam caminhos absolutos. Não foram executados neste levantamento. Trazer as suítes Budget (fictícias) para `tests/` é uma possibilidade, só com pedido do usuário.

## Faturas (`IOGO\CONTAS\`)

- Sete pastas de clientes/unidades, cerca de 130 arquivos, de 07/2024 a **09/2026**. Não há fatura de 10/2026.
- Tipos: PDFs da concessionária (Equatorial), resumos em PNG/PDF gerados pelo usuário, planilhas `.xls` de geração (2026-07 a 2026-09), uma planilha e PDF de rateio.
- Há também um documento pessoal de identificação de um cliente.
- Úteis para validar leitura de faturas e cálculos do faturamento **localmente**, nunca para commit ou para gravação em conta real sem combinar.

## Consequências para o trabalho

1. Fonte do código: GitHub/`main` na 1.10.05. A pasta `publicacao\` local está uma versão atrás.
2. Ao mudar o banco ou o login, partir dos quatro SQLs locais + consulta somente leitura ao Supabase, se o usuário autorizar.
3. Para mudanças no faturamento, os relatórios 1.07–1.09.1 e o `AGENTS.md` local registram as regras de saldo, créditos, GD2, excedente e tarifas por vigência.
4. Os documentos de transferência (`CLAUDE.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `SETUP.md`, `TODO.md`) e este arquivo ainda não estão commitados.
