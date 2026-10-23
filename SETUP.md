# Execução, validação e publicação

Execute os comandos a partir da raiz que contém `index.html`, `CNAME` e `.git`. A transferência não modifica configuração ou código. Leia primeiro [CLAUDE.md](CLAUDE.md).

## Pré-requisitos

- Navegador atual com JavaScript, armazenamento local, módulos dinâmicos, canvas e APIs de arquivos. XLSX/DOCX/ODT usam `DecompressionStream('deflate-raw')`; navegadores antigos podem exigir atualização ou CSV.
- Python 3 para servir arquivos estáticos. É uma conveniência de prévia, não dependência de produção.
- Node.js para `node:test`. Esta entrega foi verificada com **Node 24.19.0** e **Python 3.12.14**. O repositório não declara uma versão mínima; use uma versão LTS atual com `node:test`/`node:vm`.
- Git para preservar histórico e revisar alterações.
- Internet no navegador para Supabase, CDNs, OCR e fontes.

## Não há instalação npm nem build local

Não existem `package.json`, lockfile ou dependências Node instaláveis nesta base. Não execute `npm install`, não crie bundler e não atualize bibliotecas para preparar a migração. Os scripts de terceiros são carregados de CDNs conforme [ARCHITECTURE.md](ARCHITECTURE.md).

## Prévia local

```sh
git status --short
python3 -m http.server 8000 --bind 127.0.0.1
```

No Windows, alternativa: `py -3 -m http.server 8000 --bind 127.0.0.1`. Abra:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/solar-organization/`
- `http://127.0.0.1:8000/solar-budget/`
- `http://127.0.0.1:8000/empresas/`
- `http://127.0.0.1:8000/suporte/`

Pare com Ctrl+C. Se a porta estiver ocupada, escolha outra e use o mesmo número no navegador. Não abra por `file://`: há caminhos absolutos e bibliotecas que dependem do contexto HTTP. O servidor Python não reproduz o build Jekyll do Pages; serve os arquivos do repositório diretamente.

**A prévia usa o Supabase existente.** Não há chave de modo de testes, emulador nem homologação separada identificados. Login/carregamento pode criar registros iniciais, sincronizar modelos padrão, migrar empresas e importar histórico Budget. Não use uma conta real para um teste supostamente sem efeitos. Para validar fluxos autenticados, alinhe uma conta e um destino adequados com o usuário antes de gravar dados.

## Configuração e variáveis de ambiente

O site não lê `.env` nem variáveis de ambiente do servidor. URL e chave **pública** Supabase já estão no JavaScript cliente, em `index.html`, `solar-organization/index.html`, `solar-budget/app.js`, `empresas/app.js` e `shared/account.js`. O comportamento atual depende desses valores consistentes; a transferência não os substitui e esta documentação não copia as chaves.

Variáveis/credenciais do ambiente Codex ou permissões dos seus conectores não acompanham a pasta nem são configuração da aplicação. No computador do usuário, autenticação GitHub e instalação do Claude Code devem ser feitas pelos procedimentos oficiais das ferramentas, fora do código do site. Não exporte tokens ou arquivos de credenciais do ambiente atual.

## Supabase: continuar o existente não é recriar o banco

O cliente espera Auth, tabelas e RPCs listadas em [ARCHITECTURE.md](ARCHITECTURE.md). O arquivo [setup-supabase[1].sql](setup-supabase%5B1%5D.sql) cria somente `perfis_faturamento`, `clientes` e `orcamentos`, com `data`, `updated_at` e RLS por usuário.

Faltam no material disponível:

- DDL de `configuracoes_documento` e `perfis_usuario` e suas políticas/restrições efetivas.
- Definições/permissões das RPCs `email_por_username` e `username_disponivel`.
- Eventuais gatilhos/índices, configuração Auth e configuração da tabela legada Budget.
- Template de confirmação de e-mail: a interface espera um código OTP de cadastro; comentários citam `{{ .Token }}`, mas o template atual não foi consultado.
- Confirmação de redirects/origens permitidas e políticas de acesso realmente instaladas.

**Não execute o SQL antigo automaticamente**: ele não recompõe o backend atual e repetir políticas pode falhar. Se uma mudança exigir outro banco ou ajuste de segurança, obtenha esquema/políticas reais e planeje migração própria, sem presumir que esta transferência concede autorização para executá-la. Não é preciso recriar Supabase para abrir a pasta no Claude.

## Testes sem autenticação

```sh
node --test tests/faturamento.test.cjs
git diff --check
```

Os seis testes usam funções reais extraídas de `solar-organization/index.html`, em VM com dados fictícios. Cobrem condicionais, resultados não finitos, linha de erro, modelos GD1/GD2 e bloqueio de total inválido. Não fazem chamadas ao Supabase e não validam UI, banco, PDF/OCR ou compatibilidade integral entre dispositivos. A extração depende dos marcadores de funções no HTML; se uma alteração futura autorizada mover essas funções, ajuste o carregamento dos testes e confirme que eles continuam executando o código real.

Para conferir um arquivo JS independente, use `node --check shared/version.js` (substitua pelo arquivo tocado). `node --check` não aceita um HTML inteiro: extraia os scripts inline para análise sintática sem executá-los. Não execute toda a página em Node como se fosse teste de navegador.

Validação manual futura, com dados de teste apropriados: login/saída e username, clientes e modelos GD1/GD2, tarifas por período, importação Equatorial e conferência de UC, saldo cronológico, histórico sem recálculo, PDF cliente/interno/Pix, empresas compartilhadas e fluxo Budget de importação até versão/PDF salvo. Para alterações visuais, conferir desktop/móvel e os cinco caminhos. Marcar como testado apenas o que realmente foi executado.

## Publicação existente e autorização

Publicação anterior confirmada: `main`, commit `99e09e9`, [Pages build and deployment](https://github.com/iogomarques/IGbase/actions/runs/39969075959), com build Jekyll e deploy bem-sucedidos. O domínio personalizado está em `CNAME`. Não há workflow de publicação versionado. A seleção exata de fonte/pasta no painel Settings > Pages ainda precisa ser conferida antes de mudanças na hospedagem.

**Nenhum push, commit ou deploy foi solicitado para esta preparação.** Não os execute automaticamente. Para uma futura publicação autorizada:

1. Consulte o remoto e a configuração real do Pages; preserve alterações concorrentes. Inspecione `git status`, diff e testes.
2. Para release funcional, confira versão comum, cache `?v=`, rodapés/fallbacks e novidades. Documentação sozinha não exige mudar a versão do produto.
3. Prepare o commit com os arquivos pertinentes e publique na branch/fonte confirmada, respeitando proteções e o fluxo autorizado. Não use force push para contornar divergências.
4. Acompanhe o workflow daquele commit até build e deploy concluírem. Só então declare o resultado da publicação.
5. Confira o domínio/versão entregue quando houver acesso. Um deploy bem-sucedido não substitui teste ponta a ponta.

No ambiente anterior, `gh` não conseguiu autenticar/consultar a API; a publicação foi feita pelo conector GitHub autorizado. Não há razão para copiar aquele token. No novo computador, configure a própria autenticação GitHub se/quando precisar publicar.

## Transferir para outro computador

Se o Claude Code usar esta mesma pasta, apenas abra-a e mantenha `.git` e as alterações documentais locais. Se precisar movê-la, copie a pasta existente com os documentos atuais e `.git` para preservar histórico; não inicialize outro repositório nem duplique a arquitetura. Não leve caches, dependências geradas, temporários ou credenciais. Nenhum pacote/ZIP extra foi criado nesta tarefa.

Como esta preparação fica sem commit/push, um novo clone remoto sozinho **não incluirá os novos documentos**: leve os arquivos locais ou solicite separadamente seu versionamento. A cópia do código não transfere dados do Supabase nem `localStorage`; o usuário não pediu migração/sincronização adicional de rascunhos.
