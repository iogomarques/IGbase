/* IG Base: navegação comum a todas as páginas (pedido do usuário, 05/11/2026).
   1. Links sem a tarja de endereço do navegador: o endereço sai do href (vai para data-ig-href) e a navegação é feita
      aqui. Ctrl/Cmd+clique, Shift+clique e o botão do meio continuam abrindo em outra aba. Links de download e blob:
      ficam como estão; os que abrem em outra aba continuam abrindo em outra aba.
   2. Menu "Sistemas" junto ao logo, em todas as páginas menos a inicial do IG Base: leva a qualquer sistema,
      Empresas e Suporte com um clique. */
(function(root){'use strict';
const SISTEMAS=[['/','IG Base (início)'],['/solar-organization/','Solar Organization'],['/solar-budget/','Solar Budget'],['/solar-distribution/','Solar Distribution'],['/empresas/','Empresas'],['/suporte/','Suporte']];
const naInicial=location.pathname==='/'||location.pathname==='/index.html';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- 1. Links sem a tarja do navegador ---------- */
function preparar(a){if(a.hasAttribute('download'))return;const h=a.getAttribute('href');if(h===null||/^(blob:|data:|javascript:)/i.test(h))return;
 a.setAttribute('data-ig-href',h);a.removeAttribute('href');if(!a.hasAttribute('role'))a.setAttribute('role','link');if(!a.hasAttribute('tabindex'))a.setAttribute('tabindex','0');}
function prepararTudo(raiz){if(raiz.nodeType!==1)return;if(raiz.matches('a[href]'))preparar(raiz);raiz.querySelectorAll('a[href]').forEach(preparar);}
function abrir(a,novaAba){const h=a.getAttribute('data-ig-href');if(h===null)return;if(novaAba)root.open(new URL(h,location.href).href,'_blank','noopener');else location.assign(h);}
/* Navega depois dos outros cliques da página: se algum deles cancelar (preventDefault), não navega, como no link normal. */
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[data-ig-href]');if(!a||e.button!==0)return;const nova=e.ctrlKey||e.metaKey||e.shiftKey||a.target==='_blank';setTimeout(()=>{if(!e.defaultPrevented)abrir(a,nova);},0);});
document.addEventListener('auxclick',e=>{const a=e.target.closest&&e.target.closest('a[data-ig-href]');if(a&&e.button===1){e.preventDefault();abrir(a,true);}});
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const a=e.target.closest&&e.target.closest('a[data-ig-href]');if(a&&e.target===a){e.preventDefault();a.click();}});

/* ---------- 2. Menu de sistemas junto ao logo ---------- */
function menu(){const d=document.createElement('details');d.className='ig-sistemas';const atual=SISTEMAS.filter(([p])=>p!=='/'&&location.pathname.startsWith(p)).map(([p])=>p)[0]||'';
 d.innerHTML='<summary aria-label="Ir para outro sistema">Sistemas <span aria-hidden="true">▾</span></summary><nav aria-label="Sistemas do IG Base">'+SISTEMAS.map(([p,n])=>'<a href="'+p+'"'+(p===atual?' aria-current="page"':'')+'>'+esc(n)+'</a>').join('')+'</nav>';
 prepararTudo(d);return d;}
function instalarMenu(){if(naInicial)return;for(const b of document.querySelectorAll('.brand,.ig-brand')){const caixa=b.matches('a')?b.parentElement:b;if(!caixa||caixa.querySelector(':scope > .ig-sistemas'))continue;const m=menu();if(b.matches('a'))b.after(m);else b.append(m);}}
document.addEventListener('click',e=>{for(const d of document.querySelectorAll('.ig-sistemas[open]'))if(!d.contains(e.target))d.open=false;});
document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const d of document.querySelectorAll('.ig-sistemas[open]'))d.open=false;});

/* As páginas redesenham partes da tela: aplica de novo no que aparecer. */
function iniciar(){prepararTudo(document.body);instalarMenu();new MutationObserver(ms=>{let novo=false;for(const m of ms){if(m.type==='attributes'){if(m.target.matches('a[href]'))preparar(m.target);continue;}for(const n of m.addedNodes){if(n.nodeType===1){prepararTudo(n);novo=true;}}}if(novo)instalarMenu();}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});}
if(document.body)iniciar();else document.addEventListener('DOMContentLoaded',iniciar);
})(globalThis);
