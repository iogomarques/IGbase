/* Solar Budget 1.09.11 — pure calculation and import model; no energy billing dependencies. */
(function(root){
'use strict';
const VERSION='1.09.11', uid=()=>globalThis.crypto?.randomUUID?.() || 'sb-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const clone=x=>JSON.parse(JSON.stringify(x));
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function num(x){
 if(x===null||x===undefined||String(x).trim()==='')return null;
 if(typeof x==='number')return Number.isFinite(x)?x:null;
 let t=String(x).trim().replace(/R\$|\s/g,'');
 if(!/^-?[\d.,]+$/.test(t))return null;
 if(t.includes(','))t=t.replace(/\./g,'').replace(',','.');
 else if(/^\d{1,3}(\.\d{3})+$/.test(t))t=t.replace(/\./g,'');
 const n=Number(t);return Number.isFinite(n)?n:null;
}
const round=x=>Math.round((x+Number.EPSILON)*100)/100;
function unit(x){const t=norm(x);return ({mt:'m',mts:'m',br:'barra',rl:'rolo',cx:'caixa',pct:'pacote',pc:'un',pca:'un',pç:'un',ea:'un',m:'m',metro:'m',metros:'m',un:'un',und:'un',unid:'un',unidade:'un',unidades:'un',pcs:'un',pc:'un',peca:'un',pecas:'un',kg:'kg',quilograma:'kg',l:'l',litro:'l',litros:'l',conjunto:'conj',conjuntos:'conj',conj:'conj',barra:'barra',barras:'barra',rolo:'rolo',rolos:'rolo',pacote:'pacote',pacotes:'pacote',kit:'kit',caixa:'caixa',caixas:'caixa'})[t]||t;}
const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
function fresh(){return {schema:'solar-budget-v1',version:VERSION,id:uid(),name:'Nova cotação',items:[],suppliers:[],sources:[],aliases:[],choices:{},bundles:[],cartMode:'combined',singleSupplierId:'',client:{nome:'',documento:'',contato:'',email:'',telefone:'',endereco:'',projeto:''},doc:{company:'',contact:'',color:'#2f663f',companySnapshot:null},updatedAt:new Date().toISOString()};}
const item=(description='')=>({id:uid(),description,qty:null,unit:'',confirmed:false});
const offer=(description='')=>({id:uid(),description,itemId:'',confirmed:false,rejected:false,price:null,quotedQty:null,quotedTotal:null,unit:'',pack:1,min:1,stock:null,divisible:false,components:[],note:'',source:''});
const supplier=name=>({id:uid(),name,offers:[],freight:null,discount:null,reportedTotal:null,terms:''});
function specs(x){
 const s=String(x).toLowerCase().replace(/,/g,'.');
 return [...s.matchAll(/\d+(?:\.\d+)?\s*(?:mm(?:²|2)?|kw|w|ka|a|v|ip\s*\d+|pol)\b|\d+\s*\/\s*\d+\s*["″]/gi)].map(m=>m[0].replace(/\s/g,''));
}
function attributes(text){const s=String(text).toLowerCase().replace(/,/g,'.'),values=re=>[...s.matchAll(re)].map(m=>Number(m[1]));
 const a={section:values(/(\d+(?:\.\d+)?)\s*mm(?:²|2)?(?=\s|$|[.,;/)])/gi),power:values(/(\d+(?:\.\d+)?)\s*w\b/gi),current:values(/(\d+(?:\.\d+)?)\s*a\b/gi),ip:values(/ip\s*(\d+)/gi),kelvin:values(/(\d{4})\s*k\b/gi)};
 for(const m of s.matchAll(/(\d(?:\.\d+)?)\s*k\b/gi))a.kelvin.push(Number(m[1])*1000);
 if(/\d+w?\s*\/\s*\d+w/i.test(s)){const m=/(\d+)w?\s*\/\s*(\d+)w/i.exec(s);a.power=[Number(m[1]),Number(m[2])];}
 const family=/\b(?:idr|dr|diferencial)\b/.test(s)?'idr':/disj/.test(s)?'disjuntor':/cabo|cordoalha/.test(s)?(/cobre nu|cordoalha/.test(s)?'cordoalha':'cabo'):/terminal|ilh[oó]s|tubolar|tubular/.test(s)?'terminal':/plafon|painel/.test(s)?'plafon':/high\s*bay/.test(s)?'highbay':/refletor|projetor/.test(s)?'refletor':/lumin|slim/.test(s)?'luminaria':'';
 const infra=norm(text).replace(/\b(?:eletr|eltro|elet)\b/g,'eletroduto').replace(/\bcond\b/g,'condulete');a.family=family||['eletroduto','condulete','perfilado','suspensor','abracadeira','curva','emenda','unidut','luva','bucha','arruela'].find(x=>infra.includes(x))||'';
 if(!['cabo','terminal','cordoalha'].includes(a.family))a.section=[];
 a.inch=[];let sizes=s.replace(/\b(\d+)[. ](\d+)\s*\/\s*(\d+)/g,(_,whole,num,den)=>String(Number(whole)+Number(num)/Number(den))+'"');for(const m of sizes.matchAll(/(\d+)\s*\/\s*(\d+)(?=\s|["″]|$)/g))a.inch.push(Number(m[1])/Number(m[2]));for(const m of sizes.matchAll(/(\d+(?:\.\d+)?)\s*["″]/g))a.inch.push(Number(m[1]));
 a.color=family==='cabo'?Object.entries({preto:/\b(?:preto|pt)\b/,azul:/\b(?:azul|az)\b/,verde:/\b(?:verde|vd)\b/,cinza:/\b(?:cinza|cz)\b/,branco:/\b(?:branco|br)\b/,amarelo:/\b(?:amarelo|am)\b/,vermelho:/\b(?:vermelho|vm)\b/}).find(([,re])=>re.test(s))?.[0]:null;return a;
}
function specReview(o,i){const a=attributes(o.description),b=attributes(i?.description),conflicts=[],missing=[];
 if(a.family&&b.family&&a.family!==b.family)conflicts.push('Tipo diferente: '+a.family+' / '+b.family);
 if(a.color&&b.color&&a.color!==b.color)conflicts.push('Cor: '+a.color+' / pedido '+b.color);
 for(const [key,label] of Object.entries({section:'Seção (mm²)',power:'Potência (W)',current:'Corrente (A)',ip:'Proteção IP',kelvin:'Temperatura (K)',inch:'Medida (pol.)'})){if(b[key].length&&!a[key].length)missing.push(label+' não declarada');else if(a[key].length&&b[key].length&&!a[key].some(x=>b[key].includes(x)))conflicts.push(label+': '+a[key].join('/')+' / pedido '+b[key].join('/'));}
 const request=norm((i?.description||'')+' '+(i?.group||'')),original=norm(o.description);
 for(const name of ['schneider','tramontina','wago'])if(request.includes(name)&&!original.includes(name))missing.push('Marca '+name+' não declarada');
 if(/haste/.test(request)){const fraction=/(\d+)\s*\/\s*(\d+)/.exec(i.description),millimeters=/(\d+(?:[.,]\d+)?)\s*mm/i.exec(o.description);if(fraction&&millimeters&&Math.abs(Number(millimeters[1].replace(',','.'))-Number(fraction[1])/Number(fraction[2])*25.4)>.1)conflicts.push('Diâmetro da haste diferente do pedido');}
 if(/hepr/.test(request)&&!/hepr/.test(original))missing.push('Isolação HEPR não declarada');
 if(/bivolt/.test(request)&&!/biv|100\s*240|127\s*220/.test(original))missing.push('Bivolt não declarado');
 if(/\bufo\b/.test(request)&&!/\bufo\b/.test(original))missing.push('Modelo UFO não declarado');
 if(/conico/.test(request)&&/reto/.test(original))conflicts.push('Conexão reta / pedido cônico');
 if(/emenda.*\bu\b/.test(request)&&/emenda.*\bi\b/.test(original))conflicts.push('Emenda I / pedido U');
 return {conflicts,missing};
}
function pricing(o){if(!valid(o.price)||!valid(o.quotedQty)||o.quotedQty<=0||!valid(o.quotedTotal))return {price:o.price,basis:'unit',rounding:false};const delta=Math.abs(o.price*o.quotedQty-o.quotedTotal),rounding=delta>.02&&delta<=o.quotedQty*.005+.011;return {price:o.priceBasis==='subtotal'||rounding?o.quotedTotal/o.quotedQty:o.price,basis:o.priceBasis==='subtotal'||rounding?'subtotal':'unit',rounding};}
function words(t){return norm(t).replace(/\b(?:eletr|eltro|elet)\b/g,'eletroduto').replace(/\bcond\b/g,'condulete').replace(/\b(?:zinc|galv|galvanizado)\b/g,'zincado').replace(/\b(?:unipolar|unip|mono)\b/g,'monopolar').replace(/\b(?:bi|bip)\b/g,'bipolar').replace(/\b(?:tri|trip)\b/g,'tripolar').replace(/\bdr\b/g,'idr').replace(/\b(?:tubolar|tubular|ilhos)\b/g,'terminal').replace(/\bdisj\b/g,'disjuntor').split(' ').map(w=>w.length>4?w.replace(/s$/,''):w).filter(w=>w.length>1&&!['para','com','sem','tipo','padrao','marca','pedido','qdi','qdg'].includes(w));}
function suggest(o,items,aliases=[]){
 const prior=aliases.find(a=>norm(a.description)===norm(o.description)&&a.specs===specs(o.description).join('|'));
 return items.map(i=>{const a=new Set(words(o.description)),b=new Set(words(i.description));
 const common=[...a].filter(t=>b.has(t)).length;const sa=specs(o.description),sb=specs(i.description);
 const review=specReview(o,i),conflict=review.conflicts.length>0;
 let score=common/Math.max(a.size,b.size,1);if(norm(o.description)===norm(i.description))score=1;
 if(prior&&prior.material===norm(i.description)&&!conflict)score=Math.max(score,.98);
 const aa=attributes(o.description),bb=attributes(i.description);if(aa.family&&aa.family===bb.family)score+=.18;if(aa.color&&aa.color===bb.color)score+=.15;for(const key of ['section','power','current','ip','inch'])if(aa[key].length&&bb[key].length&&aa[key].some(x=>bb[key].includes(x)))score+=.10;if(aa.family&&bb.family&&aa.family!==bb.family)score-=.3;
 return {id:i.id,description:i.description,score,conflict,review};}).filter(x=>x.score>.15).sort((a,b)=>b.score-a.score);
}
function cost(o,i,need=i?.qty){
 const issues=[];
 if(!i?.confirmed||!valid(i.qty)||i.qty===0||!i.unit)issues.push('Necessidade não confirmada');
 if(!o.confirmed||o.rejected||o.itemId!==i?.id)issues.push('Associação não confirmada');
 if(!valid(o.price))issues.push('Preço ausente ou inválido');
 if(!valid(o.pack)||o.pack<=0)issues.push('Conteúdo da embalagem inválido');
 if(!valid(o.min)||o.min<=0)issues.push('Mínimo de compra inválido');
 if(unit(o.unit)!==unit(i?.unit))issues.push('Unidade sem conversão confirmada');
 if(o.stock!==null&&!valid(o.stock))issues.push('Disponibilidade inválida');
 if(o.quoteLimit!=null&&!valid(o.quoteLimit))issues.push('Limite da cotação inválido');
 if(issues.length)return {valid:false,issues};
 const pack=o.pack,minimum=o.divisible?o.min:Math.ceil(o.min);
 const limit=o.quoteLimit==null?Infinity:o.quoteLimit;const available=Math.min(limit,o.stock===null?Infinity:o.divisible?o.stock:Math.floor(o.stock));
 if(available<minimum)return {valid:false,issues:['Disponibilidade abaixo do mínimo de compra']};
 let buy=o.divisible?need/pack:Math.ceil((need-1e-9)/pack);buy=Math.min(Math.max(buy,minimum),available);
 const supplied=buy*pack;
 const basis=pricing(o);return {valid:true,buy,supplied,covered:Math.min(need,supplied),missing:Math.max(0,need-supplied),surplus:Math.max(0,supplied-need),total:round(buy*basis.price),effectivePrice:basis.price,priceBasis:basis.basis,issues};
}
function offerIssues(o){const out=[];
 if(o.quotedQty!==null&&!valid(o.quotedQty))out.push('Quantidade cotada inválida');
 if(o.quotedTotal!==null&&!valid(o.quotedTotal))out.push('Subtotal cotado inválido');
 if(valid(o.price)&&valid(o.quotedQty)&&valid(o.quotedTotal)&&Math.abs(round(o.price*o.quotedQty)-o.quotedTotal)>.02&&!pricing(o).rounding&&o.priceBasis!=='subtotal')out.push('Quantidade × preço difere do subtotal informado; escolha a base após conferir');
 return out;
}
function pendingInfo(s,i){const o=s.offers.find(o=>!o.rejected&&!o.components?.length&&o.itemId===i.id);const issues=o?specReview(o,i):null;return o?{offerId:o.id,original:o.description,price:o.price,quotedQty:o.quotedQty,pack:o.pack,unit:o.unit,reviewState:issues.conflicts.length?'Especificação diferente':'Oferta em revisão'}:{reviewState:s.offers.some(o=>!o.confirmed&&!o.rejected)?'Não identificado':'Não cotado'};}
function calculate(d){
 const carts=d.suppliers.map(s=>({supplierId:s.id,name:s.name,lines:[],subtotal:0,freight:s.freight,discount:s.discount,total:0,missingConditions:s.freight===null||s.discount===null}));
 const findCart=id=>carts.find(c=>c.supplierId===id);const remain=new Map(d.items.map(i=>[i.id,valid(i.qty)?i.qty:0]));const results=[],warnings=[];
 // Kits are an explicit manual purchase, shared cost recorded exactly once.
 for(const s of d.suppliers.filter(s=>d.cartMode!=='single'||s.id===d.singleSupplierId))for(const o of s.offers.filter(o=>o.components?.length&&d.bundles.includes(o.id))){
  const count=o.bundleBuy;const comps=o.components;const unique=new Set(comps.map(c=>c.itemId));
  if(!o.confirmed||o.rejected||!valid(o.price)||!valid(count)||count<=0||(!o.divisible&&!Number.isInteger(count))||!valid(o.min)||count<o.min||(o.stock!==null&&(!valid(o.stock)||count>o.stock))||unique.size!==comps.length||comps.some(c=>{const i=d.items.find(i=>i.id===c.itemId);return !i?.confirmed||unit(c.unit)!==unit(i.unit)||!valid(c.qty)||c.qty<=0;})){
   warnings.push('Kit inválido ou pendente: '+o.description);continue;
  }
  const cart=findCart(s.id);cart.lines.push({offerId:o.id,description:o.description,buy:count,price:o.price,total:round(count*o.price),bundle:true,components:clone(comps)});
  for(const c of comps)remain.set(c.itemId,Math.max(0,remain.get(c.itemId)-c.qty*count));
 }
 for(const i of d.items){
  let need=remain.get(i.id);const allocations=[];const candidates=[];
  for(const s of d.suppliers.filter(s=>d.cartMode!=='single'||s.id===d.singleSupplierId))for(const o of s.offers.filter(o=>!o.components?.length)){const r=cost(o,i,need);if(r.valid&&r.covered>0)candidates.push({s,o,r});}
  const choice=d.cartMode==='single'?'':d.choices[i.id];let used=new Set();let tied=false;
  while(need>1e-8){
   const available=candidates.filter(x=>!used.has(x.s.id)).map(x=>({...x,r:cost(x.o,i,need)})).filter(x=>x.r.covered>0);
   if(choice==='none')break;
   const chosen=choice?available.find(x=>x.o.id===choice):null;
   if(choice&&!chosen)break;
   available.sort((a,b)=>{
    const af=a.r.missing<1e-8,bf=b.r.missing<1e-8;if(af!==bf)return af?-1:1;
    const ca=af?a.r.total:a.r.total/a.r.covered,cb=bf?b.r.total:b.r.total/b.r.covered;
    return ca-cb||a.s.name.localeCompare(b.s.name,'pt-BR')||a.o.id.localeCompare(b.o.id);
   });
   const x=chosen||available[0];if(!x)break;
   if(available[1]&&Math.abs(available[0].r.total-available[1].r.total)<.005&&available[0].r.missing===available[1].r.missing)tied=true;
   allocations.push({supplierId:x.s.id,offerId:x.o.id,...x.r});
   findCart(x.s.id).lines.push({itemId:i.id,offerId:x.o.id,description:i.description,original:x.o.description,unit:i.unit,price:x.o.price,...x.r});
   need=Math.max(0,need-x.r.covered);used.add(x.s.id);if(choice)break;
  }
  results.push({itemId:i.id,description:i.description,qty:i.qty,unit:i.unit,confirmed:i.confirmed,allocations,missing:need,tied,invalid:!i.confirmed||!valid(i.qty)||i.qty<=0||!i.unit});
 }
 for(const c of carts){c.subtotal=round(c.lines.reduce((a,l)=>a+l.total,0));
  if(!c.lines.length){c.total=0;continue;}
  if((c.freight!==null&&!valid(c.freight))||(c.discount!==null&&!valid(c.discount))||(c.discount||0)>c.subtotal+(c.freight||0)){warnings.push('Condições comerciais inválidas: '+c.name);c.total=null;}
  else c.total=round(c.subtotal+(c.freight??0)-(c.discount??0));
 }
 const suppliers=d.suppliers.map(s=>{
  const rows=d.items.map(i=>{const opts=s.offers.filter(o=>!o.components?.length).map(o=>({o,r:cost(o,i)})).filter(x=>x.r.valid&&x.r.covered>0).sort((a,b)=>(a.r.missing>0)-(b.r.missing>0)||a.r.total-b.r.total);return {itemId:i.id,description:i.description,...(opts[0]?{...opts[0].r,offerId:opts[0].o.id,original:opts[0].o.description,price:opts[0].o.price,quotedQty:opts[0].o.quotedQty,pack:opts[0].o.pack,unit:opts[0].o.unit}:{valid:false,missing:i.qty,covered:0,total:0,...pendingInfo(s,i)})};});
  const imported=s.offers.reduce((a,o)=>a+(valid(o.quotedTotal)?o.quotedTotal:valid(o.price)&&valid(o.quotedQty)?round(o.price*o.quotedQty):0),0);
  return {id:s.id,name:s.name,rows,coverage:rows.filter(r=>r.valid&&r.missing<1e-8).length,missing:rows.filter(r=>!r.valid),partial:rows.filter(r=>r.valid&&r.missing>1e-8),pending:s.offers.filter(o=>!o.confirmed&&!o.rejected).length,subtotal:round(rows.reduce((a,r)=>a+r.total,0)),imported:round(imported),reported:s.reportedTotal,totalMismatch:s.reportedTotal!==null&&Math.abs(imported-s.reportedTotal)>.02,unpriced:s.offers.filter(o=>!valid(o.quotedTotal)&&!(valid(o.price)&&valid(o.quotedQty))).length};
 });
 const common=d.items.filter(i=>suppliers.every(s=>s.rows.some(r=>r.itemId===i.id&&r.valid&&r.missing<1e-8)));
 suppliers.forEach(s=>s.commonSubtotal=round(s.rows.filter(r=>common.some(i=>i.id===r.itemId)).reduce((a,r)=>a+r.total,0)));
 return {results,carts,suppliers,commonCount:common.length,warnings,total:carts.some(c=>c.total===null)?null:round(carts.reduce((a,c)=>a+c.total,0)),complete:d.items.length>0&&results.every(r=>!r.invalid&&r.missing<1e-8)&&!warnings.length,conditionsMissing:carts.some(c=>c.lines.length&&c.missingConditions),supplierCount:d.suppliers.length};
}
function parse(text,type,source='Texto'){ // All extraction remains editable, never auto-confirmed.
 if(root.SolarBudgetImport){const table=root.SolarBudgetImport.parseText(text,type,source);if(table)return table;}
 if(type==='list'&&root.SolarBudgetImport){const parsed=root.SolarBudgetImport.parseList(text,source);if(parsed)return parsed;}
 const rows=[],notes=[],lines=String(text).split(/\r?\n/);let headers=null,reportedTotal=null;
 for(let n=0;n<lines.length;n++){
  let raw=lines[n].trim().replace(/^\s*[-•–]\s+|^\d+[.)]\s+(?=\d)/,'');if(!raw)continue;
  const cells=raw.split(/\t|;|\|/).map(x=>x.trim());const normal=norm(raw);
  if(/^(?:lista|cotacao)(?: de)? materiais(?: eletricos)?$/.test(normal)){notes.push(raw);continue;}
  if(/^(?:valor )?total(?: geral| da cotacao)?\s*[:=]/i.test(raw)){const m=raw.match(/[:=]\s*(?:R\$\s*)?([\d.,]+)/i);if(m)reportedTotal=num(m[1]);notes.push(raw);continue;}
  if(cells.length>1&&cells.some(c=>/^(material|descricao|produto|item)$/i.test(norm(c)))&&cells.some(c=>/qtd|quant|preco|valor/.test(norm(c)))){headers=cells.map(norm);continue;}
  const r=type==='list'?item():offer();r.source=source+' · linha '+(n+1);r.original=raw;
  if(cells.length>1){
   const get=(re,fallback)=>{const ix=headers?.findIndex(h=>re.test(h));return ix>=0?cells[ix]:headers?undefined:cells[fallback];};
   r.description=get(/^(material|descricao|produto|item)$/,0)||raw;
   const q=num(get(/qtd|qntd|quant/,1));const u=unit(get(/^(un|und|unidade|medida)$/,2)||'');
   if(type==='list'){r.qty=q;r.unit=u;}
   else{r.quotedQty=q;r.unit=u;r.price=num(get(/unit|preco$/,3));r.quotedTotal=num(get(/total|subtotal/,4));}
  }else{
   const quantity=/^(\d+(?:[.,]\d+)?)\s*(m|metros?|un(?:idades?)?|und|kg|l|barras?|rolos?|pacotes?|conjuntos?|caixas?)\b\s*[-:x–]?\s*(.+)$/i.exec(raw);
   const trailing=/(?:\s[-–:]\s|\s)(\d+(?:[.,]\d+)?)\s*(metros?|m|un(?:idades?)?|und|kg|l|barras?|rolos?|pacotes?|conjuntos?|caixas?)\b/i.exec(raw);
   if(quantity){r.description=quantity[3];if(type==='list'){r.qty=num(quantity[1]);r.unit=unit(quantity[2]);}else{r.quotedQty=num(quantity[1]);r.unit=unit(quantity[2]);}}
   else{r.description=raw;if(trailing){r.description=raw.slice(0,trailing.index).trim();if(type==='list'){r.qty=num(trailing[1]);r.unit=unit(trailing[2]);}else{r.quotedQty=num(trailing[1]);r.unit=unit(trailing[2]);}}}
   if(type==='offer'){
    const money=[...raw.matchAll(/R\$\s*([\d.,]+)/gi)];
    const pu=/(?:unit[aá]rio|pre[cç]o(?:\s+unit[aá]rio)?)\s*[:=]?\s*(?:R\$\s*)?([\d.,]+)/i.exec(raw);
    const pt=/(?:subtotal|total)\s*[:=]?\s*(?:R\$\s*)?([\d.,]+)/i.exec(raw);
    r.price=pu?num(pu[1]):money.length?num(money[0][1]):null;
    r.quotedTotal=pt?num(pt[1]):money.length>1?num(money[money.length-1][1]):null;
    r.description=r.description.replace(/\s*(?:[-–:]\s*)?(?:R\$|pre[cç]o|unit[aá]rio|subtotal|total)\b.*$/i,'').trim();
   }
  }
  if(!r.description){notes.push('Linha '+(n+1)+' não reconhecida: '+raw);continue;}
  if(type==='list'&&r.qty===null)r.note='Quantidade não reconhecida. Confira a fonte.';
  if(type==='offer'&&r.price===null)r.note='Preço unitário não reconhecido. Confira a fonte.';
  // A quoted quantity is the initial purchase limit, subject to review; do not assume more stock.
  if(type==='offer'&&valid(r.quotedQty)){r.quoteLimit=r.quotedQty;r.stock=null;}
  rows.push(r);
 }
 return {rows,notes,reportedTotal,original:String(text),source};
}
function duplicates(old,rows){return rows.filter(r=>old.some(o=>norm(o.description)===norm(r.description)));}
function validate(d){
 if(!d||d.schema!=='solar-budget-v1'||!Array.isArray(d.items)||!Array.isArray(d.suppliers)||!Array.isArray(d.sources)||!Array.isArray(d.aliases)||!Array.isArray(d.bundles)||!d.choices||typeof d.choices!=='object'||!d.doc)throw Error('Backup incompatível ou incompleto.');
 if(d.items.length>2000||d.suppliers.length>100||d.suppliers.some(s=>!Array.isArray(s.offers)||s.offers.length>5000))throw Error('Arquivo acima dos limites de segurança.');
 const ids=new Set();for(const x of [...d.items,...d.suppliers,...d.suppliers.flatMap(s=>s.offers)]){if(typeof x.id!=='string'||ids.has(x.id))throw Error('Identificadores ausentes ou duplicados.');ids.add(x.id);}
 for(const i of d.items)if(typeof i.description!=='string'||typeof i.unit!=='string'||(i.qty!==null&&!valid(i.qty)))throw Error('Material inválido no backup.');
 for(const s of d.suppliers){if(typeof s.name!=='string')throw Error('Fornecedor inválido.');for(const o of s.offers)if(typeof o.description!=='string'||typeof o.unit!=='string'||!Array.isArray(o.components))throw Error('Oferta inválida.');}
 return clone(d);
}
const api={VERSION,uid,clone,norm,num,unit,round,valid,fresh,item,offer,supplier,suggest,specs,specReview,attributes,pricing,cost,offerIssues,calculate,parse,duplicates,validate};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SolarBudget=api;
})(typeof window!=='undefined'?window:globalThis);

