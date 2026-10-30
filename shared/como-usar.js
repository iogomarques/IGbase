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
    'O rodapé de todas as páginas tem os links para os outros sistemas e para o Suporte.',
    'Quando sai uma versão nova, aparece um aviso com as novidades. Ele aparece uma vez só.',
    'Rascunhos que ainda não foram salvos ficam no navegador do aparelho em uso. O que você salva na conta aparece em qualquer aparelho.']}]},
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
    'Dados lidos do PDF sempre passam pela sua conferência antes de entrar na fatura.']}]},
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
    'Em "Mais opções" há o backup da cotação (exportar e restaurar em JSON).']}]},
  {id:'distribution',nome:'Solar Distribution',link:'/solar-distribution/',intro:'Monta o rateio dos créditos de energia entre a usina geradora e as unidades, a partir das faturas da Equatorial, e gera o formulário de rateio.',grupos:[
   {titulo:'Passo a passo',passos:[
    ['Envie as faturas','Em "Lançar faturas", clique em "Escolher faturas (PDF)" e selecione de uma vez a fatura da usina geradora e as faturas das unidades.'],
    ['Confira a leitura','O site mostra o que leu de cada PDF: UC, tipo de ligação, consumo médio, saldo, não compensado, data de leitura e rateio atual. Confira se cada um está como unidade ou usina geradora e clique em "Aplicar faturas marcadas".'],
    ['Complete a usina','Clique no lápis da usina na lateral. Informe a potência em kWp (não vem na fatura). O fator padrão é 115 kWh por kWp; mude se o projeto usar outro (95, 120, 130…). Em "Fonte da geração" você pode usar a geração real do APsystems, SolarEdge ou outro monitoramento.'],
    ['Confira as unidades','No modo "Unidades" da lateral, confira consumo médio, ligação (mínimo de 30, 50 ou 100 kWh) e saldo, e quais usinas atendem cada unidade.'],
    ['Escolha o modo','Na aba Rateio, escolha "Homogênea" (proporcional ao consumo, como a planilha) ou "Prioritária" (unidades marcadas são atendidas primeiro).'],
    ['Ajuste e feche 100%','Veja o sugerido e, se precisar, ajuste em pontos (+ ou −) na coluna Ajuste. Cada usina precisa fechar 100%.'],
    ['Formulário e histórico','Clique em "Formulário de rateio (PDF)" para o pedido à Equatorial, depois em "Salvar este rateio no histórico" e em "Salvar na conta".']]},
   {titulo:'Alertas que aparecem',dicas:[
    '"Não atendem o consumo total": a geração não cobre todas as unidades; o site sugere quantos kWp (e placas) ampliar.',
    'Não compensado acima do mínimo: faltou crédito naquela unidade; aumente a porcentagem dela ou amplie a usina.',
    'Unidade lida antes da geradora: o crédito entra na fatura do mês seguinte.',
    'CPF/CNPJ diferente: no autoconsumo remoto, a usina e as unidades precisam ter o mesmo titular.',
    'A alteração do rateio na Equatorial vale a partir do ciclo seguinte ao pedido.']}]},
  {id:'empresas',nome:'Empresas',link:'/empresas/',intro:'Cadastro da empresa que aparece nos documentos do Solar Organization e do Solar Budget.',grupos:[
   {titulo:'Passo a passo',passos:[
    ['Nova empresa','Clique em "+ Cadastrar empresa".'],
    ['Dados','Preencha nome, razão social, CPF/CNPJ, endereço, e-mail, telefones (um por linha), o texto do rodapé dos documentos e a cor de destaque. Envie a logo em PNG ou JPG de até 900 KB.'],
    ['Salve','Clique em "Salvar empresa na conta". Para alterar depois, selecione a empresa na lista e use "Editar empresa".'],
    ['Use nos documentos','Escolha a empresa padrão nas Configurações do Solar Organization e em "Cliente e projeto" no Solar Budget.']]},
   {titulo:'Bom saber',dicas:[
    'Documentos já emitidos guardam os dados da empresa da época; mudar o cadastro vale para os próximos.',
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
