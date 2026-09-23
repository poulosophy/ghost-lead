(() => {
  const G=GhostLead, $=id=>document.getElementById(id), KEY='ghost-lead-v01-shift';
  let state=G.cleanState(), demo=1065, live=false, storageOK=true;
  try {const saved=JSON.parse(localStorage.getItem(KEY)); if(saved?.version===1){state=G.cleanState(saved.tasks);demo=Number.isFinite(saved.demo)?Math.round(Math.min(G.END,Math.max(G.START,saved.demo))):1065;live=saved.live===true;}}catch{storageOK=false;}
  const slug=s=>s.toLowerCase().replaceAll(' ','-');
  function now(){const d=new Date();return live?d.getHours()*60+d.getMinutes():demo;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,tasks:state,demo,live}));storageOK=true;}catch{storageOK=false;} $('save-status').textContent=storageOK?'Changes saved on this browser.':'Browser storage unavailable. Changes last until this page closes.';}
  function setStatus(id,status){if(!G.tasks.some(t=>t.id===id)||!G.statuses.includes(status))throw new Error('Unknown task or status');state[id]=status;save();render();return {id,status};}
  $('tasks').innerHTML=G.phases.map((p,i)=>`<section class="task-group" aria-labelledby="phase-${i}"><div class="group-label"><span class="group-index">0${i+1}</span><h3 id="phase-${i}">${p.name}</h3><p>${G.formatTime(p.start)}–${G.formatTime(p.end)}</p><div id="group-count-${i}" class="group-count"></div></div><div class="task-list">${G.tasks.filter(t=>t.phase===i).map(t=>`<article id="card-${t.id}" class="task-card"><div class="task-meta"><span>${G.formatTime(t.time)}${t.id==='dinner'?'–4:30 PM':t.time===1260&&!t.milestone?'–10:00 PM':''}</span>${t.milestone?'<span class="milestone-tag">MILESTONE</span>':''}</div><h3>${t.title}</h3><p>${t.detail}</p><div class="task-bottom"><label for="state-${t.id}" class="sr-only">Status for ${t.title}</label><select id="state-${t.id}" data-task="${t.id}">${G.statuses.map(s=>`<option>${s}</option>`).join('')}</select><span class="task-timing" id="timing-${t.id}"></span></div></article>`).join('')}</div></section>`).join('');
  $('lanes').innerHTML=G.phases.map((p,i)=>`<div class="lane"><div class="phase-bar ${i===3?'final-bar':''}" style="left:${G.position(p.start)}%;width:${G.position(p.end)-G.position(p.start)}%"><div id="phase-fill-${i}" class="phase-fill"></div><span>${p.short}</span></div></div>`).join('');
  function render(){
    const time=now(), s=G.summarize(time,state), formatted=G.formatTime(time);
    $('clock').innerHTML=formatted.replace(/ (AM|PM)/,' <small>$1</small>');
    $('clock-label').textContent=live?'LIVE · DEVICE TIME':'DEMO CLOCK';
    $('shift-status').textContent=s.status;
    $('time-left').textContent=G.duration(s.remaining);
    $('close-left').textContent=time<G.CLOSE?`${G.duration(G.CLOSE-time)} until service closes`:'Customer-service window ended';
    $('next-title').textContent=s.next?.title||'End of the shift';
    $('next-note').textContent=s.next?.note||(s.open.length?`${s.open.length} tasks still open. Update them as the work finishes.`:'All tasks are marked Done.');
    $('next-time').textContent=s.next?G.formatTime(s.next.time):'10:00 PM';
    $('next-countdown').textContent=s.next?(s.next.time===time?'Now':`In ${G.duration(s.next.time-time)}`):'Schedule finished';
    $('now-marker').style.left=`${G.position(time)}%`;
    $('now-marker').querySelector('span').textContent=time<G.START?'BEFORE':time>G.END?'ENDED':'NOW';
    $('timeline').setAttribute('aria-label',`Shift timeline. ${formatted}. ${s.done} of ${G.tasks.length} tasks done.`);
    $('demo-time').value=live?Math.min(G.END,Math.max(G.START,time)):demo;
    $('demo-time').disabled=live;
    $('demo-output').textContent=formatted;
    $('live-toggle').textContent=live?'Use demo clock':'Use live clock';
    $('live-toggle').setAttribute('aria-pressed',String(live));
    $('clock-help').textContent=live?'Live time from this device':'Demo time · task states stay as you set them';
    $('work-count').textContent=`${s.open.length} / ${G.tasks.length}`;
    $('task-segments').innerHTML=G.tasks.map(t=>`<i class="${slug(state[t.id])}"></i>`).join('');
    $('work-note').textContent=`${s.done} done · ${s.blocked} blocked · ${s.extra} need more time`;
    $('remaining-label').textContent=G.duration(s.remaining);
    $('remaining-bar').style.width=`${s.remaining/(G.END-G.START)*100}%`;
    $('task-summary').textContent=`${s.done} of ${G.tasks.length} done · ${s.open.length} open`;
    G.phases.forEach((p,i)=>{const list=G.tasks.filter(t=>t.phase===i), done=list.filter(t=>state[t.id]==='Done').length;$(`phase-fill-${i}`).style.width=`${done/list.length*100}%`;$(`group-count-${i}`).textContent=`${done} of ${list.length} done`;});
    G.tasks.forEach(t=>{const status=state[t.id];$(`card-${t.id}`).className=`task-card ${slug(status)}`;$(`state-${t.id}`).value=status;$(`timing-${t.id}`).textContent=status==='Done'?'✓ Complete':status==='Blocked'?'Needs a hand':status==='Needs More Time'?'More time needed':time<t.time?`In ${G.duration(t.time-time)}`:time>t.end?'Still open':t.milestone?'Scheduled now':'In this window';});
  }
  $('tasks').addEventListener('change',e=>{if(e.target.dataset.task)setStatus(e.target.dataset.task,e.target.value);});
  $('demo-time').addEventListener('input',e=>{demo=Number(e.target.value);save();render();});
  $('live-toggle').addEventListener('click',()=>{live=!live;save();render();});
  $('reset').addEventListener('click',()=>{$('reset-dialog').showModal();});
  $('reset-dialog').addEventListener('close',()=>{if($('reset-dialog').returnValue==='reset'){state=G.cleanState();demo=G.START;live=false;save();render();}});
  window.addEventListener('storage',e=>{if(e.key===KEY){try{const v=JSON.parse(e.newValue);state=G.cleanState(v?.tasks);render();}catch{}}});
  setInterval(()=>{if(live)render();},15000);
  render();
  if(!storageOK)$('save-status').textContent='Browser storage unavailable. Changes last until this page closes.';
  if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'set_shift_task_status',title:'Update a shift task',description:'Set the status of a Ghost Lead task and save it in this browser.',inputSchema:{type:'object',properties:{id:{type:'string',enum:G.tasks.map(t=>t.id)},status:{type:'string',enum:G.statuses}},required:['id','status'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>setStatus(input?.id,input?.status)})).catch(()=>{});}catch{}}
})();
