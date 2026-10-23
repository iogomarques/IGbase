# IG Base

Continuidade e atualização do site existente da IG Base, agora com desenvolvimento em ambiente de nuvem. Esta pasta é a base de código conectada para as próximas alterações.

- Site de referência: https://igbase.com.br
- Repositório configurado: https://github.com/iogomarques/IGbase
- Versão encontrada na integração inicial: **1.10.04**, de 13/10/2026.
- Commit de referência: `74d3e02`.
- Levantamento inicial: 23/10/2026.
- Hospedagem confirmada pelo usuário: GitHub Pages.
- Versão preparada após a primeira revisão: **1.10.05**. O resultado da publicação deve ser conferido no GitHub Pages/Actions.
- Prioridade: faturamento; rascunhos continuam no navegador.

## Referências do projeto

- [Contexto, arquitetura, dados e dúvidas](docs/CONTEXTO_IGBASE.md)
- [Inventário da base recebida](docs/INVENTARIO_INICIAL.md)
- [Orientações para próximas sessões](AGENTS.md)

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| `index.html` | Hub IG Base, entrada e configurações da conta |
| `solar-organization/index.html` | Clientes, perfis de faturamento, faturas, saldo de energia e documentos |
| `solar-budget/` | Materiais, cotações, fornecedores, carrinhos, versões e PDFs salvos |
| `empresas/` | Cadastro central de empresas emissoras |
| `suporte/` | Contato de suporte |
| `shared/` | Conta, login, empresas, identidade visual e versão comuns |
| `assets/`, imagens da raiz | Identidade visual |
| `CNAME` | Domínio registrado para o site |

## Executar uma prévia

O site usa HTML, CSS e JavaScript sem compilação. Sirva a raiz desta pasta por HTTP para que os caminhos absolutos funcionem:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Acesse `http://127.0.0.1:8000`. Abrir os arquivos diretamente com `file://` não equivale a servir o site.

**Atenção:** a cópia aponta para o Supabase existente. Uma sessão autenticada pode gravar dados reais; até o primeiro carregamento pode criar registros iniciais, atualizar modelos padrão ou migrar empresas. Não foi identificado ambiente de homologação separado. A prévia não é um banco de testes.

## Limites do levantamento

O levantamento cobre a estrutura dos 24 arquivos originais, os módulos do código e o histórico Git recente. Não confirma o estado do banco remoto nem a versão efetivamente publicada. O acesso a `https://igbase.com.br` foi bloqueado pelo proxy deste ambiente (CONNECT 403). Não havia README, AGENTS.md, suíte de testes, manifesto de dependências ou workflow de publicação versionado na base recebida.

O arquivo `setup-supabase[1].sql` é uma configuração parcial antiga, não uma receita completa para recriar a infraestrutura atual. Consulte as lacunas em `docs/CONTEXTO_IGBASE.md` antes de qualquer intervenção no banco.

## Verificar faturamento

Execute `node --test tests/faturamento.test.cjs`. Os testes usam as funções reais extraídas do HTML, com dados fictícios, sem autenticação ou chamadas ao Supabase.
