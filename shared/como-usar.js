/* "Como usar": passo a passo de cada sistema do IG Base. Aberto pelo menu "Minha conta" (shared/account.js),
   carregado só quando o usuário pede. Conteúdo conferido com as telas da versão em que foi escrito; ao mudar um
   fluxo, atualize o texto aqui. Sem dados do usuário: só texto fixo. */
(function(root){'use strict';
 const GUIDES=[
  {id:'hub',nome:'IG Base (início)',link:'/',intro:'A página inicial reúne todos os sistemas. Uma única conta vale para todos eles.',grupos:[
   {titulo:'Primeiros passos',passos:[
    ['Entre na sua conta','Na página inicial, entre com seu e-mail (ou nome de usuário) e senha. Depois de entrar, a mesma conta abre o Solar Organization, o Solar Budget, o Solar Distribution e o cadastro de Empresas, sem novo login.'],
    ['Escolha a ferramenta','Clique no cartão do sistema que quer usar: Solar Organization (faturas de aluguel de usinas), Solar Budget (cotação de materiais) ou Solar Distribution (rateio dos créditos).'],
    ['Cadastre sua empresa','Antes de emitir documentos, cadastre em Empresas a empresa que aparece nas faturas e orçamentos (nome, CNPJ, logo e rodapé).'],
    ['Ajuste sua conta','Em Minha conta → Configurações você muda o nome de usuário e sai da conta. Em todos os sistemas o menu Minha conta fica no canto superior direito.']]},
   {titulo:'Bom saber',dicas:[
    'Para ir a outro sistema, use o botão "Sistemas" ao lado do logo (em todas as páginas menos a inicial). O rodapé tem o IG Base, Empresas e Suporte.',
    'Quando sai uma versão nova, aparece um aviso com as novidades. Ele aparece uma vez só.',
    'Rascunhos que ainda não foram salvos ficam no navegador do aparelho em uso. O que você salva na conta aparece em qualquer aparelho.',
    'Em todos os sistemas, quando falta preencher algo, o site para, leva você ao campo e o destaca em laranja com o que falta. O destaque some quando você preenche.']}]},
  {id:'organization',nome:'Solar Organization',link:'/solar-organization/',intro:'Monta e emite a fatura de aluguel de energia de cada cliente (GD1 ou GD2), a partir da fatura da Equatorial ou de lançamento manual.',grupos:[
   {titulo:'Uma vez: preparar',passos:[
    ['Empresa emissora','Cadastre a empresa em Empresas e escolha a empresa padrão em Minha conta → Configurações do Solar Organization. É ela que aparece no documento do cliente.'],
    ['Perfis de faturamento','Os modelos GD1 e GD2 já vêm prontos. Em Configurações → Perfis de Faturamento você pode duplicar e editar um perfil, ou programar uma alteração de tarifas quando a nova tarifa estiver confirmada.'],
    ['Cadastre o cliente','Clique em "+ Novo cliente" na lateral. Informe nome, UC, CPF/CNPJ, local e o perfil (GD1 ou GD2). Em "Pontos de consumo" coloque um por linha, no formato Nome - UC. Preencha os dados do Pix (chave, banco, beneficiário e cidade) para o QR Code sair no documento.']]},
   {titulo:'Todo mês: emitir a fatura',passos:[
    ['Escolha o cliente','Selecione o cliente na lateral. Use a busca, o filtro de tipo de usina e a ordenação para achar mais rápido. O lápis ao lado do nome edita o cadastro.'],
    ['Referência','Na aba "Novo orçamento", confira o mês e o ano da fatura.'],
    ['Lance os dados','Em "Forma de lançamento", escolha "Importar fatura da Equatorial" e clique em "Ler PDF". Se o PDF for uma imagem escaneada, use "Ler PDF escaneado (OCR)". Confira o que foi lido e clique em "Aplicar dados conferidos". Também é possível digitar tudo em "Lançamento manual".'],
    ['Saldo de energia','Confira o saldo anterior. Use "Recuperar saldo do histórico" ou "Usar apuração automática de saldo". Créditos novos só entram depois de confirmados. Se a sobra já foi cobrada antes, marque essa opção para não cobrar duas vezes.'],
    ['Confira a cobrança','Revise a "Conferência da cobrança" e a prévia da fatura ao lado. Em qualquer campo numérico dá para digitar uma conta, por exemplo 120+35.'],
    ['Emita','Clique em "Baixar fatura PDF". Ela sai em uma página; se não couber, o site avisa e não corta nada. Também há PNG, Word e o PDF interno.'],
    ['Salve no histórico','Clique em "Salvar no histórico" para guardar a fatura emitida.']]},
   {titulo:'Histórico',passos:[
    ['Encontre faturas','Na aba Histórico, filtre por cliente, mês da fatura ou tipo de usina.'],
    ['Abra ou reaproveite','"Abrir fatura" mostra o documento exatamente como foi emitido, sem recalcular com tarifas novas. "Usar como base" começa o mês seguinte a partir dela.']]},
   {titulo:'Cuidados',dicas:[
    'Abrir uma fatura antiga não recalcula nada: valores, tarifas e dados do cliente ficam como estavam na emissão.',
    'O perfil define como entram o Fio B e o repasse. Conferir quem paga a fatura da concessionária evita cobrança errada.',
    'Dados lidos do PDF sempre passam pela sua conferência antes de entrar na fatura.',
    'Se faltar algo (fatura não lida ou não aplicada, mês e ano, geração do GD2, saldo, nome do cliente, calcular antes de salvar ou emitir), o site para e leva você ao campo, destacado em laranja com o que falta.',
    'Campo do mês vazio conta como 0. Antes de calcular, o site destaca os campos vazios: preencha, ou clique em "Calcular orçamento" de novo para usar 0.',
    'A condição de pagamento (ex.: débito automático) é de uso interno: sai no PDF interno, não na fatura do cliente.',
    'Cliente que você não atende mais ou quer ocultar: em "Editar dados do cliente", "Arquivar cliente" tira da lista sem apagar nada (para ver ou reativar: Filtros → Situação → Arquivados). "Excluir cliente" apaga o cliente e as faturas dele do histórico, sem volta.']}]},
  {id:'budget',nome:'Solar Budget',link:'/solar-budget/',intro:'Compara as cotações dos fornecedores para a lista de materiais de um projeto e monta os carrinhos de compra.',grupos:[
   {titulo:'Passo a passo',passos:[
    ['Crie a cotação','Clique em "+ Nova cotação" na lateral e dê um nome (por exemplo, o cliente e a potência).'],
    ['Cliente e projeto','Preencha os dados do cliente e escolha a empresa emissora. Esses dados abrem o PDF.'],
    ['Lista de materiais','Envie a lista do projeto (PDF, XLSX, DOCX, ODT, CSV, TSV ou TXT) ou cole o texto e clique em "Ler e revisar". Confira descrição, quantidade e unidade e clique em "Confirmar lista revisada". Dá para adicionar materiais à mão.'],
    ['Cotações dos fornecedores','Clique em "Adicionar fornecedor", envie a cotação dele e clique em "Ler e revisar". O site sugere qual item da cotação corresponde a cada material: a sugestão só vale depois que você confirma ("Usar sugestão" ou "Confirmar associações sem alertas"). Ajuste embalagens, mínimos, estoque, frete e desconto.'],
    ['Compare','Em "Comparação e carrinhos", veja o preço de cada material por fornecedor. Escolha a oferta à mão ou deixe a escolha automática por material. Os carrinhos mostram o que comprar em cada fornecedor.'],
    ['Salve','Clique em "Salvar cotação". Ela fica em "Cotações salvas" na lateral, com as versões anteriores. Ao fechar a compra, use "Mais opções" → "Marcar como concluída".'],
    ['Gere os documentos','Em "Gerar PDFs" baixe os PDFs (até 8 páginas cada), o ZIP com todos ou o CSV dos carrinhos. "Salvar todos os PDFs na conta" guarda os documentos em "Orçamentos e PDFs salvos".']]},
   {titulo:'Bom saber',dicas:[
    'A lateral alterna entre "Cotações" (padrão) e "Fornecedores" da cotação aberta.',
    'A escolha automática compara material por material; ela não calcula a melhor combinação de frete, desconto ou kit.',
    'Quantidade cotada não garante estoque: confirme com o fornecedor.',
    'Se um PDF passar de 8 páginas, use o recorte: ele não divide kits nem reparte frete e descontos.',
    'Em "Mais opções" há o backup da cotação (exportar e restaurar em JSON).',
    'Para ocultar ou apagar uma cotação salva: em "Orçamentos e PDFs salvos", abra a cotação. "Arquivar cotação" tira da lista sem apagar ("Ver cotações arquivadas" na lateral, ou Situação: Arquivadas). "Excluir cotação" apaga todas as versões e PDFs salvos dela, sem volta.',
    'Necessidade sem material, quantidade ou unidade não é confirmada: o site destaca em laranja o que falta preencher. Números inválidos também ficam destacados.']}]},
  {id:'distribution',nome:'Solar Distribution',link:'/solar-distribution/',intro:'Monta o rateio dos créditos de energia de cada cliente entre as usinas geradoras e as unidades, a partir das faturas da Equatorial, e gera o relatório do cliente (com a sua empresa no cabeçalho) e, à parte, um formulário de rateio da Equatorial por usina.',grupos:[
   {titulo:'O que o site lê sozinho e o que você informa',dicas:[
    'Lido das faturas: UC, titular, CPF/CNPJ, tipo de ligação (mínimo de 30, 50 ou 100 kWh), consumo médio, saldo, não compensado, datas de leitura, rateio cadastrado hoje na Equatorial e, na fatura da geradora, a energia injetada na rede e o consumo da rede dos últimos meses, além de classe, endereço, CEP e cidade para o formulário.',
    'Você informa: a geração esperada de cada usina (kWh/mês, do monitoramento) ou a potência em kWp; quem recebe de qual usina, se o plano for diferente do cadastro atual da Equatorial; e-mail e telefones do formulário; e, no modo prioritário, quais unidades são prioritárias.',
    'A fatura não mostra a produção total dos painéis: a parte que a geradora usa na hora, durante o sol, não passa pelo medidor. Esse número só existe no monitoramento (APsystems, SolarEdge…).']},
   {titulo:'Passo a passo (um cliente por vez)',passos:[
    ['Escolha as faturas','Em "Lançar faturas", clique em "Escolher faturas (PDF)" e selecione a fatura da usina geradora e as faturas das unidades do cliente. Dá para escolher em várias vezes (uma pasta por geradora, por exemplo): as faturas somam na lista, e a mesma fatura repetida entra uma vez só.'],
    ['2a. Cliente','O site acha o cliente pelo CPF/CNPJ das faturas. Se for a primeira vez, cria um cliente novo com o nome do titular (dá para trocar o nome ali). Também dá para escolher outro cliente já cadastrado.'],
    ['2b. Faturas lidas','Confira o que foi lido de cada PDF e se cada fatura está como "Unidade" ou "Usina geradora". Desmarque o que não quiser aplicar.'],
    ['2c. Geração de cada usina','Informe a geração esperada da UFV (kWh/mês) ou a potência (kWp; o site usa kWp × 115, fator que pode ser trocado na usina). Pode deixar para depois: o rateio pede de novo.'],
    ['2d. Quem recebe de qual usina','A tabela já vem marcada pelo cadastro atual da Equatorial (o que aparece nas faturas). Se o plano novo for diferente, marque e desmarque aqui. Uma unidade pode receber de mais de uma usina. Se o consumo de uma unidade vai subir e a fatura ainda não mostra (ex.: dois ares-condicionados novos), clique em "+ consumo previsto" embaixo do nome dela e some os kWh/mês, com o motivo.'],
    ['3. Aplicar','Clique em "Aplicar e ver o rateio". O site já salva na sua conta e abre o rateio do cliente com as etapas (Faturas, Geração, Ligações, Ajuste 100%, Relatório) e a lista "O que falta para fechar o rateio", com um link para resolver cada item.'],
    ['Confira e ajuste','No "Mapa do rateio", cada usina aparece numa barra com a porcentagem de cada unidade. Na tabela da usina, ajuste em pontos (+ ou −) na coluna Ajuste: a soma aparece na hora e cada usina precisa fechar 100%, com pelo menos 1% por unidade.'],
    ['Relatório do cliente','No fim da página, escolha a empresa do cabeçalho e clique em "Relatório do cliente (PDF)". É o documento para o cliente, no estilo da fatura do Solar Organization: a sua empresa e o logo no cabeçalho, a situação de cada usina, o rateio de cada unidade e os pontos de atenção.'],
    ['Formulários da Equatorial','Logo abaixo, em "Formulários da Equatorial", gere o formulário de cada usina: um PDF separado por usina, para quem faz o pedido de rateio à distribuidora (não vai para o cliente). Precisa do e-mail ou de um telefone da usina.'],
    ['Salve','Clique em "Salvar este rateio no histórico" e em "Salvar na conta" (a barra de salvar fica amarela quando há algo a salvar). O histórico guarda as porcentagens e o relatório daquele dia, para emitir de novo igual.']]},
   {titulo:'Como o site chega na energia do rateio',dicas:[
    'A geradora também consome. Só a sobra vai para as unidades: geração − o que a geradora usa na hora (geração − energia injetada) − o consumo da rede dela acima do mínimo. É o mesmo "GERAÇÃO CICLO" que aparece nas faturas das unidades.',
    'Exemplo: geração esperada 1.200 kWh, a fatura mostra 634 kWh injetados e 346 kWh de consumo da rede (mínimo 30): 1.200 − 566 − 316 = 319 kWh para o rateio. O cabeçalho de cada usina mostra essa conta ("1.200 kWh → 319 kWh para o rateio").',
    'Com a fatura da geradora lançada, a sobra fica igual a energia injetada − consumo da rede acima do mínimo; a geração esperada pesa de verdade quando não há fatura da geradora. Os valores da fatura são a média dos últimos 3 meses (ou dos meses que existirem).',
    'Cada unidade precisa de crédito só para o consumo médio menos o mínimo (30, 50 ou 100 kWh), que a Equatorial cobra de qualquer jeito. Ex.: mínimo 100 e consumo 200 → a unidade precisa de 100.',
    'Ajuste de consumo: quando a média da fatura não mostra uma mudança que vem por aí (ex.: dois ares-condicionados novos), use "+ consumo previsto" (no passo 2d do lançamento ou embaixo do nome da unidade, na tabela do rateio): some ou tire kWh/mês e escreva o motivo. Também fica na ficha da unidade, em "Ajuste do consumo (previsão)". O rateio, a falta e o relatório passam a usar média + ajuste, e o ajuste fica guardado ao lançar faturas novas.',
    'Na tabela do rateio, a coluna "A compensar" mostra essa conta embaixo do valor (ex.: "264 − 30 (mínimo mono)" = 234 kWh). O mínimo é o custo de disponibilidade: 30 kWh monofásico, 50 bifásico, 100 trifásico.',
    'Classificação GD (Lei 14.300): o site lê da fatura ("INJEÇÃO SCEE … GD I") e mostra na usina (GD1, GD2 ou GD3); a unidade recebe os créditos na classificação de cada usina ligada a ela. Dá para corrigir na ficha da usina.']},
   {titulo:'Clientes e lateral',dicas:[
    'A lateral abre em "Clientes": busque por nome, UC ou CPF/CNPJ. O ponto colorido mostra a situação (verde: pronto; laranja: pendências; vermelho: a geração não atende o consumo).',
    'Com um cliente escolhido, as abas Rateio, Usinas, Unidades e Histórico mostram só o que é dele. Para voltar ao painel com todos os clientes, clique em "Todos os clientes".',
    'O lápis ao lado do cliente abre os dados dele (nome, CPF/CNPJ, e-mail e telefone que saem no relatório). Nas fichas de usina e unidade dá para trocar o cliente de cada uma.',
    'No topo de cada cliente: "Arquivar cliente" tira o cliente da lista e do painel sem apagar nada (para ver ou reativar: Filtros → Situação → Arquivados). "Excluir cliente" apaga o cliente, as usinas e as unidades dele; os rateios já salvos no histórico continuam. Depois clique em "Salvar na conta".',
    'Os modos "Usinas" e "Unidades" da lateral continuam para editar cada usina (fator, meses de geração, dados do formulário) e cada unidade (consumo, ligação, saldo, usinas que mandam energia).']},
   {titulo:'Alertas que aparecem',dicas:[
    '"Não atendem o consumo total": a geração não cobre todas as unidades do cliente; o site informa quantos kWp de geração faltam. O site informa só os kWp: placas, inversores e como ampliar ficam a cargo do instalador.',
    'Não compensado acima do mínimo: faltou crédito naquela unidade; aumente a porcentagem dela ou amplie a usina. O aviso aparece embaixo do nome da unidade, na tabela.',
    'Unidade lida antes da geradora: o crédito entra na fatura do mês seguinte.',
    'CPF/CNPJ diferente: no autoconsumo remoto, a usina e as unidades precisam ter o mesmo titular.',
    'Saldo acumulado: o site divide o saldo pelo consumo médio da unidade menos o mínimo e mostra quantos meses ele dura e quando fazer um novo rateio.']},
   {titulo:'Bom saber',dicas:[
    'Modo de distribuição: "Homogênea" divide na proporção do que cada unidade precisa; "Prioritária" atende primeiro as unidades marcadas na coluna "Prioritária".',
    'Saldo das unidades: "Não considerar" segue só o consumo (bom para deixar o rateio muito tempo sem mexer); "Considerar o saldo": quem tem saldo para mais de 3 meses fica com 1% e a energia vai para as demais — refaça o rateio em 3 meses.',
    'Regra da Equatorial: toda unidade do rateio recebe no mínimo 1%, sempre em números inteiros que fecham 100%. A alteração vale a partir do ciclo seguinte ao pedido (peça com cerca de 30 dias de antecedência).',
    'Se faltar um passo, o relatório, o histórico e os formulários não saem: ao clicar, o site leva você ao que falta (a geração, uma ligação, o consumo ou o ajuste de 100%; para os formulários, também o contato da usina), destacado em laranja. No lançamento, "Aplicar" também para se faltar o nome do cliente novo, a geração de uma usina ou a usina de uma unidade.',
    'Ao aplicar faturas, o site já salva na conta. Depois disso, as mudanças (ajustes, dados, consumo previsto) vão para a conta quando você clica em "Salvar na conta"; até lá ficam guardadas neste navegador e a barra de salvar fica amarela.']}]},
  {id:'empresas',nome:'Empresas',link:'/empresas/',intro:'Cadastro da empresa que aparece nos documentos do Solar Organization, do Solar Budget e no relatório do cliente do Solar Distribution.',grupos:[
   {titulo:'Passo a passo',passos:[
    ['Nova empresa','Clique em "+ Cadastrar empresa".'],
    ['Dados','Preencha nome, razão social, CPF/CNPJ, endereço, e-mail, telefones (um por linha), o texto do rodapé dos documentos e a cor de destaque. Envie a logo em PNG ou JPG de até 900 KB.'],
    ['Salve','Clique em "Salvar empresa na conta". Para alterar depois, selecione a empresa na lista e use "Editar empresa".'],
    ['Use nos documentos','Escolha a empresa padrão nas Configurações do Solar Organization e em "Cliente e projeto" no Solar Budget.']]},
   {titulo:'Bom saber',dicas:[
    'Documentos já emitidos guardam os dados da empresa da época; mudar o cadastro vale para os próximos.',
    'Para tirar uma empresa do cadastro, abra "Editar empresa" e use "Excluir empresa". Os documentos já emitidos continuam com os dados dela; se ela era a padrão de algum sistema, escolha outra.',
    'Se aparecer "Conferir dados anteriores do Solar Organization", é a passagem do cadastro antigo: confira e conclua uma vez.']}]}];
 const byPath=p=>p.startsWith('/solar-organization')?'organization':p.startsWith('/solar-budget')?'budget':p.startsWith('/solar-distribution')?'distribution':p.startsWith('/empresas')?'empresas':'hub';
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function body(g){return '<p class="help-intro">'+esc(g.intro)+'</p>'+g.grupos.map(gr=>'<section class="help-group"><h3>'+esc(gr.titulo)+'</h3>'+(gr.passos?'<ol class="help-steps">'+gr.passos.map(([t,d])=>'<li><strong>'+esc(t)+'</strong><span>'+esc(d)+'</span></li>').join('')+'</ol>':'<ul class="help-tips">'+gr.dicas.map(d=>'<li>'+esc(d)+'</li>').join('')+'</ul>')+'</section>').join('')+(location.pathname.replace(/index\.html$/,'')===g.link?'':'<div class="cfg-actions"><a class="ig-settings-button" href="'+g.link+'">Abrir o '+esc(g.nome)+'</a></div>');}
 function open(area){let d=document.getElementById('ig-help');if(!d){d=document.createElement('dialog');d.id='ig-help';d.className='ig-settings ig-help';d.setAttribute('aria-labelledby','ig-help-title');document.body.append(d);
   d.addEventListener('click',e=>{const t=e.target.closest('[data-help-tab]');if(t){show(t.dataset.helpTab);return;}if(e.target.closest('.ig-settings-close')){d.close();return;}if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});}
  d.innerHTML='<button type="button" class="ig-settings-close" aria-label="Fechar o Como usar">×</button><h2 class="cfg-modal-title" id="ig-help-title">Como usar</h2><div class="help-tabs" role="tablist" aria-label="Sistemas">'+GUIDES.map(g=>'<button type="button" role="tab" data-help-tab="'+g.id+'">'+esc(g.nome)+'</button>').join('')+'</div><div class="help-body" role="tabpanel"></div>';
  function show(id){const g=GUIDES.find(x=>x.id===id)||GUIDES[0];d.querySelectorAll('[data-help-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.helpTab===g.id)));const b=d.querySelector('.help-body');b.innerHTML=body(g);b.scrollTop=0;}
  show(area||byPath(location.pathname));if(!d.open)d.showModal();d.querySelector('[aria-selected=true]')?.focus();}
 root.IGHelp={open,guides:GUIDES};
})(globalThis);
