/* Solar Replacement: telas no modelo do Solar Distribution (lateral, título, abas).
   Grava sozinho na conta, um pouco depois de cada mudança. Base da ideia do sócio, 20/11/2026. */
(function(){'use strict';
const G=SolarReplacement,$=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TABS=['painel','chamado','usinas','estoque','ajustes'];
const val=v=>v===null||v===undefined?'':String(v).replace('.',',');
const brl=v=>v===null||v===undefined||!Number.isFinite(v)?'—':'R$ '+G.fmt(v,2);
const dataBr=s=>s?s.split('-').reverse().join('/'):'—';
let db=null,user=null,store=null,data=G.fresh(),generation=0,sel={chamado:null,usina:null},noticeTimer=null,salvarTimer=null;
const notify=(t,kind='success')=>{clearTimeout(noticeTimer);const n=$('notice');n.className=kind;n.textContent=t;if(kind==='success'&&t)noticeTimer=setTimeout(()=>{if(n.textContent===t)n.textContent='';},6000);};
function timeout(p,ms=20000){let t;return Promise.race([p,new Promise((_,r)=>t=setTimeout(()=>r(Error('Tempo de conexão excedido. Tente novamente.')),ms))]).finally(()=>clearTimeout(t));}
async function lib(name,urls,test){if(test())return;for(const url of urls){try{await timeout(new Promise((ok,no)=>{const s=document.createElement('script');s.src=url;s.onload=()=>test()?ok():no(Error('Biblioteca inválida'));s.onerror=no;document.head.append(s);}));return;}catch(e){}}throw Error('Não foi possível carregar '+name+'. Confira sua conexão.');}
const tab=()=>{const h=location.hash.slice(1);return TABS.includes(h)?h:'painel';};
const usinaById=id=>data.usinas.find(u=>u.id===id),chamadoById=id=>data.chamados.find(c=>c.id===id),modeloById=id=>data.modelos.find(m=>m.id===id);

/* ---------- Sessão ---------- */
async function boot(){const g=++generation;$('loading').hidden=false;$('auth').hidden=true;try{
 if(!window.supabase)await lib('a conexão IG Base',['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js','https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'],()=>!!window.supabase?.createClient);
 if(!db){db=supabase.createClient('https://zhkolwskpqhlovvdrbmv.supabase.co','sb_publishable_3bqhMMM6CndF6MKl5N1FoA_GaS_mq7E');db.auth.onAuthStateChange((ev,s)=>{if(ev==='SIGNED_OUT')activate(null);else if((ev==='SIGNED_IN'||ev==='TOKEN_REFRESHED')&&s?.user?.id!==user?.id)setTimeout(()=>activate(s?.user||null),0);});}
 const r=await timeout(db.auth.getSession());if(g!==generation)return;if(r.error)throw r.error;await activate(r.data.session?.user||null);
}catch(e){if(g!==generation)return;$('loading').hidden=true;$('auth').hidden=false;$('retry').hidden=false;notify(e.message||'Não foi possível conectar.','error');}}
async function activate(next){const g=++generation;user=next;store=null;data=G.fresh();sel={chamado:null,usina:null};
 $('loading').hidden=!!user;$('auth').hidden=!!user;$('workspace').hidden=true;$('budget-navigation').hidden=!user;$('side-panel').hidden=!user;$('g-account').innerHTML='';
 if(!user){$('loading').hidden=true;return;}
 let name=user.user_metadata?.username;try{const p=await timeout(db.from('perfis_usuario').select('username').eq('user_id',user.id).maybeSingle());name=p.data?.username||name;}catch(e){}
 if(g!==generation)return;$('g-account').innerHTML=IGAccount.html(name,'<button type="button" id="g-settings">Configurações</button><a href="/#configuracoes">Configurações da conta no IG Base</a><button type="button" id="g-signout">Sair da conta</button>');
 $('g-settings').onclick=()=>IGAccount.openSettings(name,'solar-replacement');$('g-signout').onclick=async()=>{const r=await db.auth.signOut();if(r.error)notify(r.error.message,'error');};
 try{const s=IGReplacementStore.service(db,user);await timeout(s.load());if(g!==generation)return;store=s;data=s.data;}catch(e){if(g!==generation)return;$('loading').hidden=true;notify('Não foi possível abrir o Solar Replacement. '+e.message,'error');return;}
 sel.chamado=data.chamados[0]?.id||null;sel.usina=data.usinas[0]?.id||null;$('loading').hidden=true;$('workspace').hidden=false;render();}

/* ---------- Gravação automática ---------- */
function salvo(t,erro){const el=$('g-salvo');el.textContent=t;el.classList.toggle('erro',!!erro);el.classList.toggle('salvando',!erro&&/Salvando/.test(t));el.closest('.dist-toolbar')?.classList.toggle('sujo',!!erro||/Salvando/.test(t));}
function agendarGravacao(){clearTimeout(salvarTimer);salvo('Salvando…');salvarTimer=setTimeout(gravar,900);}
async function gravar(){if(!store)return;if(store.gravando){agendarGravacao();return;}try{await store.save(data);salvo('Salvo na sua conta IG Base às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'.');}catch(e){salvo('Não foi possível salvar: '+e.message,true);notify('Não foi possível salvar: '+e.message,'error');}}
window.addEventListener('beforeunload',e=>{if(salvarTimer&&/Salvando/.test($('g-salvo').textContent)){e.preventDefault();e.returnValue='';}});
function mudou(){G.validate(data);agendarGravacao();renderDepois();}

/* Redesenho depois da mudança, sem perder o clique nem o cursor (mesmo cuidado do Solar Distribution). */
let renderTimer=null,pressionado=false,renderPendente=false;
function renderDepois(){clearTimeout(renderTimer);if(pressionado){renderPendente=true;return;}renderTimer=setTimeout(render,0);}
document.addEventListener('pointerdown',()=>{pressionado=true;},true);
const soltar=()=>{pressionado=false;if(renderPendente){renderPendente=false;renderTimer=setTimeout(render,0);}};
document.addEventListener('pointerup',soltar,true);document.addEventListener('pointercancel',soltar,true);
function focoAtual(){const el=document.activeElement;if(!el||!el.matches||!el.matches('input,select,textarea'))return null;const s=el.id?'#'+CSS.escape(el.id):[...el.attributes].filter(a=>a.name.startsWith('data-')).map(a=>'['+a.name+'="'+CSS.escape(a.value)+'"]').join('');return s?el.tagName.toLowerCase()+s:null;}
function restaurarFoco(s){if(!s)return;const el=document.querySelector(s);if(el&&el!==document.activeElement)el.focus({preventScroll:true});}

/* ---------- Telas ---------- */
const field=(label,attr,value,type='text',extra='')=>'<label>'+label+'<input '+attr+' type="'+type+'" value="'+esc(value??'')+'" '+extra+'></label>';
/* 1.10.54 (pedido do usuário): mesmo modelo de tela do Solar Distribution (título por aba, lateral com modos e filtros, barra de salvar). */
const TITULOS={painel:['Painel','Chamados em andamento, backups instalados e ressarcimento.'],chamado:['Chamado','Usina, testes e fotos, fabricante, backup e troca, num lugar só.'],usinas:['Usinas','ID no monitoramento, potência, fator e tarifa de cada usina.'],estoque:['Estoque de backup','Equipamentos de reserva para instalar em campo enquanto o fabricante troca.'],ajustes:['Ajustes','Carência, contagem do ressarcimento e modelos de equipamento.']};
function renderHeading(){const t=tab();if(!user){$('g-title').textContent='Solar Replacement';$('g-subtitle').textContent='Garantias, trocas e estoque de backup dos equipamentos solares.';return;}$('g-title').textContent=TITULOS[t][0];$('g-subtitle').textContent=TITULOS[t][1];}
function render(){clearTimeout(renderTimer);const foco=focoAtual();const t=tab();renderHeading();
 for(const a of document.querySelectorAll('[data-tab]')){if(a.dataset.tab===t)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
 for(const s of document.querySelectorAll('[data-page]'))s.hidden=s.dataset.page!==t;if(!user||!store)return;
 renderSide();({painel:renderPainel,chamado:renderChamado,usinas:renderUsinas,estoque:renderEstoque,ajustes:renderAjustes})[t]();restaurarFoco(foco);}
const pillEtapa=ch=>{const n=G.etapa(ch);return '<span class="g-pill e'+n+'">'+n+' · '+esc(G.etapaNome(n))+'</span>';};
let sideMode='chamados';const sideFiltro={situacao:'andamento',ordem:'recentes'};
const SIDE_TXT={chamados:['Buscar usina, serial ou nº do caso','+ Novo chamado','Chamados'],usinas:['Buscar ID, usina ou cliente','+ Nova usina','Usinas'],estoque:['Buscar serial ou modelo','+ Novo backup','Equipamentos de backup']};
function opcoes(list,v){return list.map(([k,t])=>'<option value="'+k+'"'+(k===v?' selected':'')+'>'+t+'</option>').join('');}
function renderSideFilters(){const box=$('side-filters');if(sideMode!=='chamados'){box.innerHTML='';return;}const ativos=(sideFiltro.situacao!=='andamento')+(sideFiltro.ordem!=='recentes'),aberto=box.dataset.aberto?box.dataset.aberto==='1':!matchMedia('(max-width: 900px)').matches;
 box.innerHTML='<details class="side-filters-box"'+(aberto?' open':'')+'><summary>Filtros'+(ativos?' ('+ativos+')':'')+'</summary><div class="side-filters-body"><label class="filter-label" for="side-situacao">Situação</label><select id="side-situacao" data-side-filtro="situacao">'+opcoes([['andamento','Em andamento'],['concluidos','Concluídos'],['todos','Todos']],sideFiltro.situacao)+'</select><label class="filter-label" for="side-ordem">Ordenar chamados</label><select id="side-ordem" data-side-filtro="ordem">'+opcoes([['recentes','Mais recentes'],['antigos','Mais antigos'],['usina','Usina: A–Z']],sideFiltro.ordem)+'</select>'+(ativos?'<button type="button" class="ghost side-clear" data-side-limpar>Limpar filtros</button>':'')+'</div></details>';}
function renderSide(){for(const b of document.querySelectorAll('[data-side-mode]'))b.setAttribute('aria-pressed',String(b.dataset.sideMode===sideMode));const [ph,novo,rot]=SIDE_TXT[sideMode];$('side-search').placeholder=ph;$('side-new').textContent=novo;$('side-label').textContent=rot;renderSideFilters();
 const q=$('side-search').value.trim().toLowerCase();
 if(sideMode==='usinas'){const lista=data.usinas.filter(u=>!q||[u.idMonitoramento,u.nome,u.cliente].join(' ').toLowerCase().includes(q)).sort((x,y)=>String(x.idMonitoramento||x.nome).localeCompare(String(y.idMonitoramento||y.nome),'pt-BR'));
  $('side-list').innerHTML=lista.map(u=>{const n=data.chamados.filter(c=>c.usinaId===u.id&&G.etapa(c)<5).length;return '<button type="button" class="side-row'+(u.id===sel.usina&&tab()==='usinas'?' active':'')+'" data-side-usina="'+esc(u.id)+'"><span class="side-dot'+(n?'':' done')+'" aria-hidden="true"></span><span class="side-meta"><span class="side-name">'+esc(u.idMonitoramento||u.nome||'Usina sem ID')+'</span><span class="side-sub">'+esc([u.nome&&u.idMonitoramento?u.nome:'',u.cliente].filter(Boolean).join(' · ')||'—')+(n?' · '+n+(n>1?' chamados abertos':' chamado aberto'):'')+'</span></span></button>';}).join('')||'<p class="side-empty">'+(data.usinas.length?'Nenhuma usina com essa busca.':'Nenhuma usina ainda. Clique em "+ Nova usina".')+'</p>';return;}
 if(sideMode==='estoque'){const lista=data.equipamentos.filter(e=>e.backup&&(!q||[e.serial,e.marca,e.modelo].join(' ').toLowerCase().includes(q))).sort((x,y)=>(x.status!=='BACKUP_DISPONIVEL')-(y.status!=='BACKUP_DISPONIVEL')||String(x.serial).localeCompare(String(y.serial)));
  $('side-list').innerHTML=lista.map(e=>{const us=usinaById(e.usinaId),livre=e.status==='BACKUP_DISPONIVEL';return '<button type="button" class="side-row" data-side-estoque="'+esc(e.id)+'"><span class="side-dot'+(livre?' done':'')+'" aria-hidden="true"></span><span class="side-meta"><span class="side-name">'+esc(e.serial)+'</span><span class="side-sub">'+esc((e.marca||'')+' '+(e.modelo||''))+' · '+(livre?'disponível':'em '+esc(us?(us.idMonitoramento||us.nome):'campo'))+'</span></span></button>';}).join('')||'<p class="side-empty">'+(data.equipamentos.some(e=>e.backup)?'Nenhum backup com essa busca.':'Nenhum backup ainda. Clique em "+ Novo backup".')+'</p>';return;}
 const ordem={recentes:(a,b)=>b.numero-a.numero,antigos:(a,b)=>a.numero-b.numero,usina:(a,b)=>String(usinaById(a.usinaId)?.idMonitoramento||'').localeCompare(String(usinaById(b.usinaId)?.idMonitoramento||''),'pt-BR')||b.numero-a.numero}[sideFiltro.ordem];
 const lista=data.chamados.filter(ch=>sideFiltro.situacao==='todos'||(sideFiltro.situacao==='concluidos')===(G.etapa(ch)===5)).sort(ordem).filter(ch=>{if(!q)return true;const us=usinaById(ch.usinaId);return [ch.numero,ch.serialDefeito,ch.casoFabricante,us?.idMonitoramento,us?.nome,us?.cliente].join(' ').toLowerCase().includes(q);});
 $('side-list').innerHTML=lista.map(ch=>{const us=usinaById(ch.usinaId);return '<button type="button" class="side-row'+(ch.id===sel.chamado&&tab()==='chamado'?' active':'')+'" data-abrir="'+esc(ch.id)+'"><span class="side-dot'+(G.etapa(ch)===5?' done':'')+'" aria-hidden="true"></span><span class="side-meta"><span class="side-name">Nº '+ch.numero+' · '+esc(us?.idMonitoramento||us?.nome||'Usina não escolhida')+'</span><span class="side-sub">'+esc(G.etapaNome(G.etapa(ch)))+(ch.serialDefeito?' · '+esc(ch.serialDefeito):'')+'</span></span></button>';}).join('')||'<p class="side-empty">'+(data.chamados.length?'Nenhum chamado com essa busca ou filtro.':'Nenhum chamado ainda. Clique em "+ Novo chamado".')+'</p>';}

function renderPainel(){const host=document.querySelector('[data-page=painel]'),abertos=data.chamados.filter(c=>G.etapa(c)<5);
 const total=data.chamados.reduce((t,c)=>t+(G.ressarcimento(c,data,usinaById(c.usinaId)).valor||0),0),metric=(k,v)=>'<div class="metric"><span>'+k+'</span><strong>'+v+'</strong></div>';
 const porEtapa=n=>abertos.filter(c=>G.etapa(c)===n).length;
 host.innerHTML='<div class="panel"><div class="metrics g-metrics">'+metric('Chamados abertos',String(abertos.length))+metric('Aguardando fabricante',String(porEtapa(2)))+metric('Com backup instalado',String(porEtapa(3)))+metric('Backups disponíveis',String(data.equipamentos.filter(e=>e.status==='BACKUP_DISPONIVEL').length))+metric('Ressarcimento total',brl(total))+'</div></div>'+
 '<div class="panel"><h2>Chamados em andamento</h2>'+(abertos.length?'<div class="table-wrap"><table class="g-table"><thead><tr><th>Nº</th><th>Usina</th><th>Serial com defeito</th><th>Etapa</th><th>Dias parados</th><th>A receber</th></tr></thead><tbody>'+abertos.sort((a,b)=>a.numero-b.numero).map(c=>{const us=usinaById(c.usinaId),r=G.ressarcimento(c,data,us);return '<tr data-abrir="'+esc(c.id)+'" class="g-linha"><td>'+c.numero+'</td><td><strong>'+esc(us?.idMonitoramento||'—')+'</strong><div class="tiny">'+esc(us?.cliente||us?.nome||'')+'</div></td><td>'+esc(c.serialDefeito||'—')+'</td><td>'+pillEtapa(c)+'</td><td>'+(r.parados??'—')+'</td><td>'+brl(r.valor)+'</td></tr>';}).join('')+'</tbody></table></div>':'<p class="muted g-vazio"><svg class="igi" width="40" height="40" aria-hidden="true"><use href="/assets/icons/sprite.svg?v=1.10.56#troca"/></svg><span>Nenhum chamado em andamento. Clique em "+ Novo chamado" na lateral para abrir o primeiro.</span></p>')+'</div>'+
 '<div class="panel g-proximos"><h2>Em construção</h2><p class="hint">Esta é a base. Próximas partes: dossiê PDF para o fabricante, etiquetas térmica e A4, leitura do serial pela câmera, conferência de prints do monitoramento e relatório por período.</p></div>';}

function renderChamado(){const host=document.querySelector('[data-page=chamado]'),ch=chamadoById(sel.chamado);
 if(!ch){host.innerHTML='<div class="panel empty-state"><svg class="igi" width="40" height="40" aria-hidden="true"><use href="/assets/icons/sprite.svg?v=1.10.56#troca"/></svg><h2>Nenhum chamado aberto</h2><p class="muted">Abra um chamado para cada equipamento com defeito. Tudo fica ligado ao ID da usina no monitoramento.</p><div class="actions"><button class="primary" data-action="novo-chamado">+ Novo chamado</button></div></div>';return;}
 const us=usinaById(ch.usinaId),r=G.ressarcimento(ch,data,us),n=G.etapa(ch),m=modeloById(ch.modeloId),porEntrada=G.potenciaPorEntrada(m||{potenciaKw:ch.potenciaKw,entradas:1});
 const pot=G.num(ch.potenciaKw),afet=G.num(ch.potenciaAfetadaKw),modo=afet===null?'':pot!==null&&Math.abs(afet-pot)<1e-6?'total':porEntrada!==null&&Math.abs(afet-porEntrada)<1e-6&&(m&&m.entradas>1)?'entrada':'outra';
 const disponiveis=data.equipamentos.filter(e=>e.status==='BACKUP_DISPONIVEL');
 let h='<div class="panel g-cabecalho"><div class="section-title"><div><h2>Chamado nº '+ch.numero+'</h2><p class="hint">'+esc(us?((us.idMonitoramento||'sem ID')+' · '+(us.nome||'')+(us.cliente?' · '+us.cliente:'')):'Escolha a usina')+'</p></div>'+pillEtapa(ch)+'</div>'+
  '<ol class="g-etapas" aria-label="Etapas do chamado">'+G.ETAPAS.map(([k,t])=>'<li class="'+(k<n||n===5?'feita':k===n?'atual':'')+'"><span>'+(k<n||n===5?'✓':k)+'</span>'+esc(t)+'</li>').join('')+'</ol></div>';
 /* 1. Usina e equipamento */
 h+='<section class="panel"><h2>1. Usina e equipamento</h2><div class="settings-grid">'+
  '<label>Usina (ID no monitoramento)<select data-ch="usinaId"><option value="">Escolha a usina</option>'+data.usinas.map(u=>'<option value="'+esc(u.id)+'" '+(u.id===ch.usinaId?'selected':'')+'>'+esc((u.idMonitoramento||'sem ID')+' · '+(u.nome||u.cliente||''))+'</option>').join('')+'</select></label>'+
  field('Serial com defeito (12 a 15 dígitos)','data-ch="serialDefeito"',ch.serialDefeito,'text','inputmode="numeric" autocomplete="off"')+
  '<label>Modelo<select data-ch="modeloId"><option value="">Escolha o modelo</option>'+data.modelos.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===ch.modeloId?'selected':'')+'>'+esc(x.marca+' '+x.modelo+' · '+G.fmt(G.num(x.potenciaKw),2)+' kW')+'</option>').join('')+'</select></label>'+
  field('Fabricante (para o caso de garantia)','data-ch="fabricante"',ch.fabricante||ch.marca)+'</div>'+
  (ch.serialDefeito&&!G.serialValido(ch.serialDefeito)?'<p class="dist-aviso">O serial tem '+G.soSerial(ch.serialDefeito).length+' dígitos. Confira: o esperado é de 12 a 15.</p>':'')+
  (data.usinas.length?'':'<p class="hint">Nenhuma usina cadastrada. <a href="#usinas" data-action="nova-usina">Cadastrar usina</a></p>')+
  '<h3>Potência afetada</h3><div class="g-opcoes" role="group" aria-label="Potência afetada">'+
  (pot!==null?'<button type="button" data-potencia="total" aria-pressed="'+(modo==='total')+'">Equipamento inteiro · '+G.fmt(pot,2)+' kW</button>':'')+
  (m&&m.entradas>1&&porEntrada!==null?'<button type="button" data-potencia="entrada" aria-pressed="'+(modo==='entrada')+'">1 entrada de '+m.entradas+' · '+G.fmt(porEntrada,3)+' kW</button>':'')+
  '<label class="g-outra">Outra (kW)<input data-ch="potenciaAfetadaKw" inputmode="decimal" value="'+esc(val(ch.potenciaAfetadaKw))+'" placeholder="ex.: 0,5"></label></div>'+
  (pot===null?'<p class="hint">Escolha o modelo para o site preencher a potência. Modelos novos entram em Ajustes.</p>':'')+'</section>';
 /* 2. Testes e fotos */
 h+='<section class="panel"><h2>2. Testes e fotos</h2><div class="g-testes">'+G.TESTES.map(([k,t])=>'<label class="check"><input type="checkbox" data-teste="'+k+'" '+(ch.testes[k]?'checked':'')+'> <b>'+k.slice(1)+'</b> '+esc(t)+'</label>').join('')+'</div>'+
  '<label class="check g-perda"><input type="checkbox" data-ch-bool="perdaGeracao" '+(ch.perdaGeracao?'checked':'')+'> Perda de geração confirmada nos testes (libera instalar um backup)</label>'+
  '<div class="settings-grid">'+field('Data da visita / abertura','data-data="abertura"',ch.datas.abertura,'date')+'</div>'+fotosHtml(ch)+'</section>';
 /* 3. Fabricante */
 h+='<section class="panel"><h2>3. Caso no fabricante</h2><div class="settings-grid">'+field('Nº do caso no portal da marca','data-ch="casoFabricante"',ch.casoFabricante)+field('Data de abertura do caso','data-data="caso"',ch.datas.caso,'date')+'</div><p class="hint">O dossiê em PDF para o fabricante (testes, fotos e QR do vídeo) entra na próxima parte.</p></section>';
 /* 4. Backup */
 h+='<section class="panel"><h2>4. Backup</h2>'+(ch.backupId?'<p>Backup instalado: <strong>'+esc(ch.serialBackup)+'</strong> em '+dataBr(ch.datas.backup)+'. Ele volta sozinho ao estoque na troca final.</p><div class="actions"><button class="ghost" data-action="retirar-backup">Desfazer (voltou ao estoque)</button></div>':
  !ch.perdaGeracao?'<p class="hint">Só quando a perda de geração foi confirmada nos testes (marque acima).</p>':
  disponiveis.length?'<div class="settings-grid"><label>Backup disponível<select id="g-backup-escolha">'+disponiveis.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.serial+' · '+(e.marca||'')+' '+(e.modelo||''))+'</option>').join('')+'</select></label>'+field('Data da instalação','id="g-backup-data"',G.hojeIso(),'date')+'</div><div class="actions"><button class="primary" data-action="instalar-backup">Instalar backup</button></div>':
  '<p class="hint">Nenhum backup disponível. <a href="#estoque">Cadastrar no estoque</a></p>')+'</section>';
 /* 5. Depósito */
 h+='<section class="panel"><h2>5. Peça no depósito</h2><div class="settings-grid">'+field('Data de retirada / chegada ao depósito','data-data="deposito"',ch.datas.deposito,'date')+'<label>Destino<select data-ch="destino"><option value="GARANTIA" '+(ch.destino==='GARANTIA'?'selected':'')+'>Garantia / RMA</option><option value="SUCATA" '+(ch.destino==='SUCATA'?'selected':'')+'>Sucata</option></select></label></div><p class="hint">A etiqueta da peça (térmica 100×50 mm e folha A4) entra na próxima parte.</p></section>';
 /* 6. Troca final */
 h+='<section class="panel"><h2>6. Troca final</h2>'+(ch.datas.conclusao?'<p>Troca concluída em '+dataBr(ch.datas.conclusao)+'. Serial novo ativo na usina: <strong>'+esc(ch.serialNovo)+'</strong>.'+(ch.serialBackup?' O backup '+esc(ch.serialBackup)+' voltou ao estoque.':'')+'</p>':
  '<div class="settings-grid">'+field('Serial do equipamento novo (garantia)','id="g-serial-novo"','','text','inputmode="numeric" autocomplete="off" placeholder="12 a 15 dígitos"')+field('Data da troca','id="g-troca-data"',G.hojeIso(),'date')+'</div><div class="actions"><button class="primary" data-action="concluir-troca">Concluir troca</button></div><p class="hint">O serial novo fica ativo na usina e o backup, se houver, volta ao estoque.</p>')+'</section>';
 /* 7. Ressarcimento */
 h+='<section class="panel"><h2>Ressarcimento da energia perdida</h2><div class="settings-grid">'+
  field('Fator de geração (kWh/kWp/dia)','data-ch="fator"',val(ch.fator),'text','inputmode="decimal" placeholder="'+esc(val(G.num(us&&us.fator)??data.config.fatorPadrao))+' (da usina)"')+
  field('Tarifa (R$/kWh)','data-ch="tarifa"',val(ch.tarifa),'text','inputmode="decimal" placeholder="'+esc(us&&us.tarifa!=null?val(us.tarifa)+' (da usina)':'ex.: 1,15')+'"')+
  field('Carência (dias)','data-ch="carenciaDias"',val(ch.carenciaDias),'text','inputmode="numeric" placeholder="'+esc(String(data.config.carenciaDias))+'"')+'</div>'+
  '<div class="metrics g-metrics">'+[['Perda por dia',r.perdaDia===null?'—':G.fmt(r.perdaDia,2)+' kWh'],['Dias parados',r.parados===null?'—':String(r.parados)+(r.emAberto?' (até hoje)':'')],['Dias indenizáveis',r.diasIndenizaveis===null?'—':String(r.diasIndenizaveis)],['A receber',brl(r.valor)]].map(([k,v])=>'<div class="metric"><span>'+k+'</span><strong>'+v+'</strong></div>').join('')+'</div>'+
  '<p class="hint">'+(r.faltam.length?'Falta: '+esc(r.faltam.join(', '))+'. ':'')+(r.valor!==null?esc(r.diasIndenizaveis+' dias × '+G.fmt(r.perdaDia,2)+' kWh × R$ '+G.fmt(r.tarifa,4)+' = '+brl(r.valor)+'. '):'')+'A perda conta da abertura '+(r.ateBackup?'até a instalação do backup':'até a troca final')+', menos a carência (muda em Ajustes).</p></section>';
 h+='<section class="panel"><h2>Observações</h2><label>Anotações internas<textarea data-ch="observacoes" rows="3">'+esc(ch.observacoes)+'</textarea></label><div class="actions"><button class="danger" data-action="excluir-chamado">Excluir chamado</button></div></section>';
 host.innerHTML=h;carregarMiniaturas(ch);}

/* ---------- Fotos (só fotos, sem vídeo: decisão de 20/11/2026) ----------
   Ficam no armazenamento do Supabase, pasta privada "solar-replacement", dentro da pasta da conta (id do usuário):
   ninguém mais vê. Cada foto é reduzida no aparelho antes de enviar (cerca de 100 a 300 KB). */
const BUCKET='solar-replacement',MAX_FOTOS=20,urlsFotos=new Map();let enviandoFotos=false;
const TIPOS_FOTO={foto:'Foto do equipamento',print:'Print do monitoramento'};
function fotosHtml(ch){const fotos=ch.fotos||[];
 return '<div class="g-fotos"><h3>Fotos e print do monitoramento <span class="tiny">('+fotos.length+' de '+MAX_FOTOS+')</span></h3>'+
  '<p class="hint">Fotos do equipamento, da etiqueta com o serial, dos LEDs de erro e o print da tela do monitoramento (usina, ID e serial). Elas vão para o dossiê do fabricante.</p>'+
  '<div class="actions"><label class="file-button primary">Tirar foto ou escolher<input type="file" accept="image/*" capture="environment" multiple data-fotos-tipo="foto" hidden></label><label class="file-button">Print do monitoramento<input type="file" accept="image/*" multiple data-fotos-tipo="print" hidden></label></div>'+
  (enviandoFotos?'<p class="hint g-enviando">Enviando fotos…</p>':'')+
  (fotos.length?'<ul class="g-miniaturas">'+fotos.map(f=>'<li><img data-foto-img="'+esc(f.id)+'" alt="'+esc(TIPOS_FOTO[f.tipo]||'Foto')+'"'+(urlsFotos.has(f.path)?' src="'+esc(urlsFotos.get(f.path))+'"':'')+'><span class="tiny">'+esc(TIPOS_FOTO[f.tipo]||'Foto')+'</span><button type="button" class="ghost" data-action="apagar-foto" data-foto="'+esc(f.id)+'" aria-label="Apagar esta foto">Apagar</button></li>').join('')+'</ul>':'<p class="muted">Nenhuma foto ainda.</p>')+'</div>';}
async function carregarMiniaturas(ch){if(!ch||!db)return;const falta=(ch.fotos||[]).filter(f=>!urlsFotos.has(f.path)).map(f=>f.path);if(!falta.length)return;
 try{const r=await db.storage.from(BUCKET).createSignedUrls(falta,3600);if(r.error)throw r.error;for(const it of r.data||[])if(it.signedUrl)urlsFotos.set(it.path,it.signedUrl);
  for(const f of ch.fotos||[]){const img=document.querySelector('[data-foto-img="'+CSS.escape(f.id)+'"]');if(img&&urlsFotos.has(f.path))img.src=urlsFotos.get(f.path);}}catch(e){}}
/* Reduz a foto: lado maior até 1600 px, JPEG 0,72. Fotos de celular de 3-5 MB viram cerca de 150 a 300 KB. */
async function reduzirFoto(file){const url=URL.createObjectURL(file);try{const img=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(Error('Não foi possível abrir a imagem '+file.name+'.'));i.src=url;});
 const k=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*k);c.height=Math.round(img.naturalHeight*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
 return await new Promise((ok,no)=>c.toBlob(b=>b?ok(b):no(Error('Não foi possível reduzir a imagem.')),'image/jpeg',0.72));}finally{URL.revokeObjectURL(url);}}
async function enviarFotos(files,tipo){const ch=chamadoById(sel.chamado);if(!ch||!files.length||!user)return;if(enviandoFotos){notify('Aguarde o envio das fotos anteriores.','warn');return;}
 const livres=MAX_FOTOS-(ch.fotos||[]).length;if(livres<=0){notify('Este chamado já tem '+MAX_FOTOS+' fotos. Apague alguma antes de enviar mais.','warn');return;}
 const lista=files.slice(0,livres);enviandoFotos=true;render();let ok=0;const erros=[];
 for(const [i,file] of lista.entries()){notify('Enviando foto '+(i+1)+' de '+lista.length+'…','warn');try{if(!/^image\//.test(file.type))throw Error(file.name+' não é uma imagem.');const blob=await reduzirFoto(file),id=G.uid(),path=user.id+'/'+ch.id+'/'+id+'.jpg';
  const r=await timeout(db.storage.from(BUCKET).upload(path,blob,{contentType:'image/jpeg',upsert:false}),60000);if(r.error)throw r.error;
  ch.fotos=ch.fotos||[];ch.fotos.push({id,path,tipo,nome:file.name,bytes:blob.size,criadoEm:new Date().toISOString()});ok++;}catch(e){erros.push(/bucket|not found/i.test(e.message||'')?'o espaço de fotos ainda não foi criado no Supabase':(e.message||'falha no envio'));}}
 enviandoFotos=false;if(ok)mudou();else render();
 if(erros.length)notify((ok?ok+' foto(s) enviada(s). ':'')+'Não foi possível enviar '+erros.length+': '+[...new Set(erros)].join('; ')+'.','error');else notify(ok===1?'Foto enviada.':ok+' fotos enviadas.');}
async function apagarFotos(paths){if(!paths.length||!db)return;try{await db.storage.from(BUCKET).remove(paths);}catch(e){}for(const p of paths)urlsFotos.delete(p);}

function renderUsinas(){const host=document.querySelector('[data-page=usinas]'),us=usinaById(sel.usina);
 let h='<div class="panel"><div class="section-title"><h2><svg class="igi" width="22" height="22" aria-hidden="true"><use href="/assets/icons/sprite.svg?v=1.10.56#usina"/></svg> Usinas</h2><button class="primary" data-action="nova-usina">+ Nova usina</button></div>'+(data.usinas.length?'<div class="table-wrap"><table class="g-table"><thead><tr><th>ID no monitoramento</th><th>Usina / cliente</th><th>kWp</th><th>Fator</th><th>Tarifa</th><th>Chamados</th></tr></thead><tbody>'+data.usinas.map(u=>'<tr data-usina-sel="'+esc(u.id)+'" class="g-linha'+(u.id===sel.usina?' ativa':'')+'"><td><strong>'+esc(u.idMonitoramento||'—')+'</strong></td><td>'+esc(u.nome||'—')+'<div class="tiny">'+esc(u.cliente||'')+'</div></td><td>'+G.fmt(G.num(u.kwp),2)+'</td><td>'+G.fmt(G.num(u.fator),2)+'</td><td>'+(u.tarifa!=null?'R$ '+G.fmt(G.num(u.tarifa),4):'—')+'</td><td>'+data.chamados.filter(c=>c.usinaId===u.id).length+'</td></tr>').join('')+'</tbody></table></div>':'<p class="muted">Nenhuma usina cadastrada. O ID no monitoramento (ex.: IOGO/EMA) é o que liga chamados, etiquetas e relatórios.</p>')+'</div>';
 if(us){const id='data-us-id="'+esc(us.id)+'"';h+='<section class="panel"><h2>'+esc(us.idMonitoramento||'Nova usina')+'</h2><div class="settings-grid">'+
  field('ID da usina no monitoramento','data-us="idMonitoramento" '+id,us.idMonitoramento,'text','placeholder="ex.: IOGO/EMA"')+field('Nome da usina','data-us="nome" '+id,us.nome)+field('Cliente','data-us="cliente" '+id,us.cliente)+field('Marca dos equipamentos','data-us="marca" '+id,us.marca,'text','placeholder="ex.: APsystems"')+
  field('Potência da usina (kWp)','data-us="kwp" '+id,val(us.kwp),'text','inputmode="decimal"')+field('Fator de geração (kWh/kWp/dia)','data-us="fator" '+id,val(us.fator),'text','inputmode="decimal" placeholder="'+esc(val(data.config.fatorPadrao))+' (padrão)"')+field('Tarifa (R$/kWh, com impostos)','data-us="tarifa" '+id,val(us.tarifa),'text','inputmode="decimal" placeholder="ex.: 1,15"')+
  '</div><p class="hint">Fator: geração média da usina por kWp por dia (ex.: 4,83). Tarifa: o preço do kWh da fatura do cliente. Os chamados desta usina usam esses valores, e cada chamado pode trocar.</p><div class="actions"><button class="danger" data-action="excluir-usina">Excluir usina</button></div></section>';}
 host.innerHTML=h;}

function renderEstoque(){const host=document.querySelector('[data-page=estoque]'),lista=data.equipamentos.slice().sort((a,b)=>(b.backup-a.backup)||String(a.status).localeCompare(b.status));
 host.innerHTML='<section class="panel"><h2>Cadastrar equipamento de backup</h2><div class="settings-grid">'+field('Serial (12 a 15 dígitos)','id="g-eq-serial"','','text','inputmode="numeric" autocomplete="off"')+
  '<label>Modelo<select id="g-eq-modelo">'+data.modelos.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.marca+' '+x.modelo)+'</option>').join('')+'</select></label></div><div class="actions"><button class="primary" data-action="novo-backup">Adicionar ao estoque</button></div></section>'+
  '<section class="panel"><h2>Equipamentos</h2>'+(lista.length?'<div class="table-wrap"><table class="g-table"><thead><tr><th>Serial</th><th>Modelo</th><th>Situação</th><th>Onde está</th><th></th></tr></thead><tbody>'+lista.map(e=>{const us=usinaById(e.usinaId),ch=chamadoById(e.chamadoId);return '<tr><td><strong>'+esc(e.serial)+'</strong>'+(e.backup?' <span class="g-pill e3">backup</span>':'')+'</td><td>'+esc((e.marca||'')+' '+(e.modelo||''))+'</td><td>'+esc(G.STATUS[e.status]||e.status)+'</td><td>'+esc(us?(us.idMonitoramento||us.nome):'Estoque')+(ch?'<div class="tiny">chamado nº '+ch.numero+'</div>':'')+'</td><td>'+(e.status==='BACKUP_DISPONIVEL'?'<button class="ghost" data-action="excluir-equipamento" data-eq="'+esc(e.id)+'">Excluir</button>':'')+'</td></tr>';}).join('')+'</tbody></table></div>':'<p class="muted">Nenhum equipamento ainda. Cadastre os backups que ficam no estoque para instalar em campo.</p>')+'</section>';}

function renderAjustes(){const host=document.querySelector('[data-page=ajustes]'),c=data.config;
 host.innerHTML='<section class="panel"><h2>Regras do ressarcimento</h2><div class="settings-grid">'+field('Carência (dias)','data-cfg="carenciaDias"',val(c.carenciaDias),'text','inputmode="numeric"')+
  '<label>Até quando conta a perda<select data-cfg="contarAte"><option value="backup" '+(c.contarAte!=='troca'?'selected':'')+'>Até a instalação do backup (padrão; sem backup, até a troca final)</option><option value="troca" '+(c.contarAte==='troca'?'selected':'')+'>Até a troca final, mesmo com backup instalado</option></select></label>'+
  field('Fator de geração padrão (kWh/kWp/dia)','data-cfg="fatorPadrao"',val(c.fatorPadrao),'text','inputmode="decimal"')+'</div><p class="hint">Valem para todos os chamados que não têm valor próprio. Padrão definido em 20/11/2026: carência de 30 dias para todos e perda contada até a instalação do backup, quando a usina volta a gerar.</p></section>'+
  '<section class="panel"><div class="section-title"><h2>Modelos de equipamento</h2><button data-action="novo-modelo">+ Modelo</button></div><p class="hint">A potência e o número de entradas preenchem a potência afetada no chamado (equipamento inteiro ou uma entrada).</p><div class="table-wrap"><table class="g-table g-modelos"><thead><tr><th>Marca</th><th>Modelo</th><th>Tipo</th><th>Potência (kW)</th><th>Entradas</th><th></th></tr></thead><tbody>'+
  data.modelos.map(m=>{const id='data-mod-id="'+esc(m.id)+'"';return '<tr><td><input data-mod="marca" '+id+' value="'+esc(m.marca)+'" aria-label="Marca"></td><td><input data-mod="modelo" '+id+' value="'+esc(m.modelo)+'" aria-label="Modelo"></td><td><select data-mod="tipo" '+id+' aria-label="Tipo">'+Object.entries(G.TIPOS).map(([k,t])=>'<option value="'+k+'" '+(m.tipo===k?'selected':'')+'>'+t+'</option>').join('')+'</select></td><td><input data-mod="potenciaKw" '+id+' inputmode="decimal" value="'+esc(val(m.potenciaKw))+'" aria-label="Potência em kW"></td><td><input data-mod="entradas" '+id+' inputmode="numeric" value="'+esc(val(m.entradas))+'" aria-label="Entradas"></td><td><button class="ghost" data-action="excluir-modelo" data-mod-id="'+esc(m.id)+'">Excluir</button></td></tr>';}).join('')+'</tbody></table></div></section>';}

/* ---------- Mudanças ---------- */
const NUM_CH=new Set(['potenciaAfetadaKw','fator','tarifa','carenciaDias']),NUM_US=new Set(['kwp','fator','tarifa']),NUM_MOD=new Set(['potenciaKw','entradas']),NUM_CFG=new Set(['carenciaDias','fatorPadrao']);
function aviseNumero(t,v){if(t.value.trim()&&v===null){notify('Número inválido: '+t.value+'. Use, por exemplo, 1,25.','warn');if(window.IGFalta)IGFalta.marcar(t,'Número inválido.');return true;}return false;}
document.addEventListener('change',e=>{const t=e.target;if(!store)return;const ch=chamadoById(sel.chamado);
 if(t.dataset.ch!==undefined&&ch){const k=t.dataset.ch;if(NUM_CH.has(k)){const v=G.num(t.value);if(aviseNumero(t,v))return;ch[k]=v;}else ch[k]=t.value.trim();
  if(k==='modeloId'){const m=modeloById(t.value);if(m){ch.marca=m.marca;ch.modelo=m.modelo;ch.tipo=m.tipo;ch.potenciaKw=G.num(m.potenciaKw);if(ch.potenciaAfetadaKw===null)ch.potenciaAfetadaKw=ch.potenciaKw;if(!ch.fabricante)ch.fabricante=m.marca;}}
  if(k==='casoFabricante'&&ch.casoFabricante&&!ch.datas.caso)ch.datas.caso=G.hojeIso();
  mudou();return;}
 if(t.dataset.chBool!==undefined&&ch){ch[t.dataset.chBool]=t.checked;mudou();return;}
 if(t.dataset.teste!==undefined&&ch){ch.testes[t.dataset.teste]=t.checked;mudou();return;}
 if(t.dataset.data!==undefined&&ch){ch.datas[t.dataset.data]=t.value||null;mudou();return;}
 if(t.dataset.us!==undefined){const us=usinaById(t.dataset.usId);if(!us)return;const k=t.dataset.us;if(NUM_US.has(k)){const v=G.num(t.value);if(aviseNumero(t,v))return;us[k]=v;}else us[k]=t.value.trim();mudou();return;}
 if(t.dataset.mod!==undefined){const m=modeloById(t.dataset.modId);if(!m)return;const k=t.dataset.mod;if(NUM_MOD.has(k)){const v=G.num(t.value);if(aviseNumero(t,v))return;m[k]=k==='entradas'?Math.max(1,Math.round(v||1)):v;}else m[k]=t.value.trim();mudou();return;}
 if(t.dataset.cfg!==undefined){const k=t.dataset.cfg;if(NUM_CFG.has(k)){const v=G.num(t.value);if(aviseNumero(t,v))return;data.config[k]=v;}else data.config[k]=t.value;mudou();return;}});
$('side-search').addEventListener('input',renderSide);
document.querySelector('.side-switch').addEventListener('click',e=>{const b=e.target.closest('[data-side-mode]');if(!b||!store)return;sideMode=b.dataset.sideMode;$('side-search').value='';
 const destino={chamados:tab()==='chamado'?'chamado':'painel',usinas:'usinas',estoque:'estoque'}[sideMode];if(tab()!==destino)location.hash=destino;else render();});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.sideFiltro){sideFiltro[t.dataset.sideFiltro]=t.value;renderSide();}});
document.addEventListener('toggle',e=>{if(e.target&&e.target.classList&&e.target.classList.contains('side-filters-box'))$('side-filters').dataset.aberto=e.target.open?'1':'0';},true);
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.fotosTipo){const files=[...t.files];t.value='';enviarFotos(files,t.dataset.fotosTipo);}});

document.addEventListener('click',e=>{if(!store)return;
 const ab=e.target.closest('[data-abrir]');if(ab){sel.chamado=ab.dataset.abrir;if(tab()!=='chamado')location.hash='chamado';else render();window.scrollTo({top:0});return;}
 const us=e.target.closest('[data-usina-sel]');if(us){sel.usina=us.dataset.usinaSel;render();return;}
 const su=e.target.closest('[data-side-usina]');if(su){sel.usina=su.dataset.sideUsina;if(tab()!=='usinas')location.hash='usinas';else render();return;}
 const se=e.target.closest('[data-side-estoque]');if(se){if(tab()!=='estoque')location.hash='estoque';else render();return;}
 if(e.target.closest('[data-side-limpar]')){sideFiltro.situacao='andamento';sideFiltro.ordem='recentes';renderSide();return;}
 const pot=e.target.closest('[data-potencia]');if(pot){const ch=chamadoById(sel.chamado),m=ch&&modeloById(ch.modeloId);if(!ch)return;ch.potenciaAfetadaKw=pot.dataset.potencia==='total'?G.num(ch.potenciaKw):G.potenciaPorEntrada(m);mudou();return;}
 const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,ch=chamadoById(sel.chamado);
 try{
  if(a==='novo-chamado'){novoChamado();return;}
  if(a==='apagar-foto'&&ch){const f=(ch.fotos||[]).find(x=>x.id===b.dataset.foto);if(!f||!confirm('Apagar esta foto do chamado?'))return;ch.fotos=ch.fotos.filter(x=>x.id!==f.id);apagarFotos([f.path]);notify('Foto apagada.');mudou();return;}
  if(a==='nova-usina'){e.preventDefault();const u=G.usina();data.usinas.push(u);sel.usina=u.id;if(tab()!=='usinas')location.hash='usinas';mudou();setTimeout(()=>document.querySelector('[data-us="idMonitoramento"]')?.focus(),60);return;}
  if(a==='excluir-usina'){const u=usinaById(sel.usina);if(!u)return;if(data.chamados.some(c=>c.usinaId===u.id)){notify('Esta usina tem chamados. Exclua ou troque a usina dos chamados antes.','warn');return;}if(!confirm('Excluir a usina '+(u.idMonitoramento||u.nome||'')+'?'))return;data.usinas=data.usinas.filter(x=>x.id!==u.id);sel.usina=data.usinas[0]?.id||null;mudou();return;}
  if(a==='instalar-backup'&&ch){G.instalarBackup(data,ch.id,$('g-backup-escolha').value,$('g-backup-data').value||G.hojeIso());notify('Backup instalado. Ele volta sozinho ao estoque na troca final.');mudou();return;}
  if(a==='retirar-backup'&&ch){G.retirarBackup(data,ch.id);notify('Backup devolvido ao estoque.');mudou();return;}
  if(a==='concluir-troca'&&ch){const s=$('g-serial-novo');if(!G.serialValido(s.value)){if(window.IGFalta)IGFalta.marcar(s,'Informe o serial novo, de 12 a 15 dígitos.');return;}G.concluirTroca(data,ch.id,s.value,$('g-troca-data').value||G.hojeIso());notify('Troca concluída. Serial novo ativo na usina'+(ch.serialBackup?' e backup de volta ao estoque.':'.'));mudou();return;}
  if(a==='excluir-chamado'&&ch){if(!confirm('Excluir o chamado nº '+ch.numero+'?'))return;if(ch.backupId)G.retirarBackup(data,ch.id);apagarFotos((ch.fotos||[]).map(f=>f.path));data.chamados=data.chamados.filter(x=>x.id!==ch.id);sel.chamado=data.chamados[0]?.id||null;notify('Chamado excluído.');mudou();return;}
  if(a==='novo-backup'){const s=$('g-eq-serial'),m=modeloById($('g-eq-modelo').value);if(!G.serialValido(s.value)){if(window.IGFalta)IGFalta.marcar(s,'Informe o serial, de 12 a 15 dígitos.');return;}const sn=G.soSerial(s.value);if(data.equipamentos.some(x=>G.soSerial(x.serial)===sn)){notify('Este serial já está cadastrado.','warn');return;}
   data.equipamentos.push(G.equipamento({serial:sn,backup:true,status:'BACKUP_DISPONIVEL',tipo:m?.tipo||'MICROINVERSOR',marca:m?.marca||'',modelo:m?.modelo||'',potenciaKw:G.num(m?.potenciaKw)}));notify('Backup '+sn+' adicionado ao estoque.');mudou();return;}
  if(a==='excluir-equipamento'){const eq=data.equipamentos.find(x=>x.id===b.dataset.eq);if(!eq||!confirm('Excluir o equipamento '+eq.serial+' do estoque?'))return;data.equipamentos=data.equipamentos.filter(x=>x.id!==eq.id);mudou();return;}
  if(a==='novo-modelo'){data.modelos.push(G.modelo({marca:'',modelo:'',entradas:1}));mudou();return;}
  if(a==='excluir-modelo'){const id=b.dataset.modId;if(data.chamados.some(c=>c.modeloId===id)){notify('Há chamados com este modelo. Troque o modelo nos chamados antes.','warn');return;}data.modelos=data.modelos.filter(x=>x.id!==id);mudou();return;}
 }catch(err){notify(err.message,'error');}});
function novoChamado(){if(!store)return;const ch=G.chamado(data,{usinaId:sel.usina&&usinaById(sel.usina)?sel.usina:(data.usinas.length===1?data.usinas[0].id:null)});data.chamados.push(ch);sel.chamado=ch.id;if(tab()!=='chamado')location.hash='chamado';mudou();notify('Chamado nº '+ch.numero+' aberto.');}
$('side-new').onclick=()=>{if(!store)return;if(sideMode==='usinas'){const u=G.usina();data.usinas.push(u);sel.usina=u.id;if(tab()!=='usinas')location.hash='usinas';mudou();setTimeout(()=>document.querySelector('[data-us="idMonitoramento"]')?.focus(),60);return;}
 if(sideMode==='estoque'){if(tab()!=='estoque')location.hash='estoque';setTimeout(()=>$('g-eq-serial')?.focus(),60);return;}novoChamado();};
$('save').onclick=()=>{if(!store)return;clearTimeout(salvarTimer);salvo('Salvando…');gravar();};$('retry').onclick=boot;$('notice').onclick=()=>{clearTimeout(noticeTimer);$('notice').textContent='';};
window.addEventListener('hashchange',render);
boot();
})();
