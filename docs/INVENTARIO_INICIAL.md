# Inventário da base recebida

Referência: commit `74d3e02`, levantamento de 23/10/2026. São 24 arquivos originais; `.git` e a documentação adicionada nesta integração não fazem parte dessa contagem. Os hashes registram a cópia inicial, não o estado futuro do site publicado.

| Arquivo | Bytes | Linhas de texto | Papel |
| --- | ---: | ---: | --- |
| `CNAME` | 14 | 1 | Domínio do site |
| `Logo_IG_Base.png` | 388300 | — | Logo usado por páginas dos aplicativos |
| `assets/logo-ig-base.png` | 167373 | — | Logo principal do Hub e Organization |
| `empresas/app.js` | 7953 | 20 | Interface e sessão do cadastro de empresas |
| `empresas/index.html` | 2955 | 2 | Página de Empresas |
| `favicon-ig-base.png` | 6643 | — | Ícone das páginas |
| `index.html` | 29024 | 369 | Hub, login, conta e novidades |
| `setup-supabase[1].sql` | 4021 | 82 | SQL parcial original de tabelas e RLS |
| `shared/account.js` | 6957 | 19 | Menus, configurações comuns e conta do Suporte |
| `shared/companies.js` | 7646 | 25 | Serviço compartilhado de empresas e migração |
| `shared/login.js` | 1811 | 21 | Login por e-mail/username |
| `shared/presentation.css` | 9717 | 26 | Estilos comuns |
| `shared/version.js` | 710 | 12 | Versão pública compartilhada |
| `solar-budget/app.js` | 57525 | 298 | Interface, sessão, importação e persistência |
| `solar-budget/archive.js` | 3793 | 16 | Arquivo de versões e PDFs na conta |
| `solar-budget/document.js` | 24342 | 91 | Modelo, prévia, PDF e ZIP |
| `solar-budget/engine.js` | 20827 | 188 | Modelo de dados, comparação e cálculo |
| `solar-budget/import.js` | 19991 | 111 | Extração de listas, texto e tabelas PDF |
| `solar-budget/index.html` | 13290 | 23 | Página do Solar Budget |
| `solar-budget/library.js` | 4598 | 15 | Agrupamento de versões e nomes de documentos |
| `solar-budget/styles.css` | 12177 | 18 | Estilos do Budget e base de Empresas |
| `solar-budget/xlsx-reader.js` | 6398 | 60 | Leitor ZIP/XML para XLSX, DOCX e ODT |
| `solar-organization/index.html` | 359399 | 4926 | Aplicativo completo de clientes, faturamento e documentos |
| `suporte/index.html` | 6317 | 93 | Contato por e-mail/Gmail e cópia do endereço |

## SHA-256 dos arquivos originais

```text
a9e87ed94c08098190ef2bc97d52bb2d590a9d9a2ecdf1c8c2d21dcdd28b63f5  CNAME
ff93acd7f6aa1cd27859b1e0b2d505f617ebcf4748c26eed83944845b2734cfa  Logo_IG_Base.png
abbcf928009814374bd514a66595e7630cabd2f2367e14e7a81bbc186e37293c  assets/logo-ig-base.png
aab47846eccf891222da3e22ed6e9a81900a0617d00ab419288ce6a7eab70a01  empresas/app.js
7adc7f16752c809940b40cdaeb62376ac75d5358f0d150cf6296bba667d30b20  empresas/index.html
71b51d383e2cfeee8eabe08ea0d6a9a68e52d38b3b79fe479e62ee5e3b5a84da  favicon-ig-base.png
19e49e8aa3b3437db8fbcf7827a6b2930ebf5c27a61b4ae3a116060a594be18d  index.html
7458a2f206e51ba17ceb213e9ff473586fe061c76a06cd143cba2594509d7bd7  setup-supabase[1].sql
47c74c1ad91ecc6781718a7a74325176114bf7404f9c1e0090eb0bd95095d505  shared/account.js
b747fe25a41f82b5fac2a1ab9a3607f21d5bc38f3b8e0fc82d46e23344176bcf  shared/companies.js
731abe8fa8bd4a1371b6d6692a50afe0664489f2a71165bb968ad9955e1f1dc2  shared/login.js
b5ce2daeec7c763c0cf85fc2fb447c03d2f23f0d4870f3b3225bfe3771ff8c50  shared/presentation.css
9430440df523d329dd54d0e08b7920ff2c4e75da025224a878326d4fe89f917a  shared/version.js
8185a1afd9b9e29e1a317d7e82061ba8be75d10c9d8f5ac3c2917c4ab3801a08  solar-budget/app.js
72377bfad0d508a04ce7d259f36c2ec6b87ab1210295202caf99c910b49c4ccb  solar-budget/archive.js
91d088e9528ef308ac5c2aae713d696af6c1c1c9b2c2202a352d51a0ff27d902  solar-budget/document.js
cd4bf7ace0a829cb0e4335e1d74ea06e053351ee3b2de0fb55fafdb40374d583  solar-budget/engine.js
9b2ea919ff1a56459d92443b7dc4bd25faa387773791c1f7cb0665567365422d  solar-budget/import.js
cb78937d0b3da928fb643f41807351699ff27727f9b7e86f59933aac78005ab9  solar-budget/index.html
15747c6ea4eed5d969843013ca20d659c9da6db83a153c7bb2bd40897b179fb6  solar-budget/library.js
43a56cbd5cd55b8fb3ee88479247b52daaa090134d199a10e29561d4b50ccab5  solar-budget/styles.css
8f7507e4bfe0c97e3a906322a8d5639def1f98900fb0672561b2adba9802b7e5  solar-budget/xlsx-reader.js
17d238aeb9cd81700588dd1b29ed3e36cd692c122b54e1ac5e973101af51b895  solar-organization/index.html
f33d0fa9e9c5891bb8c81f1c6c5d502dd7d9502e8ee7961ab645e843404fbdbc  suporte/index.html
```

## Material adicional disponível no ambiente

Não foram encontrados arquivos de conteúdo nas pastas `/workspace/library-files` e `/workspace/shared` durante o levantamento. Não havia documentação adicional versionada na pasta do projeto. Configurações remotas do banco e da hospedagem não estão incluídas neste inventário.
