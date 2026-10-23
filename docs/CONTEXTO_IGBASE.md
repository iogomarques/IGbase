# Contexto e levantamento inicial da IG Base

Data: 23/10/2026. Base: commit `74d3e02`, versão pública declarada `1.10.04` (`releaseId` `1.10.04-2026-10-13`).

## Objetivo confirmado pelo usuário

Dar continuidade ao projeto IGBase existente, com atualizações no mesmo site, passando do trabalho no notebook antigo para o ambiente em nuvem. O primeiro pedido é entender a base, registrar o site como referência nos arquivos e devolver dúvidas. Não foi solicitada uma funcionalidade nova nesta etapa.

## Identidade e referências verificadas nos arquivos

| Referência | Evidência |
| --- | --- |
| Domínio `igbase.com.br` | `CNAME` |
| Repositório `iogomarques/IGbase` no GitHub | Remoto `origin` |
| Versão 1.10.04 | `shared/version.js`, páginas e parâmetros de cache |
| Supabase `zhkolwskpqhlovvdrbmv.supabase.co` | Clientes de conexão nas páginas e aplicativos |
| Suporte `suporteigbase@gmail.com` | `suporte/index.html` |
| Identidade | Logos em `assets/logo-ig-base.png`, `Logo_IG_Base.png` e favicon |

O usuário confirmou em 23/10/2026 que esta era a última versão do notebook antigo e que o site é publicado pelo **GitHub Pages**. A branch e a pasta configuradas como fonte da publicação ainda não foram verificadas. `origin/main` e a branch de trabalho apontavam ao mesmo commit no início; isso é uma observação local, não uma consulta atualizada ao remoto.

## Arquitetura

Site estático em português brasileiro, sem framework, servidor próprio ou etapa de build presentes no repositório. JavaScript roda no navegador e usa Supabase para autenticação e persistência. Não havia `package.json`, lockfile, testes ou workflow de CI/publicação nos arquivos recebidos. A primeira revisão acrescentou testes de regressão em `tests/faturamento.test.cjs`, executáveis diretamente com Node.js.

O Solar Organization concentra interface, estilos, regras e exportações em um HTML de 4.926 linhas. O Budget separa interface, motor, importação, documentos, arquivo e biblioteca de versões. Arquivos compartilhados unificam parte da identidade e do comportamento das páginas.

### Hub e conta

`index.html` oferece os dois aplicativos, login por e-mail ou username, configurações da conta, acesso a Empresas e Suporte, versão e aviso de novidades. `shared/login.js` resolve username por RPC e autentica por senha. O cadastro e a confirmação por código de e-mail estão no Organization. O template de confirmação do Supabase deve fornecer o token esperado pela interface; não há cópia dessa configuração no repositório.

`shared/account.js` monta menus, iniciais do usuário e configurações comuns, além de interações de teclado e seleção/arraste de elementos. `shared/presentation.css` compartilha estilos. A mesma origem e configuração Supabase permitem o uso da sessão pelos diferentes caminhos do site.

### Solar Organization

Gestão de aluguel de usinas e faturamento: clientes, UCs, pontos de consumo, perfis, variáveis, fórmulas editáveis, tarifas fixas por cliente, vigências por competência, histórico e exportações.

Os três modelos padrão são GD1 sem Fio B, GD2 com ponto único e GD2 com múltiplos pontos. O motor próprio tokeniza e interpreta fórmulas, incluindo operações, condições e funções matemáticas. Não confundir a versão interna de cálculo (`1.06` nos registros novos observados) com a versão pública do site.

Fluxo principal: escolher cliente e referência → lançar dados manualmente ou ler uma fatura → conferir UC, energia, geração e saldo → calcular → conferir a prévia → salvar no histórico e/ou exportar. Dados alterados invalidam o resultado para emissão até novo cálculo.

Regras existentes relevantes:

- O responsável pelo pagamento da concessionária é uma configuração do cliente e afeta Fio B e repasse.
- No rateio automático GD2, o ponto principal recebe o consumo calculado e o Fio B da conta; o restante da injeção é dividido entre os secundários, sem consumo negativo. Saldo já cobrado pode gerar ajuste explícito.
- Saldo anterior é rastreado por cliente, UC e UC principal, com verificação de origem, duplicidades, cronologia e alterações no histórico.
- Novos créditos precisam ser informados/confirmados; geração ou excedente estimado não entram automaticamente como crédito novo. Pode-se confirmar o saldo final da distribuidora e registrar diferenças.
- Tarifas programadas confirmadas entram a partir da competência escolhida; campos não preenchidos mantêm valores anteriores. A preparação para 2027 não determina tarifas ou tributos futuros.
- Leitura de faturas da Equatorial por PDF e OCR prepara uma revisão antes de aplicar os valores. A geração GD2 pode exigir consulta manual ao APsystems para o período de leitura; não foi encontrada integração automática com esse serviço.
- O histórico salva cópias dos resultados, perfil, cliente e configuração documental; abrir registros não executa novamente o motor. Registros legados sem snapshots podem usar o cadastro atual para partes da apresentação.
- Exporta PDF do cliente em uma página, PDF interno de conferência, PNG e Word em HTML `.doc`; gera Pix copia e cola/QR quando configurado. Exceder o espaço do PDF do cliente bloqueia a emissão, em vez de cortar silenciosamente o conteúdo.
- Modelos padrão podem ser sincronizados e gravados no login. Primeiro acesso pode criar modelos e um cliente fictício. Cadastro de empresas também pode migrar ao carregar.

O texto comercial do Hub menciona contratos em PDF; os fluxos de exportação identificados no Organization são de faturas/orçamentos. A existência de um fluxo específico de contratos precisa ser esclarecida.

### Solar Budget

`engine.js` define materiais, ofertas, fornecedores, especificações, associação sugerida, unidades, embalagens, mínimos, estoque, limites cotados, kits e cálculo dos carrinhos.

`import.js` reconhece listas agrupadas, tabelas, texto e geometria de PDF; mantém a origem e campos editáveis. `xlsx-reader.js` lê XLSX, DOCX e ODT por ZIP/XML no navegador, sem executar fórmulas ou macros. `app.js` também aceita PDF/OCR, CSV, TSV, TXT e texto colado; XLS antigo requer conversão.

Fluxo principal: lista de necessidades → confirmação de quantidades/unidades → fornecedores e ofertas → conferência das associações/especificações → comparação e carrinhos → salvar rascunho ou concluir → prévia e PDFs.

Regras e limites atuais:

- Ofertas importadas não são automaticamente confirmadas. Unidades e equivalências exigem revisão.
- Seleção automática prioriza atendimento completo por material e pode complementar ofertas parciais. Frete e desconto entram depois: **não há otimização global de custo**, fretes ou kits.
- Kits entram por escolha explícita, com custo registrado uma vez. Quantidade cotada limita a oferta e não comprova estoque.
- Campos comerciais vazios diferem de zero confirmado. Comparações integrais dependem de cobertura equivalente e condições conhecidas.
- Concluir exige atendimento completo, revisão e ao menos dois fornecedores; condições comerciais ausentes geram confirmação específica na interface.
- `archive.js` armazena versões e PDFs em `configuracoes_documento.data.solarBudgetArquivo`, com controle de concorrência por `updated_at` e limite de 24 MB para o JSON completo da conta.
- `library.js` organiza versões por cotação, filtros e nomes de arquivos. `document.js` produz prévia e PDF a partir de snapshots, sem recalcular resultados históricos.
- PDFs têm até oito páginas cada; há documento do carrinho, documentos por fornecedor, ZIP de PDFs, CSV e recorte explícito de materiais. Recortes não rateiam frete/desconto e não podem dividir um kit.
- A emissão atual precisa guardar os PDFs na conta antes de oferecer o download. Se o arquivo em nuvem estiver indisponível, a emissão é bloqueada.
- Há exportação/restauração JSON, migração de histórico local e tentativa de leitura da tabela legada `solar_budget_cotacoes`. Essa tabela não é o destino principal atual.

### Empresas e Suporte

Empresas usa `shared/companies.js` para cadastrar dados de emissão compartilhados, até 50 empresas por conta, com emissora padrão por aplicativo. Logo aceita PNG/JPG de até 900 KB e é reduzida no navegador. O serviço preserva os demais campos da configuração da conta e verifica concorrência. Dados antigos podem ser migrados, com tratamento de divergências.

O cadastro atual oferece criação e edição; textos das configurações mencionam exclusão, mas não foi encontrado método/controle de exclusão no serviço ou na tela de Empresas recebidos. Tratar como divergência de texto e implementação, sem presumir que exista essa função.

Suporte oferece copiar o e-mail, abrir composição no Gmail ou usar `mailto:`. Não há sistema de chamados no repositório. O texto “Todos os sistemas operacionais” no Hub é estático; não confirma saúde dos serviços.

## Onde os dados ficam

| Informação | Persistência identificada |
| --- | --- |
| Contas/sessões | Supabase Auth; sessão mantida pelo SDK no navegador |
| Username/e-mail de perfil | `perfis_usuario` |
| Perfis de faturamento | `perfis_faturamento.data`, uma linha por usuário |
| Clientes Organization | `clientes.data`, uma linha por usuário |
| Faturas/resultados Organization | `orcamentos.data`, uma linha por usuário |
| Configuração documental e empresas | `configuracoes_documento.data` |
| Versões e PDFs Budget | Mesmo JSON, namespace `solarBudgetArquivo` |
| Rascunho em edição do Budget | `localStorage`, chave por usuário; salvar cria versão na conta |
| Rascunho do formulário Organization | `localStorage`, chave por cliente |
| Aviso de novidades visto | `localStorage`, compartilhado pela origem |

**Trocar o ambiente de desenvolvimento para a nuvem não transfere o armazenamento local do navegador antigo.** Os registros realmente salvos no Supabase devem ser acessíveis pela mesma conta, sujeito à disponibilidade e às permissões reais do banco. Rascunhos apenas locais dependem do navegador antigo ou de um backup. O código-fonte Git também não é um backup dos dados do Supabase.

## Banco e dependências externas

O SQL recebido cria `perfis_faturamento`, `clientes` e `orcamentos`, com RLS e políticas de acesso por `auth.uid() = user_id`. Não inclui as tabelas atuais `configuracoes_documento`, `perfis_usuario`, as RPCs `email_por_username` e `username_disponivel`, nem suas permissões, restrições ou eventuais gatilhos. A leitura do SQL não comprova as políticas efetivamente instaladas em produção. Reexecutar o arquivo pode conflitar com nomes de políticas já existentes.

Dependências são carregadas de CDNs, em alguns fluxos com fallback: Supabase JS, jsPDF, PDF.js, Tesseract/OCR, html2canvas, biblioteca de QR Code e Google Fonts. O levantamento inicial não verificou a disponibilidade remota de todas elas. A chave Supabase publicada no cliente é uma chave pública; isolamento depende das permissões do banco. Nenhuma credencial administrativa foi localizada ou copiada para esta documentação.

Coleções completas são gravadas como JSON por usuário; Organization não usa a mesma verificação otimista de `updated_at` existente no serviço de empresas/arquivo Budget. Edições concorrentes e tamanho dos registros são pontos relevantes para futura revisão, sem diagnóstico de incidente confirmado nesta etapa.

## Alinhamento confirmado em 23/10/2026

- A versão inicial 1.10.04 era a última versão do notebook antigo.
- O site é publicado pelo GitHub Pages. A fonte de publicação (branch/pasta) ainda não foi conferida no serviço.
- Não é necessário acrescentar sincronização de rascunhos entre dispositivos; o trabalho em edição pode continuar no navegador em uso. Os registros já salvos mantêm a persistência atual na conta.
- A primeira prioridade é **faturamento**, com muitos ajustes visuais previstos para a continuidade do site.
- A pasta recebida é a referência técnica disponível. Não condicionar correções locais à entrega de outra documentação do Supabase; verificar a estrutura remota apenas quando a alteração depender dela.
- O usuário pediu que erros encontrados na base publicada fossem corrigidos agora. Isso autoriza investigação e correções na base. Em seguida, o usuário autorizou explicitamente a publicação da versão preparada.

## Primeira revisão de faturamento — versão preparada 1.10.05

Erros reproduzidos e corrigidos no motor de fórmulas do Organization:

1. `0 && (1 / 0)` e `1 || (1 / 0)` falhavam por divisão por zero: ambos os operandos eram sempre avaliados. Agora a avaliação respeita a condição e só executa o segundo operando quando necessário, mantendo resultados lógicos 0/1.
2. `0 % 0`, potências fora do limite e outros resultados não finitos podiam ser considerados válidos. Na serialização JSON, NaN e infinito se tornam null. Agora fórmulas sem resultado numérico finito são rejeitadas, com identificação da linha no perfil.
3. O cálculo não bloqueava um perfil cuja variável de total não existisse ou um total que ultrapassasse o limite após ajustes. Agora esses resultados impedem a criação de uma nova prévia válida.

A correção não recalcula registros históricos. Versão, parâmetros de cache e avisos de novidades foram atualizados para 1.10.05, com data de release 23/10/2026. O usuário autorizou sua publicação; o resultado deve ser consultado no GitHub Pages/Actions para o commit correspondente.

Verificação automatizada sem rede ou conta real: `node --test tests/faturamento.test.cjs`. Os testes cobrem avaliação condicional, rejeição de NaN/infinito, identificação de linha e valores de referência dos três modelos GD1/GD2. A revisão não equivale a uma auditoria completa da produção nem confirma o esquema/políticas remotos do Supabase.

## Alcance da verificação inicial

Foram inventariados os 24 arquivos originais, mapeados os módulos, lidas as regras e os fluxos principais, examinados os recursos compartilhados, SQL e histórico recente. A identidade visual principal foi inspecionada. A documentação foi adicionada sem alterar os arquivos originais do aplicativo.

Não foi realizada autenticação em conta real, gravação no Supabase, migração, publicação ou confirmação visual do site em produção. A tentativa de acessar `https://igbase.com.br` recebeu bloqueio CONNECT 403 do proxy do ambiente; isso não é evidência de indisponibilidade do site. O ambiente não reportou segredos ou identidades externas configurados no levantamento inicial.
