// Single-file phone control page served at "/".
#pragma once
#include <Arduino.h>

static const char PHONE_PAGE[] PROGMEM = R"HTML(<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Projector</title>
<style>
  body{font-family:system-ui,sans-serif;margin:0;padding:16px;background:#111;color:#eee}
  h1{font-size:1.2rem;margin:0 0 12px}
  #state{padding:12px;border-radius:8px;background:#222;margin-bottom:16px;line-height:1.6}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  button{font-size:1.1rem;padding:20px 8px;border:0;border-radius:10px;color:#fff;background:#333}
  button:active{filter:brightness(1.4)}
  .on{background:#1b5e20}.off{background:#7f1d1d}.blank{background:#1e3a8a}.preset{background:#5b21b6}
  .wide{grid-column:span 2}
  #msg{min-height:1.4em;margin-top:12px;color:#fbbf24}
  .ok{color:#4ade80}.bad{color:#f87171}
</style></head><body>
<h1>Projector</h1>
<div id="state">Loading…</div>
<div class="grid">
  <button class="on" onclick="act('power/on')">Power On</button>
  <button class="off" onclick="if(confirm('Turn the projector off?'))act('power/off')">Power Off</button>
  <button class="blank wide" onclick="act('blank/toggle')">Blank / Show</button>
  <button class="preset" onclick="act('scene/toggle')">Lighting Preset</button>
  <button onclick="act('scene/normal')">Lights Normal</button>
</div>
<div id="msg"></div>
<script>
const $=id=>document.getElementById(id);
function key(force){
  let k=localStorage.getItem('apiKey');
  if(!k||force){k=prompt('Controller PIN / API key');if(k)localStorage.setItem('apiKey',k);}
  return k||'';
}
async function act(path){
  $('msg').textContent='Sending…';
  try{
    let r=await fetch('/api/'+path,{method:'POST',headers:{'X-Api-Key':key()}});
    if(r.status===401){r=await fetch('/api/'+path,{method:'POST',headers:{'X-Api-Key':key(true)}});}
    $('msg').textContent=r.ok?'Queued':'Error '+r.status+': '+((await r.json()).error||'');
    setTimeout(()=>$('msg').textContent='',2500);
    refresh();
  }catch(e){$('msg').textContent='Controller unreachable';}
}
async function refresh(){
  try{
    const s=await (await fetch('/api/status')).json();
    const link=s.link==='ok'?'<span class=ok>ok</span>':'<span class=bad>no response</span>';
    $('state').innerHTML='Power: <b>'+s.power+(s.transition?' (settling)':'')+'</b><br>'+
      'Image: <b>'+(s.blank===null?'—':s.blank?'blanked':'showing')+'</b><br>'+
      'Lighting: <b>'+s.scene+'</b>'+(s.lighting==='installed'?'':' (lights not installed)')+'<br>'+
      'Projector link: '+link;
  }catch(e){$('state').textContent='Controller unreachable';}
}
refresh();setInterval(refresh,2000);
</script></body></html>)HTML";
