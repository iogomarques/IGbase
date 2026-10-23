# IG Base — instruções para o Claude Code

## Comece aqui

Continue o projeto existente nesta pasta. Não crie outro projeto, não duplique o repositório e não reconstrua a aplicação. Esta transferência é documental: não autoriza refatoração, atualização de dependências, mudança funcional, push ou deploy.

Leia nesta ordem:

1. [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md): decisões do usuário e histórico confirmado.
2. [ARCHITECTURE.md](ARCHITECTURE.md): módulos, integrações e persistência reais.
3. [SETUP.md](SETUP.md): comandos, cuidados com produção e validação.
4. [TODO.md](TODO.md): estado da entrega e pendências.
5. [AGENTS.md](AGENTS.md): orientações de continuidade já existentes, preservadas.

O levantamento detalhado anterior continua em [docs/CONTEXTO_IGBASE.md](docs/CONTEXTO_IGBASE.md). O [inventário original](docs/INVENTARIO_INICIAL.md) corresponde à versão 1.10.04, não é uma lista de hashes da versão atual.

## Objetivo e estado

IG Base reúne ferramentas para a operação de energia solar: faturamento de aluguel de usinas (Solar Organization), comparação de materiais/fornecedores (Solar Budget), empresas emissoras, conta e suporte. Interface e comunicação com o usuário em português brasileiro.

Última publicação confirmada nesta conversa: **1.10.05**, commit `99e09e9bb942d5fddc96426c5d579e9bdf8806f2`, GitHub Pages, em 23/10/2026. [Build e deploy bem-sucedidos](https://github.com/iogomarques/IGbase/actions/runs/39969075959). Essa evidência não é uma validação completa dos fluxos com conta real nem garante o estado futuro do domínio.

Prioridade definida pelo usuário: **faturamento**; haverá ajustes visuais posteriores ainda sem especificação. Rascunhos podem continuar locais no navegador; não há requisito de sincronizá-los entre dispositivos.

## Arquitetura e convenções a respeitar

- HTML, CSS e JavaScript no navegador; sem framework, npm, bundler ou servidor de aplicação no repositório. Python serve apenas a prévia estática; Node executa os testes.
- `index.html`: Hub, login e configurações da conta.
- `solar-organization/index.html`: aplicação de faturamento, com estilos, motor de fórmulas, estado, eventos e exportações no mesmo arquivo. Preserve essa organização ao fazer correções pontuais.
- `solar-budget/`: módulos separados, expostos por globais e carregados em ordem pela página; alguns também exportam CommonJS para uso em Node.
- `shared/`: conta, login, empresas, apresentação e versão comuns.
- `empresas/`, `suporte/`, `assets/`, `CNAME` e imagens da raiz fazem parte do site existente.
- Preserve estilo do arquivo tocado: Organization usa predominantemente funções/`var` e delegação por `data-action`; Budget usa IIFE, `const`/`let`, globais e atributos `data-*`. Não acrescente imports de bundler ou uma etapa de build sem novo escopo.
- Preserve formatação pt-BR, distinção entre campos vazios/desconhecidos e zero confirmado, escape de dados inseridos no HTML e as verificações de sessão antes/depois de operações assíncronas.

## Regras e funcionalidades que devem permanecer

- Organization: modelos GD1/GD2, perfis personalizáveis, clientes/UCs/pontos, vigências tarifárias, leitura Equatorial/PDF/OCR com revisão, saldo rastreável, histórico, prévia, Pix/QR e exportações PDF cliente/interno, PNG e Word.
- Não recalcule um registro histórico ao abri-lo. Preserve resultado e snapshots de cliente, perfil, tarifas e empresa. Registros antigos sem snapshots têm limitações; não invente os dados ausentes.
- Fio B e repasse dependem de quem paga a fatura da concessionária. Não altere a regra financeira como efeito colateral de um ajuste visual.
- Novos créditos de energia precisam de confirmação; geração/excedente estimado não vira crédito novo automaticamente. Saldo anterior é vinculado à identidade da UC e ao histórico.
- Tarifas por competência só entram quando confirmadas. Não invente impostos/tarifas de 2027 nem multiplique novamente o Fio B já informado em reais.
- Fórmulas devem respeitar avaliação condicional e rejeitar resultados não finitos. Não reverta as proteções da versão 1.10.05; mantenha os seis testes de regressão.
- PDF do cliente Organization deve caber em uma página ou bloquear a emissão; não cortar conteúdo silenciosamente.
- Budget: materiais/ofertas editáveis e conferidos, unidades/embalagens/mínimos/estoque, comparação de cobertura equivalente, kits explícitos, escolha manual ou automática, versões, backup JSON, PDFs/ZIP/CSV e recortes explícitos.
- Sugestão não é confirmação de equivalência; quantidade cotada não comprova estoque. A seleção automática por material não otimiza globalmente fretes, descontos ou kits.
- PDFs Budget têm até oito páginas por arquivo. Recortes não podem dividir kits nem ratear silenciosamente fretes/descontos.
- Conta e empresas são compartilhadas entre aplicativos. Preserve namespaces e dados não relacionados ao salvar o JSON compartilhado da configuração da conta.

## Comandos essenciais

Na raiz do projeto:

```sh
git status --short
node --test tests/faturamento.test.cjs
git diff --check
python3 -m http.server 8000 --bind 127.0.0.1
```

No Windows, se `python3` não existir, use `py -3 -m http.server 8000 --bind 127.0.0.1`. Abra `http://127.0.0.1:8000`. Não execute `npm install`: não há manifesto npm. Não abra o HTML por `file://`.

## Segurança, testes e alterações futuras

1. Confira `git status` e leia o diff antes de editar. Preserve alterações locais; não use reset destrutivo nem sobrescreva documentos existentes.
2. O código aponta para o Supabase existente. **Login/carregamento pode gravar dados reais**, criar modelos ou migrar empresas. A prévia local não isola o banco. Para testes autenticados, confirme a conta e o destino apropriados com o usuário.
3. Não execute `setup-supabase[1].sql` como receita completa ou migração automática; faltam tabelas/RPCs e políticas reais não foram auditadas. Não recrie o banco para viabilizar a transferência.
4. Não copie chaves, tokens, senhas, credenciais do Codex ou arquivos de autenticação para documentação. Não existe `.env` consumido pelo site atual; a configuração pública está no código cliente.
5. Faça alterações pequenas no módulo solicitado. Execute os testes existentes e valide o fluxo afetado; teste mudanças compartilhadas nos cinco caminhos do site. Não descreva teste de cálculo como teste completo de login, banco ou PDFs.
6. Para uma futura release funcional autorizada, confira `shared/version.js`, fallbacks, cache `?v=`, rodapés e changelogs das páginas. Esta migração documental não muda a versão.
7. **Não faça push nem deploy sem nova autorização.** A autorização anterior foi usada para publicar a 1.10.05; não é autorização para publicar esta transferência ou mudanças futuras. Uma publicação exige acompanhar o Pages até o resultado final.
8. Registre novos alinhamentos e evidências nos documentos pertinentes. Não presuma acesso às conversas de outro bot; todo o contexto recuperável está descrito nos arquivos de transferência.
