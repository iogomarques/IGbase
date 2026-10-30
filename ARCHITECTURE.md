# Arquitetura existente da IG Base

Descrição da base 1.10.05, em 23/10/2026. Estrutura real, sem proposta de reorganização. Decisões e histórico: [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md). Execução: [SETUP.md](SETUP.md).

## Árvore de referência

```text
.
├── index.html
├── CNAME
├── Logo_IG_Base.png
├── favicon-ig-base.png
├── setup-supabase[1].sql
├── assets/logo-ig-base.png
├── shared/
│   ├── account.js
│   ├── companies.js
│   ├── login.js
│   ├── presentation.css
│   └── version.js
├── solar-organization/index.html
├── solar-budget/
│   ├── index.html
│   ├── app.js
│   ├── engine.js
│   ├── import.js
│   ├── xlsx-reader.js
│   ├── document.js
│   ├── archive.js
│   ├── library.js
│   └── styles.css
├── solar-distribution/
│   ├── index.html
│   ├── engine.js
│   ├── store.js
│   ├── app.js
│   └── styles.css
├── empresas/
│   ├── index.html
│   └── app.js
├── suporte/index.html
├── tests/faturamento.test.cjs
├── docs/
│   ├── CONTEXTO_IGBASE.md
│   └── INVENTARIO_INICIAL.md
├── AGENTS.md
├── README.md
├── CLAUDE.md
├── PROJECT_CONTEXT.md
├── ARCHITECTURE.md
├── SETUP.md
└── TODO.md
```

O diretório `.git/` existente guarda o histórico; não é código do site. A pasta não contém backend próprio, configuração de containers, manifesto npm, lockfile ou workflow `.github/workflows/` versionado. A publicação observada usa o workflow gerenciado pelo Pages.

## Páginas e comunicação

O Hub (`index.html`) navega por links para `/solar-organization/`, `/solar-budget/`, `/empresas/` e `/suporte/`. Os caminhos absolutos exigem servir a raiz da pasta. O domínio de referência está em `CNAME`.

Cada página carrega scripts clássicos. Os módulos compartilhados expõem globais: `IGAccount`, `IGCompanies`, `IGLogin`, `IGBaseRelease`. Não há roteador SPA central. Budget usa fragmentos como `#arquivos`, `#arquivos/<id>` e `#configuracoes`; Hub usa `#entrar` e `#configuracoes`.

`shared/version.js` define versão/release e atualiza elementos `data-ig-version`. `presentation.css` unifica partes de conta, configurações, marcas e responsividade. Alterações compartilhadas têm impacto entre páginas.

## Organization

`solar-organization/index.html` contém CSS, estrutura e uma IIFE com utilitários, parser/interprete de fórmulas, modelos GD1/GD2, estado, adaptadores Supabase, formulários, leitura PDF/OCR, saldo, histórico, exportações e eventos delegados por `data-action`.

Fluxo de execução:

1. `init` carrega Supabase JS, cria o cliente e consulta a sessão.
2. `aoLogar` / `loadAll` carregam perfis, clientes, faturas e configuração documental. Podem inicializar/sincronizar modelos e migrar dados de empresas.
3. A seleção de cliente determina perfil, variáveis, tarifas e pontos. O formulário aceita entrada manual ou revisão de uma fatura Equatorial extraída localmente.
4. `onCalcular` valida saldo e vigência, avalia fórmulas e ajustes, valida o total e monta `state.lastDraft`, com cópias dos dados relevantes.
5. A prévia usa o resultado calculado. Alterações de entrada exigem novo cálculo para emissão/salvamento.
6. `onSalvarHistorico` grava um snapshot em `orcamentos`; abrir histórico usa o resultado salvo. Geradores produzem documentos no navegador.

O histórico pode manter versões internas de esquema/cálculo que diferem da versão pública. `fluxo-energia-v2`, `tarifas-por-periodo-v1` e `versaoCalculo` são metadados existentes; não os substitua automaticamente ao mudar a versão do site.

## Budget

| Arquivo / global | Responsabilidade |
| --- | --- |
| `engine.js` / `SolarBudget` | Modelo `solar-budget-v1`, validação, normalização, sugestões, custos e carrinhos |
| `import.js` / `SolarBudgetImport` | Listas agrupadas, tabelas de texto/PDF e sugestões editáveis |
| `xlsx-reader.js` / `SolarBudgetXlsx` | Leitura local de ZIP/XML de XLSX, DOCX e ODT, sem executar macros/fórmulas |
| `library.js` / `SolarBudgetLibrary` | Agrupamento de versões, filtros e nomes portáveis dos arquivos |
| `document.js` / `SolarBudgetDocument` | Modelo comum de prévia/PDF, comparação, limites e ZIP |
| `archive.js` / `IGBudgetArchive` | Persistência privada de versões e PDFs, com verificação da sessão e concorrência |
| `app.js` | Inicialização, DOM, carregamento das bibliotecas, revisão, eventos e integração dos serviços |
| `index.html`, `styles.css` | Ordem dos scripts, página e apresentação |

Scripts de módulos são deferidos na ordem declarada em `solar-budget/index.html`; os serviços/globais devem existir antes de sua utilização. O motor também exporta CommonJS em Node e obtém a versão compartilhada.

Fluxo: autenticar → restaurar rascunho local → carregar empresas e arquivo da conta → importar/conferir necessidades e ofertas → calcular seleção → salvar versão → preparar prévia a partir de snapshot → gerar e guardar PDFs na conta → oferecer download/ZIP. O texto-fonte importado fica registrado para revisão. Seleção automática é por material, com frete/desconto somados depois.

## Solar Distribution

Rateio de créditos entre usinas e unidades. Motor puro em `engine.js` (`SolarDistribution`, também CommonJS), gravação em `configuracoes_documento.data.solarDistribution` por `store.js` (`IGDistributionStore`, com verificação de `updated_at`), tela em `app.js`. Detalhes e regras em [docs/SOLAR_DISTRIBUTION.md](docs/SOLAR_DISTRIBUTION.md).

## Conta, empresas e suporte

`shared/login.js` usa `email_por_username` quando o identificador não é e-mail; Supabase Auth autentica com senha. Cadastro, confirmação OTP e gravação de username estão no Organization. Hub gerencia username e consulta `username_disponivel`. Não foi encontrado um fluxo completo de recuperação de senha, embora haja textos remetendo à recuperação.

`shared/companies.js` mantém empresas, emissora selecionada por aplicativo e migração legada dentro do JSON de configuração, preservando namespaces não relacionados. `empresas/app.js` fornece criação/edição e tratamento de logo. `shared/account.js` cuida de menus e configurações comuns; no Suporte também monta a conta. Suporte apenas abre Gmail/`mailto:` e copia e-mail; não há backend de chamados.

## Persistência e isolamento

| Dado | Destino observado no código |
| --- | --- |
| Sessão/conta | Supabase Auth, com sessão do SDK no navegador |
| Nome de usuário | `perfis_usuario`, campos `user_id`, `username`, `email` |
| Perfis Organization | `perfis_faturamento.data` |
| Clientes Organization | `clientes.data` |
| Faturas/resultados Organization | `orcamentos.data` |
| Configuração e empresas | `configuracoes_documento.data`, incluindo `empresasIGBase`, `empresasSelecionadas`, `migracaoEmpresasV1` |
| Versões/PDFs Budget | `configuracoes_documento.data.solarBudgetArquivo`, versão 1 |
| Usinas, unidades e rateios (Distribution) | `configuracoes_documento.data.solarDistribution`, versão 1 |
| Rascunho Distribution | `localStorage`, `igbase:solar-distribution:v1:<userId>` |
| Arquivo Budget legado | Tentativa de leitura em `solar_budget_cotacoes`, não o destino principal de gravação |
| Rascunho Organization | `localStorage`, `usinas:rascunho:<clientId>` |
| Rascunho Budget | `localStorage`, `igbase:solar-budget:v1:<userId>` |
| Novidades vistas | `localStorage`, `igbase_changelog_visto` |

Coleções Organization usam uma linha por usuário com JSON e `updated_at`. Empresas e arquivo Budget verificam concorrência por `updated_at`; Organization grava coleções inteiras por upsert e não tem a mesma proteção otimista. O arquivo Budget impõe 24 MB ao JSON completo da configuração e guarda PDFs em base64. Não há uso identificado de um bucket de Storage para esses PDFs.

O SQL disponível declara RLS para três tabelas. O estado real de permissões do banco não foi auditado. Detalhes faltantes para recriar o serviço estão em [SETUP.md](SETUP.md).

## Dependências e serviços externos

| Dependência | Uso / versão declarada |
| --- | --- |
| Supabase JS | Auth e tabelas/RPCs, CDN `@2` (major, não fixado em versão exata) |
| jsPDF | Geração PDF, `2.5.1` |
| PDF.js | Extração local de PDF, `pdfjs-dist@6.4.299` |
| Tesseract.js | OCR local, `7.0.0`, idioma português |
| html2canvas | PNG do Organization, `1.4.1` |
| qrcode-generator | Pix/QR do Organization, `1.4.4` |
| Google Fonts | Inter e Poppins |

Fontes incluem jsDelivr, unpkg e cdnjs, conforme o carregador de cada fluxo; não pressupor fallback em todas as páginas. As bibliotecas são baixadas pelo navegador, não instaladas por npm. APsystems é uma fonte de consulta manual de geração mencionada na interface, não uma API integrada encontrada no código. Gmail é um link de composição; Pix gera payload e QR, não inicia pagamento nem concilia recebimento automaticamente.

## Como usar (1.10.15)

`shared/como-usar.js` guarda o passo a passo de cada sistema (texto fixo, sem dados do usuário) e expõe `window.IGHelp.open(area)`. `shared/account.js` coloca o botão **Como usar** no topo do menu Minha conta (em `IGAccount.html`) e carrega o arquivo só no primeiro clique; o Solar Budget tem o botão direto no HTML do menu. Estilos em `shared/presentation.css` (`.ig-help`, `.help-*`). Ao mudar um fluxo de tela, atualize o texto correspondente nesse arquivo.
