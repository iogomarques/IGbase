/* Solar Budget: editable extraction from text and native PDF tables. No supplier-specific prices or materials. */
(function(root){'use strict';const E=root.SolarBudget,N=E.norm;
const tidy=t=>String(t||'').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/[\p{Extended_Pictographic}\uFE0F]/gu,'').replace(/[*_`]/g,'').replace(/[\u200b\ufeff]/g,'').replace(/^\s*(?:[-•]|#+)\s*/,'').trim();
function parseList(text,source){
 if(/[;\t]/.test(text)||!/(?:mm[²2]\s*:|\d+\s*x\s*\d+|\|\s*\d+|\s\+\s|^\s*(?:#+|\d+\.)\s*[A-ZÀ-Ý]|conduletes.*total)/im.test(text))return null;
 const rows=[],notes=[],lines=String(text).split(/\r?\n/);let section='',context='',previous='';
 const add=(desc,q,u,raw,line,note='')=>{const i=E.item(desc.replace(/\s+/g,' ').trim());Object.assign(i,{qty:q,unit:E.unit(u),source:source+' / linha '+line,original:raw,note,group:section});rows.push(i);};
 for(const [ix,input] of lines.entries()){
  let raw=tidy(input);const n=N(raw);if(!raw||/^[-_\s]+$/.test(raw))continue;
  if(/^(ficamos|atenciosamente|aguardamos|obrigado|ig solar\s*ivoney)/.test(n))break;
  if(/^\d+\.\s*\D/.test(raw)||/^(cabos eletricos|quadros de distribuicao|infraestrutura|acabamentos|kit aterramento|lote de luminarias)/.test(n)){section=raw.replace(/^\d+\.\s*/,'');context='';continue;}
  if(/^(material|descricao|produto|item)\s*[;\t|]/i.test(raw))return null;
  const line=ix+1,roll=/rolos? de\s*(\d+)\s*m/i.exec(section),cable=/^([\d.,]+)\s*mm[²2]\s*:\s*(.+)$/i.exec(raw);
  if(cable){for(const part of cable[2].split(/\|/)){const m=/^(\d+)\s*rolos?\s+(.+)$/i.exec(part.trim());if(m)add('Cabo '+cable[1]+' mm² '+m[2]+' / '+section.replace(/^cabos el[eé]tricos flex[ií]veis\s*/i,''),E.num(m[1])*(roll?Number(roll[1]):1),roll?'m':'rolo',raw,line,roll?'Pedido em rolos de '+roll[1]+'m.':'');else add(raw,null,'',raw,line,'Variante não reconhecida.');}continue;}
  const grouped=/^([^:]+):\s*(.+)$/.exec(raw);
  if(grouped&&!/^\d+\s*(un|unidades?|barras?|rolos?)/i.test(raw)&&/\|/.test(grouped[2])){let count=0;for(const part of grouped[2].split('|')){const m=/^(\d+(?:[.,]\d+)?)\s*(m|metros?|unidades?|un)?\s*(?:de\s+)?(.+)$/i.exec(part.trim());if(m){add(grouped[1]+' '+m[3],E.num(m[1]),m[2]||'un',raw,line);count++;}}if(count)continue;}
  if(grouped&&/\(total\s*:/i.test(grouped[1])){context=grouped[1].replace(/\s*\(total.*$/i,'');continue;}
  if(/^conduletes.*total/i.test(raw)){context=raw.replace(/\s*\(total.*$/i,'');const count=/total:\s*(\d+)/i.exec(raw);if(count&&/tampa/i.test(raw))add('Tampas compatíveis com '+context,Number(count[1]),'un',raw,line,'Confirme compatibilidade e fornecimento separado ou no conjunto.');if(/parafus/i.test(raw))add('Parafusos para tampas de '+context,null,'un',raw,line,'Quantidade e inclusão no conjunto a confirmar.');notes.push(raw+' / confira tampas e parafusos nas ofertas.');continue;}
  if(/^fixacao\b/.test(n)){add(raw.replace(/^[^:]+:\s*/,''),null,'un',raw,line,'Quantidade não definida no pedido.');continue;}
  raw=raw.replace(/^[A-Za-zÀ-ÿ\s]+:\s*(?=\d+\s+[A-Za-zÀ-ÿ])/,'');
  let q=/^(\d+(?:[.,]\d+)?)\s*(un|unidades?|barras?|rolos?|metros?|m|kg|conjuntos?)\b\s*[-–:]?\s*(.+)$/i.exec(raw);
  if(!q){const implicit=/^(\d+)\s+((?:Luvas|Conectores|Suspensores|Parafusos|Hastes|Disjuntores|DPS)\b.*)$/i.exec(raw);if(implicit)q=[raw,implicit[1],'un',implicit[2]];}
  if(q){
   const qty=E.num(q[1]),u=q[2],desc=q[3],nested=/^([^:]+):\s*(.+)$/.exec(desc);
   if(nested&&/\d+\s*x\s*\d+/i.test(nested[2])){let sum=0;const start=rows.length;for(const p of nested[2].split(/[|+]/)){const m=/^\s*(\d+)\s*x\s*(.+)$/i.exec(p);if(m){sum+=Number(m[1]);const label=/^IDR/i.test(m[2])?m[2]:'Disjuntor '+m[2];add(label+' / '+section.replace(/^.*?\(([^)]*)\)\s*/, '$1 ').replace(/Padrão\s*/i,''),Number(m[1]),'un',raw,line);}}if(sum!==qty){const note=nested[1]+': título '+qty+', parcelas '+sum+'. Confirme a quantidade.';notes.push(note);rows.slice(start).forEach(i=>{i.note=note;i.reviewRequired=true;});}continue;}
   const parts=/^conjunto\b/i.test(desc)?[desc]:desc.split(/\s*\+\s*/);const lighting=/luminarias/i.test(N(section))?' / '+section.replace(/^.*?\(/,'('):'';const assembly=/^(.*)\s+com\s+(Barramento\b.*)$/i.exec(parts[0]);if(assembly){add(assembly[1],qty,u,raw,line);add(assembly[2],qty,'un',raw,line,'Composição do quadro a confirmar.');}else add((context&&/^tipo\s+/i.test(desc)?context+' ':'')+parts[0]+lighting,qty,u,raw,line);
   for(const part of parts.slice(1)){const pair=/^(\d+)\s*conjuntos?\s+de\s+(Bucha)\s+e\s+(Arruela)(.*)$/i.exec(part);if(pair){for(const name of [pair[2],pair[3]])add(name+pair[4],Number(pair[1]),'un',raw,line,'Componente de conjunto solicitado.');continue;}const sub=/^(\d+(?:[.,]\d+)?)\s*(m|metros?|un|unidades?|barras?|rolos?)?\s*(.+)$/i.exec(part);if(sub){if(/parafusos.*porca\/arruela/i.test(sub[3])){for(const name of ['Parafuso lentilha','Porca para parafuso lentilha','Arruela para parafuso lentilha'])add(name,E.num(sub[1]),'un',raw,line);}else add(sub[3],E.num(sub[1]),sub[2]||'un',raw,line);}else add(part,/^Geral\b/i.test(part)?qty:null,'un',raw,line,'Quantidade/composição do conjunto a confirmar.');}
   previous=desc;continue;
  }
  const heading=/^([^:]+):\s*$/.exec(raw);if(heading){context=heading[1];continue;}
  if(/^(?:\d+\s+)?[A-ZÀ-Ý][A-ZÀ-Ý\s()–-]+$/.test(raw)){section=raw;continue;}
  add(raw,null,'',raw,line,'Quantidade não reconhecida; revise a fonte.');
 }
 // Consolidate repeated needs only when descriptions and units match exactly.
 const combined=[];for(const i of rows){const old=combined.find(x=>N(x.description)===N(i.description)&&x.unit===i.unit&&x.qty!==null&&i.qty!==null);if(old){old.qty+=i.qty;old.original+='\n'+i.original;old.source+='; '+i.source;}else combined.push(i);}
 return combined.length?{rows:combined,notes,reportedTotal:null,original:String(text),source}:null;
}
function geometryLines(items){const sorted=items.filter(i=>String(i.text||i.str||'').trim()).map(i=>({text:i.text??i.str,x:i.x??i.transform[4],y:i.y??i.transform[5],width:i.width||0,height:i.height||8})).sort((a,b)=>b.y-a.y||a.x-b.x),lines=[];
 for(const i of sorted){let l=lines.find(l=>Math.abs(l.y-i.y)<3.1);if(!l){l={y:i.y,items:[]};lines.push(l);}l.items.push(i);}for(const l of lines){l.items.sort((a,b)=>a.x-b.x);l.text=l.items.map(i=>i.text).join(' ');}return lines.sort((a,b)=>b.y-a.y);}
function pdfTableLegacy(page,source,type='offer'){
 const lines=geometryLines(page.items),header=lines.find(l=>l.items.some(i=>/^qt|^quant/.test(N(i.text)))&&l.items.some(i=>/^(descricao|discriminacao|produto|material|item)$/.test(N(i.text)))&&(type==='list'||l.items.some(i=>/unitario|pr unit|preco unit|valor unit/.test(N(i.text)))&&l.items.some(i=>/total/.test(N(i.text)))));if(!header)return null;
 const cols=header.items.map(i=>({...i,n:N(i.text),center:i.x+i.width/2}));
 const qty=cols.find(c=>/^qt|^quant/.test(c.n)),price=cols.find(c=>/unitario|pr unit|preco unit|valor unit/.test(c.n)),total=cols.filter(c=>/total/.test(c.n)).pop(),un=cols.find(c=>/^(un|um|und|unidade)$/.test(c.n)),desc=cols.find(c=>/^(descricao|discriminacao|produto|material|item)$/.test(c.n)),seq=cols.find(c=>/^(seq|sequencia|numero|n)$/.test(c.n));
 if(!qty||!desc||!un||(type==='offer'&&(!price||!total)))return null;
 const numeric=(line,col)=>{const next=cols.filter(c=>c.center>col.center).sort((a,b)=>a.center-b.center)[0],prev=cols.filter(c=>c.center<col.center).sort((a,b)=>b.center-a.center)[0];const a=prev?(prev.center+col.center)/2:col.x-10,b=next?(next.center+col.center)/2:page.width;const token=line.items.filter(i=>i.x+i.width/2>=a&&i.x+i.width/2<b&&/^\*?\d[\d.,]*\*?$/.test(i.text.trim())).sort((a,b)=>Math.abs(a.x+a.width/2-col.center)-Math.abs(b.x+b.width/2-col.center))[0];return token?E.num(token.text.replace(/\*/g,'')):null;};
 const boundary=cols.filter(c=>c.x>desc.x).sort((a,b)=>a.x-b.x)[0]?.x||qty.x;
 const idcol=cols.find(c=>/identificacao/.test(c.n)),brand=cols.find(c=>/marca/.test(c.n)),rows=[];
 for(const line of lines.filter(l=>l.y<header.y-5)){
  const q=numeric(line,qty),p=price?numeric(line,price):null,t=total?numeric(line,total):null,unitToken=line.items.find(i=>Math.abs(i.x-un.x)<8&&/^(m|mt|un|pc|pcs|br|rl|kg|cx|p[cç])$/i.test(i.text.trim())),sn=seq?line.items.find(i=>Math.abs(i.x-seq.x)<8&&/^\d+$/.test(i.text.trim())):null;
  if((seq&&!sn)||(type==='list'?q===null:q===null&&p===null&&t===null))continue;
  const value=(a,b)=>line.items.filter(i=>i.x>=a-2&&i.x<b-2).map(i=>i.text).join(' ').trim();
  let description=value(desc.x-6,boundary),short=idcol?value(idcol.x,cols.filter(c=>c.x>idcol.x).sort((a,b)=>a.x-b.x)[0]?.x):'';
  // Additional wrapped description/brand lines belong to the same row, never create a material.
  const below=lines.filter(l=>l.y<line.y-3&&l.y>line.y-10);for(const l of below){const text=l.items.filter(i=>i.x>=desc.x-2&&i.x<boundary-2).map(i=>i.text).join(' ');if(text&&!l.items.some(i=>seq&&Math.abs(i.x-seq.x)<8&&/^\d+$/.test(i.text)))description+=' '+text;}
  if(short&&!N(description).includes(N(short)))description=short+' / '+description;
  if(brand){const text=value(brand.x,cols.filter(c=>c.x>brand.x).sort((a,b)=>a.x-b.x)[0]?.x||qty.x);if(text&&!N(description).includes(N(text)))description+=' / '+text;}
  if(!description)continue;const r=type==='list'?E.item(description):E.offer(description),sale=E.unit(unitToken?.text||'');Object.assign(r,{unit:({mt:'m',br:'barra',rl:'rolo',cx:'caixa'}[sale]||sale),source:source+' / linha '+(sn?sn.text:rows.length+1),original:line.text,sourceLine:sn?Number(sn.text):null});if(type==='list')r.qty=q;else Object.assign(r,{quotedQty:q,quotedTotal:t,price:p,saleUnit:r.unit,quoteLimit:q,stock:null});if(!r.unit||q===null||type==='offer'&&p===null)r.note='Campos da tabela não reconhecidos. Confira a origem antes de confirmar.';rows.push(r);
 }
 let reportedTotal=null;for(const l of lines){if(/(?:valor total|total d[eo]s? produtos|total a pagamento|total geral|total da cotacao|total do orcamento)/.test(N(l.text))){const candidates=[l,...lines.filter(x=>x.y<l.y&&x.y>l.y-14)];for(const c of candidates){const matches=[...c.text.matchAll(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/g)];if(matches.length)reportedTotal=E.num(matches.at(-1)[1]);}}}
 return {rows,notes:rows.length?['Tabela reconhecida pelas colunas. Confira as associações, conversões e valores antes de aplicar.']:['Tabela reconhecida sem linhas válidas. Revise o arquivo.'],reportedTotal,source,original:lines.map(l=>l.text).join('\n')};
}
function consolidate(parsed){const rows=[];for(const o of parsed.flatMap(p=>p.rows)){const document=s=>String(s||'').split(/ · página | \/ página | \/ linha /)[0];const old=rows.find(x=>x.description===o.description&&x.unit===o.unit&&x.price===o.price&&document(x.source)===document(o.source)&&x.sourceLine!=null&&o.sourceLine!=null&&x.source!==o.source&&x.quotedQty!==null&&o.quotedQty!==null&&x.quotedTotal!==null&&o.quotedTotal!==null);if(old){old.quotedQty+=o.quotedQty;old.quoteLimit=(old.quoteLimit??old.quotedQty-o.quotedQty)+(o.quoteLimit??o.quotedQty);old.quotedTotal=E.round(old.quotedTotal+o.quotedTotal);old.source+='; '+o.source;old.original+='\n'+o.original;}else rows.push(o);}return rows;}
function prepare(o,items,aliases){const candidates=E.suggest(o,items,aliases),top=candidates[0];if(!top)return o;
 if(top.score>=.36&&(!candidates[1]||top.score>candidates[1].score+.06)){o.itemId=top.id;const i=items.find(i=>i.id===top.id);const sale=o.saleUnit||o.unit;
  if(i.unit==='m'&&sale==='barra'){const length=/(\d+(?:[.,]\d+)?)\s*(?:m(?:etros?)?|MT)\b/i.exec(o.description);if(length){o.unit='m';o.pack=E.num(length[1]);o.note='Conversão sugerida: '+o.pack+'m por barra. Confira.';}}
  if(i.unit==='un'&&sale==='rolo'&&/fita/i.test(o.description)&&/fita/i.test(i.description)){o.unit='un';o.note='Uma unidade corresponde a um rolo. Confira comprimento e tipo.';}
  if(i.unit==='m'&&sale==='kg'){const factor=/(\d+(?:[.,]\d+)?)\s*KG\s*\/\s*(?:M|MT)\b/i.exec(o.description);if(factor){o.unit='m';o.pack=1/E.num(factor[1]);o.divisible=true;o.note='Conversão declarada '+factor[1]+'kg/m; preço por kg. Confira.';}}
  if(o.unit==='m'&&o.pack===1)o.divisible=true;
 }return o;
}
// Recognize structure, never supplier names. Blank fields remain blank for review.
function column(text){const n=N(text).replace(/\s+/g,' ').replace(/ (?:r|brl|reais)$/,'');if(/^(descricao(?: d[oa]s? (?:produtos?|materiais|material|itens|item))?|nome(?: do (?:produto|material|item))?|denominacao|detalhamento|discriminacao|material|produto|item|description|product|desc|especificacao)$/.test(n))return 'description';if(/^(qtd|qtde|qde|qntd|qnt|qt|qt un|quant|quantidade|quantity|qty)$/.test(n))return 'qty';if(/^(un|und|unid|um|u m|unidade|medida|unit|uom)$/.test(n))return 'unit';if(/^(subtotal|sub total|total|valor total|vl total|v total|preco total|amount|line total)$/.test(n))return 'total';if(/^(preco|valor|unitario|preco unitario|valor unitario|vl unit|v unit|pr unit|p unit|unit price|price|rate|preco un|valor un|valor unit|preco unit)$/.test(n))return 'price';return '';}
function amount(value){const s=String(value??'').trim().replace(/(?:R\$|BRL|USD|EUR|US\$|[$€])|\s/g,'');if(!s)return null;if(!/^-?[\d.,]+$/.test(s))return null;if(s.includes(',')&&s.includes('.'))return Number(s.lastIndexOf('.')>s.lastIndexOf(',')?s.replace(/,/g,''):s.replace(/\./g,'').replace(',','.'));return E.num(s);}
function cells(raw,delimiter){const out=[];let current='',quoted=false;for(let n=0;n<raw.length;n++){const c=raw[n];if(c==='"'&&(quoted||!current.trim())){if(quoted&&raw[n+1]==='"'){current+='"';n++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){out.push(current.trim());current='';}else current+=c;}out.push(current.trim());return out;}
function parseText(text,type,source='Texto'){
 const lines=String(text).replace(/^\ufeff/,'').split(/\r?\n/),rows=[],notes=[];let headers=null,delimiter=null,reportedTotal=null;
 for(let ix=0;ix<lines.length;ix++){
  const raw=lines[ix].trim();if(!raw)continue;
  if(/^\s*\|?\s*:?-{3}/.test(raw))continue;
  const total=/^(?:valor\s+)?(?:total geral|total da cotação|total do orçamento|grand total|total)\s*[:=]\s*(.+)$/i.exec(raw);if(total){reportedTotal=amount(total[1]);notes.push(raw);continue;}
  let parts;
  if(!headers){for(const d of ['\t',';','|',',']){const p=cells(raw,d);if(p[0]===''&&d==='|')p.shift();if(p.at(-1)===''&&d==='|')p.pop();const keys=p.map(column);if(keys.includes('description')&&(keys.includes('qty')||type==='offer'&&keys.includes('price'))){headers=keys;delimiter=d;parts=p;break;}}if(headers)continue;}
  if(headers){parts=cells(raw,delimiter);if(parts[0]===''&&delimiter==='|')parts.shift();if(parts.at(-1)===''&&delimiter==='|')parts.pop();if(parts.map(column).includes('description'))continue;const get=k=>parts[headers.indexOf(k)]??'',description=get('description');if(!description){notes.push('Linha '+(ix+1)+' sem descrição: '+raw);continue;}if(/^(total|subtotal|frete|desconto|impostos|taxes|shipping|grand total)\b/.test(N(description))){notes.push('Condição comercial, confira separadamente: '+raw);continue;}const r=type==='list'?E.item(description):E.offer(description);Object.assign(r,{source:source+' / linha '+(ix+1),original:raw,unit:E.unit(get('unit'))});if(type==='list')r.qty=amount(get('qty'));else Object.assign(r,{quotedQty:amount(get('qty')),price:amount(get('price')),quotedTotal:amount(get('total')),saleUnit:r.unit,quoteLimit:amount(get('qty')),stock:null});if(parts.length!==headers.length||!r.unit||(type==='list'?r.qty===null:r.price===null||r.quotedQty===null))r.note='Campos ausentes ou colunas divergentes. Confira a origem antes de confirmar.';rows.push(r);}
 }
 if(headers)return {rows,notes,reportedTotal,source,original:String(text)};
 // A labelled item per block, common in email/WhatsApp quotations.
 if(type==='offer'&&/(?:quantidade|qtd|qty)\s*[:=]/i.test(text)&&/(?:produto|material|descri[cç][aã]o|item)\s*[:=]/i.test(text)){
  let current=null;for(const [ix,line] of lines.entries()){const pair=/^\s*([^:=]+)\s*[:=]\s*(.*)$/.exec(tidy(line));if(!pair)continue;const key=column(pair[1]);if(key==='description'){current=E.offer(pair[2]);Object.assign(current,{source:source+' / linha '+(ix+1),original:line});rows.push(current);}else if(current&&key){current.original+='\n'+line;if(key==='qty')current.quotedQty=amount(pair[2]);if(key==='price')current.price=amount(pair[2]);if(key==='total')current.quotedTotal=amount(pair[2]);if(key==='unit')current.unit=E.unit(pair[2]);}else notes.push('Confira informação: '+line);}
  for(const r of rows){r.saleUnit=r.unit;r.quoteLimit=r.quotedQty;r.stock=null;if(!r.unit||r.price===null||r.quotedQty===null)r.note='Informações incompletas; revise a fonte.';}return {rows,notes,reportedTotal,source,original:String(text)};
 }
 return null;
}
function pdfTable(page,source,type='offer'){
 const old=pdfTableLegacy(page,source,type);if(old?.rows.length||old?.reportedTotal!=null)return old;
 const lines=geometryLines(page.items);let columns=null,header=null;
 for(const line of lines){const tokens=line.items,cols=[];for(let k=0;k<tokens.length;k++){let found=null;for(let count=Math.min(3,tokens.length-k);count>=1;count--){const slice=tokens.slice(k,k+count);if(slice.some((t,i)=>i&&t.x-(slice[i-1].x+slice[i-1].width)>22))continue;const key=column(slice.map(t=>t.text).join(' '));if(key){found={key,x:tokens[k].x,center:(tokens[k].x+slice.at(-1).x+slice.at(-1).width)/2};k+=count-1;break;}}if(found)cols.push(found);}if(cols.some(c=>c.key==='description')&&cols.some(c=>c.key==='qty')&&(type==='list'||cols.some(c=>c.key==='price'||c.key==='total'))){columns=cols.sort((a,b)=>a.x-b.x);header=line;break;}}
 if(!columns)return null;const rows=[],notes=[];let reportedTotal=null;
 const values=line=>{const result={};for(let k=0;k<columns.length;k++){const c=columns[k],prev=columns[k-1],next=columns[k+1],a=c.key==='description'?c.x-6:prev?(prev.center+c.center)/2:0,b=next?(c.key==='description'?next.x-4:(c.center+next.center)/2):page.width;result[c.key]=line.items.filter(i=>(c.key==='description'?i.x:i.x+i.width/2)>=a&&(c.key==='description'?i.x:i.x+i.width/2)<b).map(i=>i.text).join(' ').trim();}return result;};
 for(const [ix,line] of lines.entries()){
  if(line.y>=header.y-4)continue;const n=N(line.text);if(/^(?:valor )?(?:total geral|total de produtos|grand total|total da cotacao)\b/.test(n)){const money=[...line.text.matchAll(/(?:R\$\s*)?(\d[\d.,]*)/g)];if(money.length)reportedTotal=amount(money.at(-1)[1]);continue;}
  if(/^(?:frete|desconto|impostos|observacoes|condicoes|validade|prazo|pagamento)\b/.test(n)){notes.push('Condição comercial: '+line.text);continue;}
  const v=values(line),q=amount(v.qty),p=amount(v.price),t=amount(v.total);if(!v.description||(type==='list'?q===null:q===null&&p===null&&t===null))continue;
  if(column(v.description))continue;let description=v.description,original=line.text;
  for(let next=ix+1;next<lines.length&&line.y-lines[next].y<30;next++){const wrap=values(lines[next]);if(amount(wrap.qty)!==null||amount(wrap.price)!==null||amount(wrap.total)!==null||!wrap.description||/^(?:total|frete|desconto|observacoes|condicoes|validade|prazo|pagamento)\b/.test(N(lines[next].text)))break;description+=' '+wrap.description;original+='\n'+lines[next].text;}
  const r=type==='list'?E.item(description):E.offer(description);Object.assign(r,{unit:E.unit(v.unit||''),source:source+' / linha '+(ix+1),sourceLine:ix+1,original});if(type==='list')r.qty=q;else Object.assign(r,{quotedQty:q,price:p,quotedTotal:t,quoteLimit:q,saleUnit:r.unit,stock:null});if(!r.unit||(type==='offer'&&p===null))r.note='Unidade ou preço ausente: confira a fonte. Não foi inferido.';rows.push(r);
 }
 return {rows,notes:[...notes,'Colunas reconhecidas; confirme campos e associações.'],reportedTotal,source,original:lines.map(l=>l.text).join('\n')};
}
root.SolarBudgetImport={parseList,parseText,pdfTable,geometryLines,consolidate,prepare,amount,column};if(typeof module!=='undefined')module.exports=root.SolarBudgetImport;
})(globalThis);

