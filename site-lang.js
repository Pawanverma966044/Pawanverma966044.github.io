/*
 * PAWANGAMINGSTUDIO local language switcher.
 * Hindi is the default. The translation map is bundled as a same-origin
 * project asset; no external translation service is used at runtime.
 */
(function(){
  'use strict';
  const KEY='rg_site_lang';
  const INDEX_KEY='rg_lang';
  const MAP_URL='site-lang-map.json';
  const normalize=s=>String(s==null?'':s).replace(/\s+/g,' ').trim();
  const preserve=(original,replacement)=>{
    const lead=(String(original).match(/^\s*/)||[''])[0];
    const tail=(String(original).match(/\s*$/)||[''])[0];
    return lead+replacement+tail;
  };
  const readKey=(k,fallback)=>{try{return localStorage.getItem(k)||fallback;}catch(e){return fallback;}};
  const writeKey=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
  let lang=readKey(KEY,readKey(INDEX_KEY,'hi'))==='en'?'en':'hi';
  writeKey(KEY,lang); writeKey(INDEX_KEY,lang);
  let map={};
  const textStates=[];
  const attrStates=[];
  let titleState=null;
  let ready=false;

  function skipNode(node){
    const p=node&&node.parentElement;
    return !p || p.closest('script,style,noscript,template,#siteLangToggle');
  }
  function collect(){
    textStates.length=0; attrStates.length=0;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;
    while(node=walker.nextNode()){
      if(skipNode(node))continue;
      const hi=String(node.nodeValue||'');
      const hit=map[normalize(hi)];
      if(hit&&hit!==normalize(hi))textStates.push({node,hi,en:hit});
    }
    document.querySelectorAll('input,textarea,button,a,img,meta[content],[title],[aria-label],[placeholder]').forEach(el=>{
      if(el.id==='siteLangToggle')return;
      ['placeholder','title','aria-label','alt','value','content'].forEach(attr=>{
        if(!el.hasAttribute(attr))return;
        const hi=el.getAttribute(attr)||''; const hit=map[normalize(hi)];
        if(hit&&hit!==normalize(hi))attrStates.push({el,attr,hi,en:hit});
      });
    });
    const t=document.title||''; const hit=map[normalize(t)];
    if(hit&&hit!==normalize(t))titleState={hi:t,en:hit};
  }
  function updateButton(){
    const b=document.getElementById('siteLangToggle')||document.getElementById('langBtn');
    if(!b)return;
    if(b.id==='siteLangToggle')b.textContent=lang==='hi'?'English':'हिन्दी';
    b.setAttribute('aria-label',lang==='hi'?'Switch to English':'हिन्दी में बदलें');
    b.title=lang==='hi'?'Switch language to English':'Switch language to Hindi';
  }
  function apply(){
    document.documentElement.lang=lang;
    textStates.forEach(x=>{if(x.node.isConnected)x.node.nodeValue=preserve(x.hi,lang==='en'?x.en:x.hi);});
    attrStates.forEach(x=>{if(x.el.isConnected)x.el.setAttribute(x.attr,lang==='en'?x.en:x.hi);});
    if(titleState)document.title=lang==='en'?titleState.en:titleState.hi;
    updateButton();
    document.dispatchEvent(new CustomEvent('site-language-change',{detail:{lang}}));
  }
  function setLanguage(next){
    lang=next==='en'?'en':'hi';
    writeKey(KEY,lang); writeKey(INDEX_KEY,lang);
    if(ready)apply();
  }
  function addButton(){
    const existing=document.getElementById('langBtn');
    if(existing){
      existing.addEventListener('click',()=>setTimeout(()=>setLanguage(readKey(INDEX_KEY,'hi')),0));
      return;
    }
    const b=document.createElement('button');
    b.id='siteLangToggle'; b.type='button'; b.className='site-lang-toggle';
    b.addEventListener('click',()=>setLanguage(lang==='hi'?'en':'hi'));
    document.body.appendChild(b);
    updateButton();
  }
  function addStyle(){
    if(document.getElementById('siteLangStyle'))return;
    const st=document.createElement('style'); st.id='siteLangStyle';
    st.textContent='#siteLangToggle{position:fixed;top:12px;right:12px;z-index:9999;border:1px solid #22d3ee;border-radius:999px;background:#120b20;color:#f4f1ff;padding:8px 13px;font:700 13px system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.28);cursor:pointer}#siteLangToggle:active{transform:scale(.96)}';
    document.head.appendChild(st);
  }
  function start(){
    addStyle(); addButton();
    fetch(MAP_URL,{cache:'force-cache'}).then(r=>r.ok?r.json():Promise.reject(new Error('language map unavailable'))).then(data=>{
      map=(data&&data.strings)||{}; collect(); ready=true; apply();
    }).catch(()=>{
      ready=true; updateButton();
    });
  }
  window.setSiteLanguage=setLanguage;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
