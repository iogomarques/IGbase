# Continuidade da IG Base

Leia `README.md` e `docs/CONTEXTO_IGBASE.md` antes de alterar o projeto. O inventário original está em `docs/INVENTARIO_INICIAL.md`.

## Contexto do usuário

Em 23/10/2026, o usuário definiu este trabalho como **atualização e continuidade** da IG Base existente após trocar de notebook e passar o desenvolvimento para a nuvem. O site de referência registrado no projeto é https://igbase.com.br. Trabalhe nesta base existente; uma reconstrução ou troca de plataforma depende de uma nova decisão de escopo.

## Alinhamento posterior do usuário

A base 1.10.04 é a última versão do notebook antigo. Hospedagem confirmada: GitHub Pages. Não há demanda para sincronizar rascunhos entre dispositivos. Prioridade inicial: faturamento; ajustes visuais virão na continuidade. A pasta é a referência técnica disponível: corrigir erros comprovados sem exigir documentação adicional do banco para mudanças que não dependem dela. A primeira revisão prepara a versão 1.10.05. O usuário autorizou sua publicação em 23/10/2026; conferir o resultado no Pages/Actions antes de afirmar qual versão está no ar.

## Cuidados específicos desta base

- Os aplicativos compartilham conta Supabase e cadastro de empresas. Confira efeitos entre Hub, Organization, Budget, Empresas e Suporte quando tocar arquivos compartilhados.
- O código aponta para o Supabase existente. Login e carregamento podem gravar modelos iniciais e migrações. Não trate uma prévia local como homologação isolada.
- Preserve os resultados e snapshots de documentos históricos. Abrir um registro salvo não deve recalculá-lo com tarifas ou cadastros atuais. Registros antigos sem snapshots têm limitações documentadas.
- Diferencie dados gravados na conta de rascunhos no navegador. Não prometa migração automática de rascunhos entre notebooks.
- Preserve a conferência de importações de faturas, materiais e ofertas. Sugestão de associação não equivale a confirmação.
- Tarifas por vigência só se aplicam quando confirmadas. Não invente tarifas ou impostos de 2027; o Fio B da conta não recebe uma multiplicação adicional automática.
- `shared/version.js` centraliza a versão pública; alterações de release também precisam conferir parâmetros de cache, fallbacks e avisos de novidades nas páginas. A integração documental inicial não altera a versão do produto.
- Não execute `setup-supabase[1].sql` como migração de atualização: faltam definições atuais e as políticas existentes podem conflitar em uma repetição.
- Confira o estado atual da rede antes de consultar serviços externos. O primeiro levantamento não conseguiu acessar o domínio público.

Para alterações de código, use verificações proporcionais ao fluxo afetado. Não havia testes automatizados versionados na base original. Mantenha a documentação atualizada quando uma dúvida for respondida ou uma decisão mudar.
