# Estado atual e próximos passos

Referência: 23/10/2026, código 1.10.05 / commit `99e09e9`. Histórico em [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md), instruções em [CLAUDE.md](CLAUDE.md).

## Concluído e confirmado

- [x] Base existente preservada e documentada; migração ao Claude preparada na mesma pasta.
- [x] Identificados Hub, Organization, Budget, Empresas, Suporte, recursos compartilhados, integrações e persistência.
- [x] Corrigidos na 1.10.05 os casos reproduzidos de condicionais lógicas, NaN/infinito e total inválido do faturamento.
- [x] Seis testes de regressão de faturamento disponíveis e passando na preparação.
- [x] Publicação anterior 1.10.05 confirmada pelo workflow Pages para `99e09e9`.

## Funcionalidades implementadas no código

Não confundir implementação com validação ponta a ponta em produção:

- [x] Organization: clientes/UCs, modelos GD1/GD2 e personalizados, vigências, revisão PDF/OCR, saldo, histórico e documentos/Pix.
- [x] Budget: necessidades/ofertas, revisão de importações, comparação/carrinhos, kits, versões na conta, backups e documentos.
- [x] Conta compartilhada e login e-mail/username, empresas emissoras e suporte por e-mail.

## Em desenvolvimento

- Nenhuma funcionalidade ou mudança visual está em execução nesta transferência.
- Os documentos de transferência ainda não foram commitados ou enviados ao GitHub. Já havia três documentos localmente modificados antes desta tarefa; suas informações foram preservadas.

## Bugs ainda não resolvidos e divergências observadas

Não há outro defeito funcional com reprodução/teste e correção pendente confirmado nesta tarefa. Isso não é uma garantia de ausência de bugs.

- [ ] Conferir texto de exclusão de empresa versus ausência de método/controle correspondente. Decidir com o usuário se é ajuste de texto ou funcionalidade desejada.
- [ ] Conferir promessa de contratos no Hub versus fluxos identificados de faturas/orçamentos.
- [ ] Conferir textos sobre recuperação de acesso: o fluxo completo de redefinição de senha não foi identificado. Não apresentá-lo como entregue sem validação.

## Melhorias planejadas pelo usuário

- [ ] Prioridade: ajustes no **faturamento**, a detalhar na próxima solicitação.
- [ ] Padronização visual (Hub manda no visual; estrutura do Organization como modelo):
  - [x] Etapa 1 (1.10.06): cores e letras do Hub no Organization e no CSS compartilhado.
  - [x] Etapa 2 (1.10.08): Budget no esqueleto do Organization; lateral com Cotações (padrão) ou Fornecedores.
  - [x] Etapa 3 (1.10.09): rodapé único, topo com logo no Hub/Suporte, Empresas com lista lateral.
- Sincronização adicional de rascunhos entre dispositivos não faz parte da demanda atual.

## Questões técnicas pendentes

- [ ] Esquema, RLS, RPCs, constraints e configurações Auth do Supabase não foram exportados/auditados. SQL local é parcial.
- [ ] Não há homologação separada confirmada; alinhar conta/dados/destino antes de testes autenticados.
- [ ] Fluxos reais de login, persistência, PDFs/Pix, OCR e dispositivos ainda precisam de teste ponta a ponta apropriado.
- [ ] Fonte/pasta exata do Pages no painel não foi lida; publicação por `main` foi observada.
- [ ] O texto de saúde dos sistemas no Hub é estático, não um monitoramento real.
- [ ] Revisar futuramente risco de gravação concorrente de coleções Organization; ausência de verificação otimista equivalente à do arquivo Budget foi observada, sem incidente reproduzido.
- [ ] Observar crescimento do arquivo JSON Budget/PDFs, limitado a 24 MB pelo cliente. Não migrar para Storage sem escopo novo.
- [ ] Histórico/conversas de outro bot e documentos externos não fornecidos não foram recuperados. Incorporar apenas se forem efetivamente disponibilizados.

## Levantamento do backup local (Claude, 23/10/2026)

Detalhes em [docs/BACKUP_LOCAL.md](docs/BACKUP_LOCAL.md).

- [x] Quatro SQLs locais lidos: DDL de `configuracoes_documento`, `perfis_usuario` e RPC `username_disponivel` agora documentados. Ainda falta `email_por_username` e a configuração Auth.
- [x] Pasta `publicacao\` local confirmada como 1.10.04 exata; o GitHub (1.10.05) é a fonte do código.
- [ ] Decidir com o usuário se as suítes Budget fictícias do backup devem ser trazidas para `tests/`.
- [ ] Revisar no futuro a exposição de e-mail pela RPC `email_por_username` (hipótese; não alterar sem pedido).
- [ ] Nunca versionar `CONTAS`, faturas extraídas ou nomes de clientes: o repositório é público.
- [ ] Commitar os documentos de transferência e `docs/BACKUP_LOCAL.md` quando o usuário autorizar.

## Testes de 23/10/2026 (1.10.06)

Relatório em [docs/TESTES_2026-10-23.md](docs/TESTES_2026-10-23.md). Organization, Budget, Empresas, Hub e Suporte aprovados.

- [x] Corrigido na 1.10.07: aviso "Modelos padrão atualizados" a cada login.
- [x] Regra de saldo explicada pelo usuário; comportamento mantido (ver PROJECT_CONTEXT).
- [x] Texto "contratos" removido do Hub na 1.10.07.

## Solar Distribution (1.10.10)

- [x] Primeira versão publicada: faturas, rateio sugerido, ajuste, cascata entre usinas, formulário PDF, histórico.
- [ ] Usuário testar com dados reais e trazer ajustes.
- [ ] Confirmar se a geração base deve continuar kWp × 115 ou passar a usar a geração real por padrão.

## Próxima sequência recomendada

1. Abrir a pasta existente no Claude e ler os documentos na ordem de [CLAUDE.md](CLAUDE.md).
2. Conferir `git status` e executar os seis testes; preservar os documentos locais sem commit.
3. Definir com o usuário a primeira mudança concreta de faturamento.
4. Se a mudança depender do banco, confirmar esquema e conta/destino; caso contrário, trabalhar na base disponível.
5. Validar o fluxo afetado e pedir autorização própria antes de qualquer push/deploy. Esta transferência não autoriza publicação.

## Verificação desta transferência

Executada em 23/10/2026, sem autenticação nem chamadas ao Supabase:

- Comparação SHA-256 com o início da tarefa: os 29 arquivos anteriores continuam presentes; somente o README foi complementado nesta preparação. Código, configuração, imagens, testes e os demais documentos anteriores permaneceram idênticos. HEAD e histórico Git preservados.
- Cinco arquivos novos: CLAUDE, PROJECT_CONTEXT, ARCHITECTURE, SETUP e TODO; nenhum pacote, cache ou dependência instalado.
- Seis testes de faturamento passaram; `git diff --check` sem erros.
- Sintaxe válida em 16 scripts, incluindo scripts inline, arquivos JS e o teste CJS.
- Servidor estático na porta documentada 8000: cinco páginas e 18 recursos locais distintos retornaram HTTP 200; servidor encerrado após a verificação.
- Trinta referências relativas de documentação conferidas. Os seis documentos de entrada usam caminhos portáveis e não copiam chaves/tokens.
- Essa verificação não executou JavaScript no navegador, testes visuais ou fluxos autenticados; não confirma o funcionamento integral das integrações.
- Nenhum commit, push, deploy, migração de banco ou mudança de versão nesta tarefa.
