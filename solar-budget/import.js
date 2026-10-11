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
function pdfTable(page,source,type='offer'){
 const lines=geometryLines(page.items),header=lines.find(l=>l.items.some(i=>/^qt|^quant/.test(N(i.text)))&&l.items.some(i=>/^(descricao|discriminacao|produto|material|item)$/.test(N(i.text)))&&(type==='list'||l.items.some(i=>/unitario|pr unit|preco unit|valor unit/.test(N(i.text)))&&l.items.some(i=>/total/.test(N(i.text)))));if(!header)return null;
 const cols=header.items.map(i=>({...i,n:N(i.text),center:i.x+i.width/2}));
 const qty=cols.find(c=>/^qt|^quant/.test(c.n)),price=cols.find(c=>/unitario|pr unit|preco unit|valor unit/.test(c.n)),total=cols.filter(c=>/total/.test(c.n)).pop(),un=cols.find(c=>/^(un|um|und|unidade)$/.test(c.n)),desc=cols.find(c=>/^(descricao|discriminacao|produto|material|item)$/.test(c.n)),seq=cols.find(c=>/^(seq|sequencia|numero|n)$/.test(c.n));
 if(!qty||!desc||!un||(type==='offer'&&(!price||!total)))return null;
 const numeric=(line,col)=>{const next=cols.filter(c=>c.center>col.center).sort((a,b)=>a.center-b.center)[0],prev=cols.filter(c=>c.center<col.center).sort((a,b)=>b.center-a.center)[0];const a=prev?(prev.center+col.center)/2:col.x-10,b=next?(next.center+col.center)/2:page.width;const token=line.items.filter(i=>i.x+i.width/2>=a&&i.x+i.width/2<b&&/^\*?\d[\d.,]*\*?$/.test(i.text.trim())).sort((a,b)=>Math.abs(a.x+a.width/2-col.center)-Math.abs(b.x+b.width/2-col.center))[0];return token?E.num(token.text.replace(/\*/g,'')):null;};
 const boundary=cols.filter(c=>c.x>desc.x).sort((a,b)=>a.x-b.x)[0]?.x||qty.x;
 const idcol=cols.find(c=>/identificacao/.test(c.n)),brand=cols.find(c=>/marca/.test(c.n)),rows=[];
 for(const line of lines.filter(l=>l.y<header.y-5)){
  const q=numeric(line,qty),p=price?numeric(line,price):null,t=total?numeric(line,total):null,unitToken=line.items.find(i=>Math.abs(i.x-un.x)<8&&/^(m|mt|un|pc|pcs|br|rl|kg|cx|p[cç])$/i.test(i.text.trim())),sn=seq?line.items.find(i=>Math.abs(i.x-seq.x)<8&&/^\d+$/.test(i.text.trim())):null;
  if(q===null||(type==='offer'&&(p===null||t===null))||!unitToken||(seq&&!sn))continue;
  const value=(a,b)=>line.items.filter(i=>i.x>=a-2&&i.x<b-2).map(i=>i.text).join(' ').trim();
  let description=value(desc.x-6,boundary),short=idcol?value(idcol.x,cols.filter(c=>c.x>idcol.x).sort((a,b)=>a.x-b.x)[0]?.x):'';
  // Additional wrapped description/brand lines belong to the same row, never create a material.
  const below=lines.filter(l=>l.y<line.y-3&&l.y>line.y-10);for(const l of below){const text=l.items.filter(i=>i.x>=desc.x-2&&i.x<boundary-2).map(i=>i.text).join(' ');if(text&&!l.items.some(i=>seq&&Math.abs(i.x-seq.x)<8&&/^\d+$/.test(i.text)))description+=' '+text;}
  if(short&&!N(description).includes(N(short)))description=short+' / '+description;
  if(brand){const text=value(brand.x,cols.filter(c=>c.x>brand.x).sort((a,b)=>a.x-b.x)[0]?.x||qty.x);if(text&&!N(description).includes(N(text)))description+=' / '+text;}
  if(!description)continue;const r=type==='list'?E.item(description):E.offer(description),sale=E.unit(unitToken.text);Object.assign(r,{unit:({mt:'m',br:'barra',rl:'rolo',cx:'caixa'}[sale]||sale),source:source+' / linha '+(sn?sn.text:rows.length+1),original:line.text,sourceLine:sn?Number(sn.text):null});if(type==='list')r.qty=q;else Object.assign(r,{quotedQty:q,quotedTotal:t,price:p,saleUnit:r.unit,quoteLimit:q,stock:null});rows.push(r);
 }
 let reportedTotal=null;for(const l of lines){if(/(?:valor total|total de produtos|total a pagamento|total geral|total da cotacao)/.test(N(l.text))){const candidates=[l,...lines.filter(x=>x.y<l.y&&x.y>l.y-14)];for(const c of candidates){const matches=[...c.text.matchAll(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2})/g)];if(matches.length)reportedTotal=E.num(matches.at(-1)[1]);}}}
 return {rows,notes:rows.length?['Tabela reconhecida pelas colunas. Confira as associações, conversões e valores antes de aplicar.']:['Tabela reconhecida sem linhas válidas. Revise o arquivo.'],reportedTotal,source,original:lines.map(l=>l.text).join('\n')};
}
function consolidate(parsed){const rows=[];for(const o of parsed.flatMap(p=>p.rows)){const old=rows.find(x=>x.description===o.description&&x.unit===o.unit&&x.price===o.price&&x.sourceLine!==o.sourceLine&&x.quotedQty!==null&&o.quotedQty!==null);if(old){old.quotedQty+=o.quotedQty;old.quoteLimit=(old.quoteLimit??old.quotedQty-o.quotedQty)+(o.quoteLimit??o.quotedQty);old.quotedTotal=E.round(old.quotedTotal+o.quotedTotal);old.source+='; '+o.source;old.original+='\n'+o.original;}else rows.push(o);}return rows;}
function prepare(o,items,aliases){const candidates=E.suggest(o,items,aliases),top=candidates[0];if(!top)return o;
 if(top.score>=.36&&(!candidates[1]||top.score>candidates[1].score+.06)){o.itemId=top.id;const i=items.find(i=>i.id===top.id);const sale=o.saleUnit||o.unit;
  if(i.unit==='m'&&sale==='barra'){const length=/(\d+(?:[.,]\d+)?)\s*(?:m(?:etros?)?|MT)\b/i.exec(o.description);if(length){o.unit='m';o.pack=E.num(length[1]);o.note='Conversão sugerida: '+o.pack+'m por barra. Confira.';}}
  if(i.unit==='un'&&sale==='rolo'&&/fita/i.test(o.description)&&/fita/i.test(i.description)){o.unit='un';o.note='Uma unidade corresponde a um rolo. Confira comprimento e tipo.';}
  if(i.unit==='m'&&sale==='kg'){const factor=/(\d+(?:[.,]\d+)?)\s*KG\s*\/\s*(?:M|MT)\b/i.exec(o.description);if(factor){o.unit='m';o.pack=1/E.num(factor[1]);o.divisible=true;o.note='Conversão declarada '+factor[1]+'kg/m; preço por kg. Confira.';}}
  if(o.unit==='m'&&o.pack===1)o.divisible=true;
 }return o;
}
root.SolarBudgetImport={parseList,pdfTable,geometryLines,consolidate,prepare};if(typeof module!=='undefined')module.exports=root.SolarBudgetImport;
})(globalThis);

