/* UI and adapters adapted from the IG Base / Solar Organization patterns. */
(function(){
'use strict';
const E=SolarBudget,$=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>x===null||x===undefined?'Não informado':Number(x).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const amount=x=>x===null||x===undefined?'':Number(x).toLocaleString('pt-BR',{maximumFractionDigits:6,useGrouping:false});
let companyService=null,archiveService=null;
let db=null,user=null,data=E.fresh(),history=[],review=null,busy=false,dirty=false,cloud=false,cloudError='',cloudVersions={},documentSnapshot=null,sessionGeneration=0,renderDepth=0,renderQueued=false;
let documentOptions={kind:'cart'},previewGeneration=0;
function queueRender(){if(!renderQueued){renderQueued=true;setTimeout(()=>{renderQueued=false;render();},0);}}
const key=()=> 'igbase:solar-budget:v1:'+user.id;
const notify=(msg,type='success')=>{$('notice').className=type;$('notice').textContent=msg;};
function timeout(p,ms=20000){let timer;return Promise.race([p,new Promise((_,r)=>timer=setTimeout(()=>r(Error('Tempo de conexão excedido. Tente novamente.')),ms))]).finally(()=>clearTimeout(timer));}
async function lib(name,urls,test){if(test())return;for(const url of urls){try{await timeout(new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=()=>test()?resolve():reject(Error('Biblioteca inválida'));s.onerror=reject;document.head.append(s);}));return;}catch(e){}}throw Error('Não foi possível carregar '+name+'. Confira sua conexão e tente novamente.');}
async function boot(){
 $('loading').hidden=false;$('auth').hidden=true;$('workspace').hidden=true;
 try{
  await lib('a conexão IG Base',['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js','https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'],()=>!!window.supabase?.createClient);
  if(!db){db=window.supabase.createClient('https://zhkolwskpqhlovvdrbmv.supabase.co','sb_publishable_3bqhMMM6CndF6MKl5N1FoA_GaS_mq7E');db.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')activate(null);else if((event==='SIGNED_IN'||event==='TOKEN_REFRESHED')&&session?.user?.id!==user?.id)setTimeout(()=>{if(session?.user?.id!==user?.id)activate(session?.user);},0);});}
  const r=await timeout(db.auth.getSession());if(r.error)throw r.error;await activate(r.data.session?.user||null);
 }catch(e){$('loading').hidden=true;$('auth').hidden=false;notify(e.message,'error');}
}
async function activate(next){
 const generation=++sessionGeneration;documentSnapshot=null;for(const id of ['preview-dialog','review-dialog'])if($(id).open)$(id).close();$('document').innerHTML='';$('history').innerHTML='';$('sources').innerHTML='';$('preview-company').innerHTML='';$('company-settings').innerHTML='';$('company-quote').innerHTML='';user=next;review=null;history=[];data=E.fresh();cloud=false;cloudVersions={};dirty=false;
 $('account').textContent=user?.user_metadata?.username||'Usuário';companyService=null;archiveService=null;$('archive-page').hidden=true;$('settings-page').hidden=true;$('logout').hidden=!user;$('loading').hidden=true;$('auth').hidden=!!user;$('workspace').hidden=!user;
 if(!user)return;
 try{
  const raw=localStorage.getItem(key());if(raw){const parsed=JSON.parse(raw);data=E.validate(parsed.draft);if(!Array.isArray(parsed.history))throw Error('Histórico local inválido.');history=parsed.history.map(h=>({...h,data:E.validate(h.data)}));}
 }catch(e){$('workspace').hidden=true;notify('Não foi possível ler o armazenamento local. Seus dados não foram substituídos. '+e.message,'error');return;}
 render();
 try{companyService=IGCompanies.service(db,user);await timeout(companyService.load());if(generation!==sessionGeneration)return;const preferred=companyService.selected('solar-budget');if(preferred&&!data.doc.companySnapshot){data.doc.companySnapshot=preferred;data.doc.companyId=preferred.id;}renderCompanies();}catch(e){companyService=null;notify(e.message,'warn');}
 try{const profile=await timeout(db.from('perfis_usuario').select('username').eq('user_id',user.id).maybeSingle());if(generation!==sessionGeneration)return;$('account').textContent=profile.data?.username||user.user_metadata?.username||'Usuário';$('settings-user').textContent=$('account').textContent;}catch(e){}
 await connectArchive(generation);
}
async function connectArchive(generation=sessionGeneration){
 const owner=user?.id;if(!owner)return;
 try{const store=IGBudgetArchive.service(db,user);await timeout(store.load());if(generation!==sessionGeneration||user?.id!==owner)return;
  const candidates=E.clone(history);try{const old=await timeout(db.from('solar_budget_cotacoes').select('id,data,updated_at').eq('user_id',owner).order('updated_at',{ascending:false}));if(!old.error)for(const row of old.data||[])candidates.push(row.data);}catch(e){}
  if(generation!==sessionGeneration||user?.id!==owner)return;
  const existing=store.records,missing=candidates.filter(h=>!existing.some(x=>x.id===h.id&&x.savedAt===h.savedAt||x.legacyOrigin===(h.legacyOrigin||h.id+':'+h.savedAt)));if(missing.length)await timeout(store.importHistory(missing));
  if(generation!==sessionGeneration||user?.id!==owner)return;archiveService=store;history=store.records;cloud=true;cloudError='';try{persistLocal();}catch(e){}renderHistory();renderMode();
 }catch(e){if(generation!==sessionGeneration||user?.id!==owner)return;cloud=false;archiveService=null;cloudError=e.message;renderMode();notify('Arquivo da conta não sincronizado: '+e.message+'. Os dados locais foram preservados.','warn');}
}
function renderMode(){const text=cloud?'Arquivo conectado à sua conta. Cotações e PDFs salvos disponíveis entre dispositivos. Alterações ainda não salvas permanecem neste navegador.':'Arquivo da conta indisponível. Seus dados locais estão preservados, mas ainda não foram sincronizados. '+cloudError;$('storage-mode').textContent=text;$('archive-status').textContent=text;}

function persistLocal(){if(!user)return;localStorage.setItem(key(),JSON.stringify({draft:data,history:cloud?[]:history,archiveManifest:cloud?history.map(h=>({id:h.id,savedAt:h.savedAt,status:h.status,client:h.data.client?.nome,name:h.data.name})):undefined}));}
function touch(){dirty=true;data.updatedAt=new Date().toISOString();try{persistLocal();}catch(e){notify('Não foi possível salvar o rascunho neste navegador. Exporte um backup. '+e.message,'error');}renderResults();}
function inputField(value,field,attrs=''){return '<input '+attrs+' data-field="'+field+'" value="'+esc(typeof value==='number'?amount(value):value)+'">';}
function unitOptions(value){return ['','un','m','kg','l','conj','barra','rolo','pacote','caixa','kit'].map(u=>'<option '+(u===value?'selected':'')+' value="'+u+'">'+(u||'Revisar')+'</option>').join('');}
function itemTable(items,context='list'){
 return '<div class="table-wrap"><table><thead><tr><th>Material / especificação</th><th>Quantidade necessária</th><th>Unidade</th><th>Conferido</th><th></th></tr></thead><tbody>'+items.map(i=>'<tr data-item="'+i.id+'" data-context="'+context+'"><td>'+inputField(i.description,'description','class="description" aria-label="Material"')+'<div class="tiny">'+esc(i.source||'Inclusão manual')+'</div>'+ (i.note?'<div class="tiny">'+esc(i.note)+'</div>':'')+'</td><td>'+inputField(i.qty,'qty','inputmode="decimal" aria-label="Quantidade necessária"')+'</td><td><select data-field="unit" aria-label="Unidade">'+unitOptions(i.unit)+'</select></td><td><label class="check"><input type="checkbox" data-field="confirmed" '+(i.confirmed?'checked':'')+'>Confirmado</label></td><td><button data-action="remove-item" class="remove danger" aria-label="Remover material">×</button></td></tr>').join('')+'</tbody></table></div>';
}
function offerTable(offers,supplierId,context='offer'){
 return '<div class="table-wrap"><table><thead><tr><th>Descrição original</th><th>Material solicitado / associação</th><th>Qtd. cotada</th><th>Preço por unidade de venda</th><th>Total cotado</th><th>Unidade atendida</th><th>Conteúdo por embalagem</th><th>Estoque confirmado (vendas)</th><th>Mínimo</th><th>Fracionável</th><th>Confirmar</th><th></th></tr></thead><tbody>'+offers.map(o=>{
  const suggestions=E.suggest(o,data.items,data.aliases),guess=suggestions[0];
  const alerts=E.offerIssues(o);const linked=data.items.find(i=>i.id===o.itemId);if(linked){const sr=E.specReview(o,linked);alerts.push(...sr.conflicts,...sr.missing);}if(E.pricing(o).rounding)alerts.push('Arredondamento compatível: custo proporcional ao subtotal original.');if(guess?.conflict)alerts.push('Possível diferença de especificação.');
  return '<tr data-offer="'+o.id+'" data-supplier="'+supplierId+'" data-context="'+context+'"><td>'+inputField(o.description,'description','class="description" aria-label="Descrição da oferta"')+'<div class="tiny">'+esc(o.source||'Inclusão manual')+'</div>'+alerts.map(a=>'<div class="warn">'+esc(a)+'</div>').join('')+'<details><summary>Observações, cálculo e kit</summary><label>Base do cálculo<select data-field="priceBasis"><option value="unit">Preço unitário (subtotal em arredondamentos)</option><option value="subtotal" '+(o.priceBasis==='subtotal'?'selected':'')+'>Subtotal original ÷ quantidade cotada (conferido)</option></select></label><label>Limite de quantidade desta cotação'+inputField(o.quoteLimit,'quoteLimit','inputmode="decimal"')+'</label><p class="tiny">Limite cotado não comprova estoque. Para comprar além dele, confirme com a loja.</p><label>Observação'+inputField(o.note,'note')+'</label><label>Componentes do kit (uma linha por material: nome; quantidade; unidade)<textarea data-field="componentsText" rows="3" placeholder="Cabo preto 10 mm²; 100; m">'+esc((o.components||[]).map(c=>{const i=data.items.find(i=>i.id===c.itemId);return (i?.description||'Material removido')+'; '+amount(c.qty)+'; '+c.unit;}).join('\n'))+'</textarea></label><p class="tiny">Componentes precisam corresponder exatamente a nomes da lista. Kits entram por seleção manual, com custo registrado uma vez.</p><label>Embalagens do kit a comprar'+inputField(o.bundleBuy??1,'bundleBuy','inputmode="decimal"')+'</label><label class="check"><input type="checkbox" data-field="selectedBundle" '+(data.bundles.includes(o.id)?'checked':'')+'>Incluir este kit no carrinho</label></details></td><td><select class="association" data-field="itemId" aria-label="Material associado"><option value="">Sem associação / kit</option>'+data.items.map(i=>'<option value="'+i.id+'" '+(o.itemId===i.id?'selected':'')+'>'+esc(i.description)+'</option>').join('')+'</select>'+(guess&&!o.itemId?'<div class="tiny">Sugestão: '+esc(guess.description)+(guess.conflict?' · conferir especificações':'')+'</div><button data-action="suggest" data-match="'+guess.id+'">Usar sugestão</button>':'')+'</td><td>'+inputField(o.quotedQty,'quotedQty','inputmode="decimal" aria-label="Quantidade cotada"')+'</td><td>'+inputField(o.price,'price','inputmode="decimal" aria-label="Preço unitário"')+'</td><td>'+inputField(o.quotedTotal,'quotedTotal','inputmode="decimal" aria-label="Total cotado"')+'</td><td><select data-field="unit" aria-label="Unidade de referência">'+unitOptions(o.unit)+'</select></td><td>'+inputField(o.pack,'pack','inputmode="decimal" aria-label="Conteúdo por embalagem"')+'</td><td>'+inputField(o.stock,'stock','inputmode="decimal" aria-label="Disponibilidade"')+'<div class="tiny">Vazio: estoque não informado</div></td><td>'+inputField(o.min,'min','inputmode="decimal" aria-label="Mínimo de compra"')+'</td><td><input type="checkbox" data-field="divisible" aria-label="Venda fracionada" '+(o.divisible?'checked':'')+'></td><td><label class="check"><input type="checkbox" data-field="confirmed" '+(o.confirmed?'checked':'')+'>Confirmado</label><label class="check"><input type="checkbox" data-field="rejected" '+(o.rejected?'checked':'')+'>Rejeitado</label></td><td><button class="remove danger" data-action="remove-offer" aria-label="Remover oferta">×</button></td></tr>';
 }).join('')+'</tbody></table></div>';
}
function render(){
 if(renderDepth){queueRender();return;}renderDepth++;try{
 $('quote-name').value=data.name;data.client=data.client||{};for(const k of ['nome','documento','contato','email','telefone','endereco','projeto'])$('client-'+k).value=data.client[k]||'';renderCompanies();$('cart-mode').value=data.cartMode||'combined';$('single-supplier-label').hidden=data.cartMode!=='single';$('single-supplier').innerHTML='<option value="">Escolha o fornecedor</option>'+data.suppliers.map(s=>'<option value="'+s.id+'" '+(s.id===data.singleSupplierId?'selected':'')+'>'+esc(s.name)+'</option>').join('');
 $('list-count').textContent=data.items.length+' materiais';$('list-review').innerHTML=data.items.length?itemTable(data.items):'<div class="empty">Sua lista de materiais aparecerá aqui.</div>';
 $('suppliers').innerHTML=data.suppliers.map(s=>'<article class="supplier" data-supplier="'+s.id+'"><div class="supplier-head"><label>Nome do fornecedor<input data-sfield="name" value="'+esc(s.name)+'"></label><button class="danger" data-action="remove-supplier">Remover fornecedor</button></div><div class="conditions"><label>Total informado'+inputField(s.reportedTotal,'reportedTotal','data-sfield="reportedTotal" inputmode="decimal"')+'</label><label>Frete (R$)'+inputField(s.freight,'freight','data-sfield="freight" inputmode="decimal"')+'</label><label>Desconto deste carrinho (R$)'+inputField(s.discount,'discount','data-sfield="discount" inputmode="decimal"')+'</label><label>Condições comerciais<input data-sfield="terms" value="'+esc(s.terms)+'"></label></div><p class="tiny">Desconto é o valor confirmado para o carrinho escolhido. Vazio significa condição não informada; zero confirma ausência de cobrança ou desconto.</p><details><summary>Importar cotação por arquivo ou texto</summary><div class="import-grid"><div><label>Arquivo<input type="file" data-source="file" accept=".pdf,.xlsx,.docx,.odt,.xls,.csv,.tsv,.txt"></label><label class="check"><input type="checkbox" data-source="ocr" checked>OCR nas páginas sem texto</label></div><label>Texto da cotação<textarea data-source="text" rows="5" placeholder="Material; Quantidade; Unidade; Preço unitário; Total&#10;Disjuntor 20A; 4; un; 7,50; 30,00"></textarea></label></div><div class="actions"><label>Como incorporar<select data-source="mode"><option value="append">Acrescentar ofertas</option><option value="replace">Substituir ofertas</option></select></label><button class="primary" data-action="read-offers">Ler e revisar</button></div></details><details '+(s.offers.length?'open':'')+'><summary>Revisar ofertas e associações ('+s.offers.length+')</summary>'+offerTable(s.offers,s.id)+'<button data-action="add-offer">Adicionar oferta</button><button data-action="confirm-clear-offers">Confirmar associações sem alertas</button></details></article>').join('')||'<div class="empty">Adicione dois ou mais fornecedores para comparar.</div>';
 renderMode();renderResults(true);renderHistory();renderSources();
 }finally{renderDepth--;}
}
function renderResults(internal=false){
 if(renderDepth&&internal!==true){queueRender();return E.calculate(data);}renderDepth++;try{
 const result=E.calculate(data),pending=result.results.filter(r=>r.invalid||r.missing>1e-8),count=result.results.length-pending.length;
 $('summary').innerHTML=[['Total selecionado',money(result.total)],['Materiais atendidos',count+' / '+data.items.length],['Fornecedores',data.suppliers.length],['Situação',result.complete?'Atendida':'Parcial / em revisão']].map(([k,v])=>'<div class="metric"><span>'+k+'</span><strong>'+esc(v)+'</strong></div>').join('');
 const search=E.norm($('search').value),filter=$('filter').value;
 const compared=new Map(SolarBudgetDocument.comparison(data,result).map(x=>[x.item.id,x]));
 const rows=result.results.filter(r=>(!search||E.norm(r.description).includes(search))&&(filter==='all'||(filter==='missing'?(!r.invalid&&r.missing>1e-8):filter==='pending'?(r.invalid||result.suppliers.some(s=>data.suppliers.find(x=>x.id===s.id).offers.some(o=>!o.confirmed&&!o.rejected&&o.itemId===r.itemId))):(!r.invalid&&r.missing<1e-8))));
 const supplierSummary=result.suppliers.map(s=>'<article class="cart"><h3>'+esc(s.name)+'</h3><div>Documento: <b>'+money(s.reported)+'</b></div><div>Soma importada: '+money(s.imported)+(s.unpriced?' · '+s.unpriced+' sem subtotal':'')+'</div>'+(s.totalMismatch?'<p class="warn">Total informado diverge da soma importada.</p>':'')+'<div>Custo dos materiais cobertos: <b>'+money(s.subtotal)+'</b></div>'+(s.coverage<data.items.length?'<p class="warn">Cotação incompleta: total sem cobertura equivalente.</p>':'')+'<div>Atendimento completo: '+s.coverage+' / '+data.items.length+'</div><div>Itens comuns aos fornecedores: '+money(s.commonSubtotal)+' ('+result.commonCount+' materiais)</div><div>Ofertas em revisão: '+s.pending+'</div><div class="selected-summary">Carrinho neste fornecedor: <b>'+money(result.carts.find(c=>c.supplierId===s.id)?.total)+'</b><div class="tiny">Materiais: '+money(result.carts.find(c=>c.supplierId===s.id)?.subtotal)+' · Frete: '+money(result.carts.find(c=>c.supplierId===s.id)?.freight)+' · Desconto: '+money(result.carts.find(c=>c.supplierId===s.id)?.discount)+'</div></div><details><summary>Faltantes e quantidades insuficientes</summary>'+(!s.missing.length&&!s.partial.length?'<p>Todos os materiais têm ofertas confirmadas.</p>':'<ul>'+s.missing.map(r=>'<li>'+esc(r.description)+' — não cotado / não confirmado</li>').join('')+s.partial.map(r=>'<li>'+esc(r.description)+' — faltam '+amount(r.missing)+'</li>').join('')+'</ul>')+'</details><p class="tiny">Cobertura por ofertas individuais. Kits selecionados são detalhados nos carrinhos.</p></article>').join('');
 $('comparison').innerHTML=(result.supplierCount<2?'<p class="warn">Adicione pelo menos dois fornecedores para uma comparação.</p>':'')+(result.conditionsMissing?'<p class="warn">O total usa somente fretes e descontos informados. Revise as condições dos fornecedores selecionados.</p>':'')+result.warnings.map(w=>'<p class="error">'+esc(w)+'</p>').join('')+'<div class="cart-grid">'+supplierSummary+'</div><div class="table-wrap"><table><thead><tr><th>Material solicitado</th><th>Necessidade</th>'+data.suppliers.map(s=>'<th>'+esc(s.name)+'</th>').join('')+'<th>Escolha</th><th>Atendimento / falta</th></tr></thead><tbody>'+rows.map(r=>{
 const i=data.items.find(i=>i.id===r.itemId),offers=data.suppliers.flatMap(s=>s.offers.filter(o=>!o.components.length).map(o=>({s,o,r:E.cost(o,i)}))).filter(x=>x.r.valid&&x.r.covered>0);
 return '<tr><td class="material-cell">'+esc(r.description)+(r.invalid?'<p class="warn">Confirme quantidade e unidade.</p>':'')+'</td><td>'+amount(r.qty)+' '+esc(r.unit)+'</td>'+result.suppliers.map(s=>{const row=s.rows.find(x=>x.itemId===r.itemId);const comp=compared.get(r.itemId);const supplier=data.suppliers.find(x=>x.id===s.id),pending=supplier.offers.some(o=>!o.confirmed&&!o.rejected&&o.itemId===r.itemId);if(!row?.valid)return '<td class="offer-comparison"><span class="status-missing">'+esc(row?.reviewState||(pending?'Em revisão':'Não identificado'))+'</span>'+(row?.original?'<div class="tiny">'+money(row.price)+' / venda · cotado '+amount(row.quotedQty)+'</div><details><summary>Oferta em revisão</summary>'+esc(SolarBudgetDocument.offerText(row,null)).replace(/\n/g,'<br>')+'</details>':'')+'</td>';const best=row.missing<1e-8&&row.total===comp.best;return '<td class="offer-comparison'+(best?' offer-best':'')+'"><strong>'+money(row.total)+'</strong><div class="tiny">'+money(row.price)+' / venda · comprar '+amount(row.buy)+'</div><div class="tiny">Conteúdo: '+amount(row.pack)+' '+esc(row.unit)+'/venda</div><span class="'+(row.missing>1e-8?'status-missing':'status-covered')+'">'+(row.missing>1e-8?'Parcial: faltam '+amount(row.missing):best?'Menor custo completo':'Atende à necessidade')+'</span><details><summary>Oferta e cálculo</summary>'+esc(SolarBudgetDocument.offerText(row,comp.best)).replace(/\n/g,'<br>')+'</details></td>';}).join('')+'<td><div class="tiny">Selecionado: '+esc(r.allocations.map(a=>data.suppliers.find(s=>s.id===a.supplierId)?.name).filter(Boolean).join(' + ')||(result.carts.some(c=>c.lines.some(l=>l.bundle&&l.components.some(p=>p.itemId===r.itemId)))?'Kit selecionado':'Nenhuma oferta'))+'</div><select '+(data.cartMode==='single'?'disabled ':'')+'data-choice="'+r.itemId+'" aria-label="Fornecedor escolhido"><option value="">Seleção automática</option><option value="none" '+(data.choices[r.itemId]==='none'?'selected':'')+'>Não comprar agora</option>'+offers.map(x=>'<option value="'+x.o.id+'" '+(data.choices[r.itemId]===x.o.id?'selected':'')+'>'+esc(x.s.name)+' · '+money(x.r.total)+'</option>').join('')+'</select>'+(data.choices[r.itemId]&&!['none',...offers.map(x=>x.o.id)].includes(data.choices[r.itemId])?'<p class="warn">Escolha anterior indisponível. Revise.</p>':'')+(r.tied?'<div class="tiny">Empate: alternativas no seletor.</div>':'')+'</td><td>'+(r.invalid?'Em revisão':r.missing>1e-8?'<span class="warn">Faltam '+amount(r.missing)+' '+esc(r.unit)+'</span>':'<span class="pill">Atendido</span>')+'</td></tr>';
 }).join('')+'</tbody></table></div>';
 $('carts').innerHTML=result.carts.map(c=>'<article class="cart"><h3>Carrinho · '+esc(c.name)+'</h3>'+(!c.lines.length?'<p class="muted">Nenhum material selecionado.</p>':'<details><summary>Ver materiais selecionados ('+c.lines.length+')</summary><div class="table-wrap"><table><thead><tr><th>Material</th><th>Comprar</th><th>Subtotal</th></tr></thead><tbody>'+c.lines.map(l=>'<tr><td class="material-cell">'+esc(l.description)+(l.original?'<div class="tiny">Loja: '+esc(l.original)+'</div>':'')+(l.bundle?'<div class="tiny">Kit · '+l.components.map(p=>esc(data.items.find(i=>i.id===p.itemId)?.description)+' ('+amount(p.qty*l.buy)+' '+esc(p.unit)+')').join(', ')+'</div>':'<div class="tiny">Atende '+amount(l.covered)+' '+esc(l.unit)+' · sobra '+amount(l.surplus)+' '+esc(l.unit)+'</div>')+'</td><td>'+amount(l.buy)+'<div class="tiny">'+money(l.price)+' / unidade de venda</div></td><td>'+money(l.total)+'</td></tr>').join('')+'</tbody></table></div><div>Materiais: '+money(c.subtotal)+'</div><div>Frete: '+money(c.freight)+'</div><div>Desconto: '+money(c.discount)+'</div><p class="cart-total">'+money(c.total)+'</p></details>')+'</article>').join('');
 return result;
 }finally{renderDepth--;}
}
function renderHistory(){const q=E.norm($('history-search').value),status=$('history-status').value;const rows=history.filter(h=>(status==='all'||status==='documents'?(status!=='documents'||h.documents?.length):h.status===status)&&(!q||E.norm([h.data.name,h.data.client?.nome,h.data.client?.projeto,...h.data.suppliers.map(s=>s.name)].join(' ')).includes(q))).sort((a,b)=>String(a.data.client?.nome||'').localeCompare(String(b.data.client?.nome||''),'pt-BR')||b.savedAt.localeCompare(a.savedAt));let group='';$('history').innerHTML=rows.map(h=>{const client=h.data.client?.nome||'Sem cliente informado',heading=client!==group?'<h3 class="archive-client">'+esc(client)+'</h3>':'';group=client;return heading+'<article class="history-row"><div class="history-meta"><strong>'+esc(h.data.name)+'</strong><span>'+esc(h.data.client?.projeto||'Projeto não informado')+'</span><span class="archive-version">'+new Date(h.savedAt).toLocaleString('pt-BR')+' · '+(h.status==='complete'?'Concluída':'Rascunho')+' · '+money(h.result.total)+'</span><span class="tiny">Fornecedores: '+esc(h.data.suppliers.map(s=>s.name).join(', ')||'Nenhum')+'</span><div class="saved-files">'+(h.documents||[]).flatMap((emission,ei)=>emission.files.map((file,fi)=>'<button data-history="'+esc(h.id)+'" data-emission="'+ei+'" data-file="'+fi+'" data-action="stored-pdf">'+esc(file.name)+' · '+file.pages+' pág.</button>')).join('')+'</div></div><div class="actions"><button data-history="'+esc(h.id)+'" data-action="open-history">Ver cotação / PDFs</button>'+(h.status==='draft'?'<button data-history="'+esc(h.id)+'" data-action="resume-history">Continuar rascunho</button>':'')+'<button data-history="'+esc(h.id)+'" data-action="duplicate">Usar como base</button>'+(h.documents?.length?'<button data-history="'+esc(h.id)+'" data-action="stored-zip">Baixar PDFs salvos</button>':'')+'</div></article>';}).join('')||'<p class="muted">Nenhum orçamento encontrado para estes filtros.</p>';}

function renderSources(){$('sources').innerHTML=data.sources.map(s=>'<details class="source"><summary>'+esc(s.name)+' · '+esc(s.kind)+' · '+new Date(s.at).toLocaleString('pt-BR')+'</summary><pre>'+esc(s.text)+'</pre></details>').join('')||'<p class="muted">Nenhuma fonte importada.</p>';}
async function pdfText(file,ocr){
 let pdfjs,last;
 for(const base of ['https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/legacy/build/','https://unpkg.com/pdfjs-dist@6.4.299/legacy/build/']){try{pdfjs=await timeout(import(base+'pdf.mjs'));pdfjs.GlobalWorkerOptions.workerSrc=base+'pdf.worker.mjs';break;}catch(e){last=e;}}
 if(!pdfjs)throw Error('Leitor PDF indisponível: '+last.message);
 const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,enableScripting:false,useSystemFonts:true});let worker;
 try{const pdf=await timeout(task.promise);if(pdf.numPages>50)throw Error('Importe no máximo 50 páginas por arquivo.');const pages=[];
  for(let n=1;n<=pdf.numPages;n++){
   notify('Lendo '+file.name+' · página '+n+' de '+pdf.numPages);
   const page=await pdf.getPage(n),content=await page.getTextContent();let lines=[],line=[],y=null;
   lines=SolarBudgetImport.geometryLines(content.items);let text=lines.map(l=>l.text).join('\n');const geometry={width:page.view[2]-page.view[0],height:page.view[3]-page.view[1],items:content.items};
   if(text.replace(/\s/g,'').length<20&&ocr){
    await lib('OCR',['https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js','https://unpkg.com/tesseract.js@7.0.0/dist/tesseract.min.js'],()=>!!window.Tesseract);
    worker=worker||await timeout(Tesseract.createWorker('por',1,{logger:m=>notify('OCR · página '+n+' · '+Math.round((m.progress||0)*100)+'%')}),90000);
    const viewport=page.getViewport({scale:1.7});if(viewport.width*viewport.height>14000000)throw Error('Página muito grande para OCR. Divida o documento.');const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;text=(await worker.recognize(canvas)).data.text;
   }
   if(!text.trim())pages.push('PÁGINA '+n+': SEM TEXTO RECONHECIDO — REVISAR');else pages.push({text,geometry});
  }return pages.map((p,i)=>({name:file.name+' · página '+(i+1),text:typeof p==='string'?p:p.text,geometry:p.geometry||{width:0,items:[]}}));
 }finally{if(worker)await worker.terminate();await task.destroy();}
}
async function fileText(file,ocr){
 if(file.size>20*1024*1024)throw Error('Limite de 20 MB por arquivo.');const ext=file.name.split('.').pop().toLowerCase();
 if(ext==='pdf')return pdfText(file,ocr);
 if(ext==='xlsx')return SolarBudgetXlsx.read(file);
 if(['docx','odt'].includes(ext))return SolarBudgetXlsx.readDocument(file);
 if(ext==='xls')throw Error('Converta a planilha XLS antiga para XLSX ou CSV antes de importar.');
 if(['txt','csv','tsv'].includes(ext))return [{name:file.name,text:await file.text()}];throw Error('Formato não suportado. Use PDF, XLSX, DOCX, ODT, TXT, CSV ou TSV. Converta XLS e documentos de texto para um desses formatos.');
}
async function read(type,supplierId){
 if(busy){notify('Uma operação já está em andamento.','warn');return;}busy=true;const owner=user.id,draftId=data.id,generation=sessionGeneration;
 try{
  const box=supplierId?document.querySelector('.supplier[data-supplier="'+supplierId+'"]'):null;
  const file=supplierId?box.querySelector('[data-source=file]').files[0]:$('list-file').files[0];
  const text=supplierId?box.querySelector('[data-source=text]').value:$('list-text').value;
  const ocr=supplierId?box.querySelector('[data-source=ocr]').checked:$('list-ocr').checked;
  const mode=supplierId?box.querySelector('[data-source=mode]').value:$('list-mode').value;
  if(!file&&!text.trim())throw Error('Selecione um arquivo ou cole um texto.');
  const parts=file?await fileText(file,ocr):[];if(text.trim())parts.push({name:'Texto colado',text});
  if(user?.id!==owner||data.id!==draftId||sessionGeneration!==generation)throw Error('A cotação ou sessão mudou durante a leitura. Importe novamente.');
  const parsed=parts.map(p=>{
   const table=p.geometry?SolarBudgetImport.pdfTable(p.geometry,p.name,type):null;if(table)return table;
   const result=E.parse(p.text,type,p.name);
   if(p.geometry){const count=result.rows.length;result.rows=result.rows.filter(r=>type==='list'?r.qty!==null:r.quotedQty!==null||r.price!==null);if(count>result.rows.length)result.notes.push((count-result.rows.length)+' linhas sem estrutura reconhecida. Confira o texto original: a leitura pode estar incompleta.');if(!result.rows.length)result.notes.push('Nenhum material identificado nesta página. Cadastre manualmente ou cole uma tabela com cabeçalhos.');}
   return result;
  });
  const rows=type==='offer'?SolarBudgetImport.consolidate(parsed):parsed.flatMap(p=>p.rows);if(type==='offer')rows.forEach(o=>SolarBudgetImport.prepare(o,data.items,data.aliases));if(rows.length>2000)throw Error('Limite de 2.000 linhas por importação. Divida a lista.');
  review={type,supplierId,mode,rows,parts,reportedTotal:[...parsed].reverse().find(p=>p.reportedTotal!==null)?.reportedTotal??null,notes:parsed.flatMap(p=>p.notes),draftId};
  const existing=type==='list'?data.items:data.suppliers.find(s=>s.id===supplierId).offers;const duplicates=E.duplicates(existing,rows).length;
  $('review-info').textContent=rows.length+' linhas para revisão. '+duplicates+' possíveis duplicidades com dados existentes. '+review.notes.join(' ');
  $('review-content').innerHTML=type==='list'?itemTable(rows,'review'):offerTable(rows,supplierId,'review');$('review-source').textContent=parts.map(p=>p.name+'\n'+p.text).join('\n\n');$('review-dialog').showModal();notify('Leitura preparada. Revise as linhas antes de aplicar.');
 }catch(e){notify(e.message,'error');}finally{busy=false;}
}
function applyReview(){
 if(!review||review.draftId!==data.id){notify('Revisão desatualizada. Importe novamente.','error');return;}
 const target=review.type==='list'?data.items:data.suppliers.find(s=>s.id===review.supplierId)?.offers;if(!target)return;
 const duplicates=E.duplicates(review.mode==='append'?target:[],review.rows);
 const seen=new Set();let internal=0;for(const r of review.rows){const k=E.norm(r.description);if(seen.has(k))internal++;seen.add(k);}
 if((duplicates.length||internal)&&!confirm('Há '+(duplicates.length+internal)+' possíveis duplicidades. Incorporar mesmo assim?'))return;
 if(review.mode==='replace'&&target.length&&!confirm('Substituir os itens existentes? As associações e escolhas afetadas serão desfeitas.'))return;
 if(review.type==='list'){
  if(review.mode==='replace'){data.items=review.rows;data.choices={};data.bundles=[];for(const s of data.suppliers)for(const o of s.offers){o.confirmed=false;o.itemId='';o.components=[];}}
  else data.items.push(...review.rows);
 }else{
  const s=data.suppliers.find(s=>s.id===review.supplierId);if(review.mode==='replace'){const ids=new Set(s.offers.map(o=>o.id));for(const id of Object.keys(data.choices))if(ids.has(data.choices[id]))delete data.choices[id];data.bundles=data.bundles.filter(id=>!ids.has(id));s.offers=review.rows;}else s.offers.push(...review.rows);
  if(review.reportedTotal!==null)s.reportedTotal=review.reportedTotal;
 }
 for(const p of review.parts)data.sources.push({id:E.uid(),name:p.name,kind:review.type==='list'?'Lista geral':'Cotação de '+data.suppliers.find(s=>s.id===review.supplierId).name,text:p.text,at:new Date().toISOString()});
 review=null;$('review-dialog').close();touch();render();notify('Itens incorporados. Confirme as necessidades e associações revisadas.');
}
function confirmItem(i){return !!i.description.trim()&&E.valid(i.qty)&&i.qty>0&&!!i.unit;}
function handleChange(event){const t=event.target;const tr=t.closest('tr'),sbox=t.closest('.supplier');
 if(t.dataset.choice!==undefined){data.choices[t.dataset.choice]=t.value;touch();return;}
 if(t.dataset.sfield&&sbox){const s=data.suppliers.find(s=>s.id===sbox.dataset.supplier);const numeric=['freight','discount','reportedTotal'].includes(t.dataset.sfield);const value=numeric?E.num(t.value):t.value;if(numeric&&t.value.trim()&&(value===null||value<0)){notify('Informe um valor numérico não negativo.','error');t.value=amount(s[t.dataset.sfield]);return;}s[t.dataset.sfield]=value;touch();return;}
 if(!tr||!t.dataset.field)return;
 const context=tr.dataset.context,kind=tr.dataset.item?'item':'offer';
 const collection=context==='review'?review?.rows:kind==='item'?data.items:data.suppliers.find(s=>s.id===tr.dataset.supplier)?.offers;
 const x=collection?.find(x=>x.id===(tr.dataset.item||tr.dataset.offer));if(!x)return;
 const field=t.dataset.field;
 if(field==='selectedBundle'){if(t.checked){if(!x.components.length){notify('Defina os componentes do kit primeiro.','error');t.checked=false;return;}if(!data.bundles.includes(x.id))data.bundles.push(x.id);}else data.bundles=data.bundles.filter(id=>id!==x.id);}
 else if(field==='componentsText'){
  const lines=t.value.split(/\n/).filter(s=>s.trim());const components=[];
  for(const line of lines){const [name,q,u]=line.split(';').map(s=>s.trim());const matches=data.items.filter(i=>E.norm(i.description)===E.norm(name));if(matches.length!==1||!(E.num(q)>0)||!u){notify('Componente não reconhecido ou ambíguo: '+line+'. Use nome exato, quantidade e unidade.','error');return;}components.push({itemId:matches[0].id,qty:E.num(q),unit:E.unit(u)});}
  x.components=components;x.confirmed=false;if(components.length)x.itemId='';
 }else if(['confirmed','rejected','divisible'].includes(field)){
  if(field==='confirmed'&&t.checked){
   if(kind==='item'&&!confirmItem(x)){notify('Informe material, quantidade positiva e unidade antes de confirmar.','error');t.checked=false;return;}
   if(kind==='offer'){
    const i=data.items.find(i=>i.id===x.itemId);const r=E.cost({...x,confirmed:true},i);const issues=x.components.length?[]:r.issues;
    if(!E.valid(x.price)||issues?.length||E.offerIssues(x).length){notify('Corrija os dados antes de confirmar. '+[...(issues||[]),...E.offerIssues(x)].join(' · '),'error');t.checked=false;return;}
    const guesses=E.suggest(x,data.items,data.aliases);if((E.specReview(x,i).conflicts.length||E.specReview(x,i).missing.length)&&!confirm('Existem diferenças ou especificações não declaradas. Você conferiu e confirma que a oferta atende ao material solicitado?')){t.checked=false;return;}
    if(i)data.aliases.push({description:x.description,specs:E.specs(x.description).join('|'),material:E.norm(i.description)});
   }
  }
  x[field]=t.checked;if(field==='rejected'&&t.checked)x.confirmed=false;
 }else{
  const numeric=['qty','price','quotedQty','quotedTotal','pack','stock','quoteLimit','min','bundleBuy'].includes(field);const value=numeric?E.num(t.value):t.value;
  if(numeric&&t.value.trim()&&(value===null||value<0)){notify('Informe um número não negativo. O valor anterior foi preservado.','error');t.value=amount(x[field]);return;}
  x[field]=value;
  if(field!=='note'&&field!=='bundleBuy')x.confirmed=false;
 }
 if(context==='review'){if(!['componentsText','selectedBundle'].includes(field))return;}
 else {if(kind==='item'&&field!=='confirmed'){for(const s of data.suppliers)for(const o of s.offers)if(o.itemId===x.id||o.components.some(c=>c.itemId===x.id))o.confirmed=false;}touch();}
 if(context!=='review'&&['itemId','componentsText','confirmed','rejected','qty','unit','pack','price','stock','min','description','priceBasis','quotedQty','quotedTotal','quoteLimit'].includes(field)){render();}
}
async function save(complete){
 if(busy)return;const r=E.calculate(data);if(complete&&(!r.complete||data.suppliers.length<2)){notify('Conclua a revisão, atenda todas as necessidades e cadastre pelo menos dois fornecedores.','error');return;}
 if(complete&&r.conditionsMissing&&!confirm('Existem fretes ou descontos não informados. Salvar a cotação concluída com essa limitação registrada?'))return;
 busy=true;$('save').disabled=true;$('complete').disabled=true;const owner=user.id,generation=sessionGeneration,version=data.updatedAt;
 const savedAt=new Date().toISOString(),entry={id:E.uid(),quoteId:data.id,status:complete?'complete':'draft',savedAt,data:E.clone(data),result:E.clone(r)};
 try{
  if(!archiveService||!cloud)throw Error('Arquivo da conta indisponível. Tente sincronizar novamente; o rascunho local foi preservado.');
  const missing=history.filter(h=>!archiveService.records.some(x=>x.id===h.id&&x.savedAt===h.savedAt||x.legacyOrigin===(h.legacyOrigin||h.id+':'+h.savedAt)));if(missing.length)await timeout(archiveService.importHistory(missing));
  await timeout(archiveService.save(entry));
  if(user?.id!==owner||generation!==sessionGeneration)throw Error('A sessão mudou durante a gravação.');
  history=archiveService.records;try{persistLocal();}catch(e){notify('Cotação salva na conta; a cópia local não pôde ser gravada.','warn');}if(version===data.updatedAt)dirty=false;renderHistory();notify((complete?'Cotação concluída':'Rascunho salvo')+(cloud?' na sua conta.':' neste navegador. Exporte um backup para guardar uma cópia.'));
 }catch(e){notify('Gravação não concluída: '+e.message,'error');}finally{busy=false;$('save').disabled=false;$('complete').disabled=false;}
}
function download(name,content,type){const blob=content instanceof Blob?content:new Blob([content],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function reportHtml(snapshot){return SolarBudgetDocument.html(snapshot,documentOptions);}
function renderCompanies(){
 const fallback='<p class="warn">Empresas indisponíveis. <a href="/empresas/">Abrir cadastro no IG Base</a></p>';
 $('company-settings').innerHTML=companyService?IGCompanies.picker(companyService,companyService.selected('solar-budget')?.id):fallback;
 $('company-quote').innerHTML=companyService?IGCompanies.picker(companyService,data.doc.companyId):fallback;
 $('company-settings').querySelector('select')?.addEventListener('change',async e=>{try{await companyService.select('solar-budget',e.target.value);notify('Empresa padrão salva na conta. A cotação atual conserva sua seleção.');}catch(err){notify(err.message,'error');renderCompanies();}});
 $('company-quote').querySelector('select')?.addEventListener('change',e=>{data.doc.companySnapshot=companyService.get(e.target.value);data.doc.companyId=e.target.value;data.doc.company='';data.doc.contact='';touch();});
}
function refreshDocument(){try{$('document').innerHTML=reportHtml(documentSnapshot);$('download-pdf').disabled=false;$('download-all').disabled=false;$('report-notice').className='hint no-print';$('report-notice').textContent='Limite de oito páginas por PDF. A emissão verifica todas as páginas antes de baixar.';}catch(e){$('report-notice').className='error no-print';$('report-notice').textContent=e.message;$('download-pdf').disabled=true;$('download-all').disabled=true;}}
function preview(snapshot){
 documentSnapshot=snapshot?E.clone(snapshot):{data:E.clone(data),result:E.calculate(data),status:'preview',savedAt:new Date().toISOString()};documentOptions={kind:'cart'};previewGeneration++;$('scope-enabled').checked=false;
 $('report-kind').innerHTML=SolarBudgetDocument.reportOptions(documentSnapshot).map((x,i)=>'<option value="'+i+'">'+esc(x.label)+'</option>').join('');
 $('scope-items').innerHTML=documentSnapshot.data.items.map(i=>'<label class="check"><input type="checkbox" data-scope="'+esc(i.id)+'" checked>'+esc(i.description)+' · '+amount(i.qty)+' '+esc(i.unit)+'</label>').join('');
 $('preview-snapshot-note').textContent=snapshot?'Documento salvo: dados e valores originais preservados. Trocar a empresa aqui gera uma cópia; não altera o histórico.':'Confira cliente, empresa e escolhas antes de emitir.';
 $('preview-company').innerHTML=companyService?IGCompanies.picker(companyService,documentSnapshot.data.doc.companyId,'Empresa destes PDFs'):'';
 $('preview-company').querySelector('select')?.addEventListener('change',e=>{if(busy)return;documentSnapshot.data.doc.companySnapshot=companyService.get(e.target.value);documentSnapshot.data.doc.companyId=e.target.value;documentSnapshot.data.doc.company='';documentSnapshot.data.doc.contact='';documentSnapshot.status='preview';previewGeneration++;refreshDocument();if(!snapshot){data.doc=E.clone(documentSnapshot.data.doc);touch();}});
 refreshDocument();$('preview-dialog').showModal();
}
async function pdf(all=false,saveOnly=false){
 if(busy||!documentSnapshot)return;busy=true;const snapshot=E.clone(documentSnapshot),options=E.clone(documentOptions),generation=previewGeneration,owner=user?.id,session=sessionGeneration;$('download-pdf').disabled=true;$('download-all').disabled=true;$('save-documents').disabled=true;$('report-kind').disabled=true;$('preview-company').querySelector('select')?.setAttribute('disabled','');$('report-scope').inert=true;
 try{
  await lib('gerador PDF',['https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js','https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'],()=>!!window.jspdf);
  const reports=all?SolarBudgetDocument.reportOptions(snapshot).map(x=>({...x,scopeIds:options.scopeIds})):[options],files=reports.map((opt,i)=>{const model=SolarBudgetDocument.model(snapshot,opt),doc=SolarBudgetDocument.pdf(snapshot,jspdf.jsPDF,opt);return {name:(all?String(i+1)+'-':'')+model.filename,bytes:new Uint8Array(doc.output('arraybuffer')),pages:doc.getNumberOfPages()};});
  if(generation!==previewGeneration)throw Error('A prévia mudou. Confira o documento e emita novamente.');
  if(user?.id!==owner||session!==sessionGeneration)throw Error('A sessão mudou durante a emissão.');
  if(!archiveService||!cloud)throw Error('Arquivo da conta indisponível. Sincronize antes de guardar os PDFs.');
  const entry={id:E.uid(),quoteId:snapshot.data.id,status:snapshot.status==='complete'?'complete':'draft',savedAt:new Date().toISOString(),data:E.clone(snapshot.data),result:E.clone(snapshot.result),documents:[{id:E.uid(),at:new Date().toISOString(),scopeIds:options.scopeIds||null,files:files.map(f=>({name:f.name,pages:f.pages,base64:IGBudgetArchive.encode(f.bytes)}))}]};
  await timeout(archiveService.save(entry));if(user?.id!==owner||session!==sessionGeneration)throw Error('A sessão mudou durante o salvamento.');history=archiveService.records;try{persistLocal();}catch(e){}renderHistory();
  if(!saveOnly){
  if(all)download('Solar-Budget-documentos'+(options.scopeIds?'-recorte':'')+'.zip',SolarBudgetDocument.zip(files));else download(files[0].name,new Blob([files[0].bytes],{type:'application/pdf'}));}
  const message=saveOnly?files.length+' PDFs salvos na sua conta.':all?files.length+' PDFs salvos na conta e reunidos no ZIP.':files[0].pages+' página(s). PDF gerado com os dados da prévia.';$('report-notice').className='success no-print';$('report-notice').textContent=message;notify(message);
 }catch(e){$('report-notice').className='error no-print';$('report-notice').textContent='Emissão bloqueada: '+e.message;notify('PDF não gerado: '+e.message,'error');if(e.code==='PAGE_LIMIT'){$('report-scope').open=true;}}
 finally{busy=false;$('download-pdf').disabled=false;$('download-all').disabled=false;$('save-documents').disabled=false;$('report-kind').disabled=false;$('preview-company').querySelector('select')?.removeAttribute('disabled');$('report-scope').inert=false;}
}
function csv(){if(!documentSnapshot)return;const rows=[['Fornecedor','Material','Quantidade a comprar','Preço unitário','Subtotal','Unidade','Atendido','Sobra']];for(const c of documentSnapshot.result.carts)for(const l of c.lines)rows.push([c.name,l.description,amount(l.buy),amount(l.price),amount(l.total),l.unit||'kit',amount(l.covered),amount(l.surplus)]);const cell=x=>'"'+String(x??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';download('Solar-Budget-carrinhos.csv','\uFEFF'+rows.map(r=>r.map(cell).join(';')).join('\r\n'),'text/csv;charset=utf-8');}
document.addEventListener('change',handleChange);
document.addEventListener('click',async event=>{
 const b=event.target.closest('[data-action]');if(!b)return;const action=b.dataset.action,tr=b.closest('tr'),sbox=b.closest('.supplier');
 try{
  if(action==='confirm-clear-offers'){const s=data.suppliers.find(s=>s.id===sbox.dataset.supplier),valid=s.offers.filter(o=>{const i=data.items.find(i=>i.id===o.itemId);if(!i||o.rejected||o.components.length)return false;const sr=E.specReview(o,i);return !sr.conflicts.length&&!sr.missing.length&&!E.offerIssues(o).length&&E.cost({...o,confirmed:true},i).valid;});if(!valid.length){notify('Nenhuma associação sem alertas está pronta. Revise os itens.','warn');return;}if(!confirm('Você revisou as '+valid.length+' associações sem alertas de '+s.name+'? Especificações não detectadas também precisam de sua conferência.'))return;valid.forEach(o=>o.confirmed=true);touch();render();return;}
  if(action==='read-offers'){await read('offer',sbox.dataset.supplier);return;}
  if(action==='stored-pdf'||action==='stored-zip'){const h=history.find(h=>h.id===b.dataset.history);if(!h)return;if(action==='stored-pdf'){const f=h.documents?.[Number(b.dataset.emission)]?.files[Number(b.dataset.file)];if(f)download(f.name,new Blob([IGBudgetArchive.decode(f.base64)],{type:'application/pdf'}));}else{const files=(h.documents||[]).flatMap((em,i)=>em.files.map((f,j)=>({name:(i+1)+'-'+(j+1)+'-'+f.name,bytes:IGBudgetArchive.decode(f.base64)})));download('Solar-Budget-PDFs-salvos.zip',SolarBudgetDocument.zip(files));}return;}
  if(action==='open-history'||action==='duplicate'||action==='resume-history'){
   const h=history.find(h=>h.id===b.dataset.history);if(!h)return;
   if(action==='open-history'){preview(E.clone(h));return;}
   if(dirty&&!confirm('Usar esta cotação como base e trocar o rascunho atual? Exporte um backup se precisar preservá-lo.'))return;
   data=E.clone(h.data);if(action==='duplicate'){data.id=E.uid();data.name+=' · cópia';}touch();render();location.hash='';return;
  }
  if(action==='remove-supplier'){if(confirm('Remover este fornecedor e suas ofertas?')){const s=data.suppliers.find(s=>s.id===sbox.dataset.supplier),ids=new Set(s.offers.map(o=>o.id));data.suppliers=data.suppliers.filter(s=>s.id!==sbox.dataset.supplier);data.bundles=data.bundles.filter(id=>!ids.has(id));touch();render();}return;}
  if(action==='add-offer'){data.suppliers.find(s=>s.id===sbox.dataset.supplier).offers.push(E.offer());touch();render();return;}
  if(action==='remove-item'){
   if(tr.dataset.context==='review'){review.rows=review.rows.filter(i=>i.id!==tr.dataset.item);tr.remove();return;}
   if(!confirm('Remover material e desfazer suas associações?'))return;data.items=data.items.filter(i=>i.id!==tr.dataset.item);delete data.choices[tr.dataset.item];for(const s of data.suppliers)for(const o of s.offers){if(o.itemId===tr.dataset.item){o.itemId='';o.confirmed=false;}if(o.components.some(c=>c.itemId===tr.dataset.item)){o.components=o.components.filter(c=>c.itemId!==tr.dataset.item);o.confirmed=false;}}touch();render();return;
  }
  const list=tr.dataset.context==='review'?review.rows:data.suppliers.find(s=>s.id===tr.dataset.supplier).offers;
  if(action==='remove-offer'){const ix=list.findIndex(o=>o.id===tr.dataset.offer);list.splice(ix,1);data.bundles=data.bundles.filter(id=>id!==tr.dataset.offer);if(tr.dataset.context==='review'){tr.remove();return;}}
  if(action==='suggest'){const o=list.find(o=>o.id===tr.dataset.offer);o.itemId=b.dataset.match;o.confirmed=false;}
  if(tr.dataset.context==='review'){$('review-content').innerHTML=offerTable(review.rows,review.supplierId,'review');return;}touch();render();
 }catch(e){notify(e.message,'error');}
});
$('login-form').addEventListener('submit',async event=>{event.preventDefault();if(busy)return;busy=true;const b=event.submitter;b.disabled=true;try{if(!db)throw Error('Conexão indisponível. Tente novamente.');const r=await timeout(db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value}));if(r.error)throw r.error;$('password').value='';await activate(r.data.user);}catch(e){notify(e.message,'error');}finally{busy=false;b.disabled=false;}});
$('logout').onclick=async()=>{if(busy){notify('Aguarde a operação em andamento.','warn');return;}try{const r=await db.auth.signOut();if(r.error)throw r.error;}catch(e){notify(e.message,'error');}};
$('retry').onclick=boot;
$('new').onclick=()=>{if(busy)return;if(dirty&&!confirm('Criar uma nova cotação? Salve o rascunho ou exporte um backup para preservar o trabalho atual.'))return;data=E.fresh();if(companyService){const c=companyService.selected('solar-budget');data.doc.companySnapshot=c;data.doc.companyId=c?.id||'';}touch();render();};
$('confirm-list').onclick=()=>{const valid=data.items.filter(confirmItem);if(!valid.length){notify('Preencha as quantidades e unidades antes de confirmar.','warn');return;}const notes=[...new Set(data.items.map(i=>i.note).filter(Boolean))];if(!confirm('Você revisou '+valid.length+' necessidades preenchidas? '+notes.join(' ')))return;valid.forEach(i=>i.confirmed=true);touch();render();};
$('read-list').onclick=()=>read('list');$('apply-review').onclick=applyReview;$('cancel-review').onclick=()=>{$('review-dialog').close();review=null;};
$('add-item').onclick=()=>{data.items.push(E.item());touch();render();};$('add-supplier').onclick=()=>{data.suppliers.push(E.supplier('Fornecedor '+(data.suppliers.length+1)));touch();render();};
$('quote-name').onchange=()=>{data.name=$('quote-name').value.trim()||'Nova cotação';touch();};
for(const k of ['nome','documento','contato','email','telefone','endereco','projeto'])$('client-'+k).onchange=()=>{data.client=data.client||{};data.client[k]=$('client-'+k).value.trim();touch();};
$('cart-mode').onchange=()=>{data.cartMode=$('cart-mode').value;touch();render();};$('single-supplier').onchange=()=>{data.singleSupplierId=$('single-supplier').value;touch();};
function settingsPage(){const show=location.hash==='#configuracoes'&&!!user,archive=location.hash==='#arquivos'&&!!user;$('settings-page').hidden=!show;$('archive-page').hidden=!archive;$('workspace').hidden=!user||show||archive;if(archive)renderHistory();}
$('settings-open').onclick=()=>{location.hash='configuracoes';};$('settings-back').onclick=()=>{location.hash='';};window.addEventListener('hashchange',settingsPage);
$('search').oninput=renderResults;$('filter').onchange=renderResults;$('history-search').oninput=renderHistory;$('history-status').onchange=renderHistory;$('archive-retry').onclick=()=>connectArchive();
$('save').onclick=()=>save(false);$('complete').onclick=()=>save(true);
$('export').onclick=()=>download('Solar-Budget-backup.json',JSON.stringify({format:'solar-budget-backup-v1',draft:data,history},null,2),'application/json');
$('restore').onchange=async()=>{try{const file=$('restore').files[0];if(!file)return;if(file.size>32*1024*1024)throw Error('Backup acima de 32 MB.');const parsed=JSON.parse(await file.text());if(parsed.format!=='solar-budget-backup-v1'||!Array.isArray(parsed.history))throw Error('Backup incompatível.');const draft=E.validate(parsed.draft),entries=parsed.history.map(h=>{if(typeof h.id!=='string'||typeof h.savedAt!=='string')throw Error('Registro inválido.');const hd=E.validate(h.data);return {...h,data:hd,result:h.result||E.calculate(hd)};});if(!confirm('Restaurar este backup, substituindo o rascunho e histórico locais? A nuvem não será apagada.'))return;localStorage.setItem(key(),JSON.stringify({draft,history:entries}));data=draft;history=entries;dirty=true;render();notify('Backup restaurado neste navegador.');}catch(e){notify('Restauração cancelada: '+e.message,'error');}finally{$('restore').value='';}};
$('print').onclick=()=>preview();$('download-pdf').onclick=()=>pdf(false);$('download-all').onclick=()=>pdf(true);$('save-documents').onclick=()=>pdf(true,true);$('download-csv').onclick=csv;
$('report-kind').onchange=()=>{if(busy)return;documentOptions={...SolarBudgetDocument.reportOptions(documentSnapshot)[Number($('report-kind').value)],scopeIds:documentOptions.scopeIds};previewGeneration++;refreshDocument();};
$('scope-all').onclick=()=>{if(busy)return;$('scope-items').querySelectorAll('input').forEach(x=>x.checked=true);};
$('scope-none').onclick=()=>{if(busy)return;$('scope-items').querySelectorAll('input').forEach(x=>x.checked=false);};
$('scope-apply').onclick=()=>{if(busy)return;const ids=$('scope-enabled').checked?Array.from($('scope-items').querySelectorAll('input:checked'),x=>x.dataset.scope):undefined;try{SolarBudgetDocument.model(documentSnapshot,{...documentOptions,scopeIds:ids});documentOptions.scopeIds=ids;previewGeneration++;refreshDocument();}catch(e){$('report-notice').className='error no-print';$('report-notice').textContent=e.message;}};
window.addEventListener('beforeunload',event=>{if(busy){event.preventDefault();event.returnValue='';}});
boot().then(settingsPage);
})();

