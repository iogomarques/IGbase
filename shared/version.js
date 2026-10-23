/* Public release shared by the IG Base hub, subsites and new Budget documents. */
/* Next updates increment the last counter: 1.10.09 -> 1.11.00; no maximum release. */
(function(root){'use strict';
 const version='1.10.05';
 const release=Object.freeze({version,releaseId:version+'-2026-10-23',label:'IG Base v'+version});
 root.IGBaseRelease=release;
 if(typeof module!=='undefined'&&module.exports)module.exports=release;
 if(typeof document!=='undefined'){
  const update=()=>document.querySelectorAll('[data-ig-version]').forEach(el=>{el.textContent=release.label;});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',update,{once:true});else update();
 }
})(globalThis);
