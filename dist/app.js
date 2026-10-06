(() => {
  const G=GhostLead, $=id=>document.getElementById(id), KEY='ghost-lead-v01-shift';
  let state=G.cleanState(), dependencies=G.cleanDependencies(), demo=1065, live=false, storageOK=true;
  try {const saved=JSON.parse(localStorage.getItem(KEY)); if(saved?.version===1){state=G.cleanState(saved.tasks);dependencies=G.cleanDependencies(saved.dependencies);demo=Number.isFinite(saved.demo)?Math.round(Math.min(G.END,Math.max(G.START,saved.demo))):1065;live=saved.live===true;}}catch{storageOK=false;}

  const cloud=window.GhostCloud;
  let instructionsLoaded=false;
  let instructions={};
  const cleanInstructions=raw=>Object.fromEntries(G.tasks.map(t=>[t.id,typeof raw?.[t.id]==='string'?raw[t.id]:'']));
  instructions=cleanInstructions();
  function renderInstructions(){
    G.tasks.forEach(t=>{
      $('instructions-preview-'+t.id).textContent=instructions[t.id]||(instructionsLoaded?'No instructions added yet.':'Instructions have not loaded yet.');
      $('instructions-full-'+t.id).textContent=instructions[t.id]||(instructionsLoaded?'No instructions added yet.':'Instructions have not loaded yet.');
    });
  }
  const slug=s=>s.toLowerCase().replaceAll(' ','-');
  function now(){const d=new Date();return live?d.getHours()*60+d.getMinutes():demo;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,tasks:state,dependencies,demo,live}));storageOK=true;}catch{storageOK=false;} $('save-status').textContent=storageOK?'Changes saved on this browser.':'Browser storage unavailable. Changes last until this page closes.';}
  function setStatus(id,status){if(!G.tasks.some(t=>t.id===id)||!G.statuses.includes(status))throw new Error('Unknown task or status');state[id]=status;if(status!=='Dependency')dependencies[id]="";save();render();return {id,status};}
  $('tasks').innerHTML=G.phases.map((p,i)=>`<section class="task-group" aria-labelledby="phase-${i}"><div class="group-label"><span class="group-index">0${i+1}</span><h3 id="phase-${i}">${p.name}</h3><p>${G.formatTime(p.start)}–${G.formatTime(p.end)}</p><div id="group-count-${i}" class="group-count"></div></div><div class="task-list">${G.tasks.filter(t=>t.phase===i).map(t=>`<article id="card-${t.id}" class="task-card"><span class="vertical-time">${G.formatTime(t.time)}</span><div class="task-meta"><span>${G.formatTime(t.time)}${t.phase===1?'–4:30 PM':t.time===1260&&!t.milestone?'–10:00 PM':''}</span>${t.milestone?'<span class="milestone-tag">MILESTONE</span>':''}</div><h3>${t.title}</h3><p>${t.detail}</p><div class="task-bottom"><label for="state-${t.id}" class="sr-only">Status for ${t.title}</label><select id="state-${t.id}" data-task="${t.id}">${G.statuses.map(s=>`<option>${s}</option>`).join('')}</select><span class="task-timing" id="timing-${t.id}"></span></div><div id="dependency-wrap-${t.id}" class="dependency-field" hidden><label for="dependency-${t.id}">Dependency for ${t.title}</label><select id="dependency-${t.id}" data-dependency="${t.id}" aria-describedby="dependency-detail-${t.id}"><option value="">Choose a dependency…</option>${G.dependencyOptions.map(reason=>`<option>${reason}</option>`).join('')}</select><p id="dependency-detail-${t.id}" class="dependency-detail"></p></div></article>`).join('')}</div></section>`).join('');

  G.tasks.forEach(t=>{
    const section=document.createElement('section');
    section.className='instructions-section';
    section.setAttribute('aria-label','Instructions for '+t.title);
    section.innerHTML=`<div class="instructions-heading"><strong>Instructions</strong><button class="instructions-link" id="instructions-view-${t.id}" data-instruction-action="view" data-id="${t.id}" aria-expanded="false" aria-controls="instructions-panel-${t.id}">View<span class="sr-only"> instructions for ${t.title}</span></button></div><p id="instructions-preview-${t.id}" class="instructions-preview"></p><div id="instructions-panel-${t.id}" hidden><p id="instructions-full-${t.id}" class="instructions-full"></p><div id="instructions-editor-${t.id}" hidden><label for="instructions-text-${t.id}">How to complete ${t.title}</label><textarea id="instructions-text-${t.id}" rows="7" maxlength="50000"></textarea><p class="instructions-local-note">Saved online and visible to everyone. Only add instructions intended for public viewing.</p><div class="instructions-actions"><button class="primary" data-instruction-action="save" data-id="${t.id}">Save</button><button class="quiet" data-instruction-action="cancel" data-id="${t.id}">Cancel</button></div></div><div class="instructions-actions"><button class="quiet" data-instruction-action="close" data-id="${t.id}">Close</button><button class="quiet" id="instructions-edit-${t.id}" data-instruction-action="edit" data-id="${t.id}" disabled>Edit</button></div><p id="instructions-message-${t.id}" role="status"></p></div>`;
    $('card-'+t.id).append(section);
  });
  function endInstructionEdit(id){
    $('instructions-editor-'+id).hidden=true;
    $('instructions-full-'+id).hidden=false;
    $('instructions-edit-'+id).hidden=false;
    $('instructions-edit-'+id).disabled=!cloud?.canEdit||!instructionsLoaded;
  }
  $('tasks').addEventListener('click',async e=>{
    const button=e.target.closest('[data-instruction-action]');
    if(!button)return;
    const {id,instructionAction:action}=button.dataset;
    if(action==='view'){
      $('instructions-panel-'+id).hidden=false;
      $('instructions-preview-'+id).hidden=true;
      button.setAttribute('aria-expanded','true');
    }else if(action==='close'){
      endInstructionEdit(id);
      $('instructions-panel-'+id).hidden=true;
      $('instructions-preview-'+id).hidden=false;
      $('instructions-view-'+id).setAttribute('aria-expanded','false');
      $('instructions-view-'+id).focus();
    }else if(action==='edit'){
      if(!cloud?.canEdit||!instructionsLoaded)return;
      $('instructions-text-'+id).value=instructions[id];
      $('instructions-editor-'+id).hidden=false;
      $('instructions-full-'+id).hidden=true;
      $('instructions-edit-'+id).hidden=true;
      $('instructions-message-'+id).textContent='';
      $('instructions-text-'+id).focus();
    }else if(action==='cancel'){
      endInstructionEdit(id);$('instructions-edit-'+id).focus();
    }else if(action==='save'){

      if(!cloud?.canEdit){$('instructions-message-'+id).textContent='Sign in as an authorized editor to save.';return;}
      button.disabled=true;
      try{
        instructions[id]=await cloud.save(id,$('instructions-text-'+id).value);
        renderInstructions();endInstructionEdit(id);
        $('instructions-message-'+id).textContent='Instructions saved online.';
        $('instructions-edit-'+id).focus();
      }catch{
        $('instructions-message-'+id).textContent='Could not save. Check your connection and editor sign-in. Your text is still here.';
      }finally{button.disabled=false;}
    }
  });
  let loadingInstructions=false;
  async function loadInstructions(){
    if(loadingInstructions)return;
    loadingInstructions=true;
    try{
      instructions=cleanInstructions(await cloud.load());instructionsLoaded=true;renderInstructions();
      $('instructions-connection').textContent='Instructions are shared online.';
    }catch{
      $('instructions-connection').textContent='Could not refresh instructions. Check your connection and try Refresh instructions.';
    }finally{
      loadingInstructions=false;
      G.tasks.forEach(t=>{$('instructions-edit-'+t.id).disabled=!cloud?.canEdit||!instructionsLoaded;});
    }
  }
  window.addEventListener('ghost-auth',e=>{
    const {canEdit,user}=e.detail;
    $('editor-status').textContent=canEdit?'Editor signed in':user?'Signed in · viewing only':'Viewing instructions · sign in to edit';
    $('editor-signout').hidden=!user;
    $('editor-signin').hidden=!!user;
    G.tasks.forEach(t=>{$('instructions-edit-'+t.id).disabled=!canEdit||!instructionsLoaded;$('instructions-text-'+t.id).readOnly=!canEdit;});
  });
  $('editor-signin').addEventListener('click',()=>{$('editor-dialog').showModal();});
  $('editor-close').addEventListener('click',()=>{$('editor-dialog').close();});
  $('editor-dialog').addEventListener('close',()=>{$('editor-password').value='';});
  $('editor-form').addEventListener('submit',async e=>{
    e.preventDefault();$('editor-submit').disabled=true;$('editor-error').textContent='Signing in…';
    try{
      await cloud.signIn($('editor-email').value.trim(),$('editor-password').value);
      $('editor-dialog').close();$('editor-error').textContent='';await loadInstructions();
    }catch{$('editor-error').textContent='Could not sign in. Check your email and Ghost Lead password, and try again.';}
    finally{$('editor-password').value='';$('editor-submit').disabled=false;}
  });
  $('editor-signout').addEventListener('click',async()=>{
    try{await cloud.signOut();}catch{$('editor-status').textContent='Sign-out could not complete. Please try again.';}
  });
  $('instructions-refresh').addEventListener('click',loadInstructions);
  window.addEventListener('focus',loadInstructions);
  loadInstructions();
  cloud?.checkAuth().catch(()=>{$('editor-status').textContent='Editor sign-in unavailable. Please reload.';});
  renderInstructions();
  $('lanes').innerHTML=G.phases.map((p,i)=>`<div class="lane"><div class="phase-bar ${i===3?'final-bar':''}" style="left:${G.position(p.start)}%;width:${G.position(p.end)-G.position(p.start)}%"><div id="phase-fill-${i}" class="phase-fill"></div><span>${p.short}</span></div></div>`).join('');
  $('milestone-list').innerHTML=G.milestones.map(m=>`<li><strong>${G.formatTime(m.time)}</strong><div><h3>${m.title}</h3><p>${m.note}</p></div></li>`).join('');
  $('dependency-list').innerHTML=G.tasks.map(t=>`<article id="waiting-${t.id}" class="waiting-card" hidden><div><span class="eyebrow">${G.formatTime(t.time)}</span><h3>${t.title}</h3><p id="waiting-reason-${t.id}"></p></div><label class="resolve-label"><span>No longer applies<span class="sr-only"> for ${t.title}</span></span><input type="checkbox" data-resolve="${t.id}" aria-describedby="waiting-reason-${t.id}"></label></article>`).join('');
  $('dependency-list').addEventListener('change',e=>{
    const id=e.target.dataset.resolve;
    if(!id || !e.target.checked || state[id]!=='Dependency')return;
    const title=G.tasks.find(t=>t.id===id).title;
    setStatus(id,'Not Started');
    $('dependency-announcement').textContent=`Dependency cleared for ${title}. Task returned to Not Started.`;
    const next=G.tasks.find(t=>state[t.id]==='Dependency');
    if(next)$('waiting-'+next.id).querySelector('input').focus();else $('dependencies-empty').focus();
  });
  function render(){
    $('dependencies-empty').hidden=G.tasks.some(t=>state[t.id]==='Dependency');
    G.tasks.forEach(t=>{
      $('waiting-'+t.id).hidden=state[t.id]!=='Dependency';
      $('waiting-reason-'+t.id).textContent=dependencies[t.id]||'Dependency reason not selected';
      $('waiting-'+t.id).querySelector('input').checked=false;
    });
    const time=now(), s=G.summarize(time,state), formatted=G.formatTime(time);
    $('clock').innerHTML=formatted.replace(/ (AM|PM)/,' <small>$1</small>');
    $('clock-label').textContent=live?'LIVE · DEVICE TIME':'DEMO CLOCK';
    $('shift-status').textContent=s.status;
    $('time-left').textContent=G.duration(s.remaining);
    $('close-left').textContent=time<G.CLOSE?`${G.duration(G.CLOSE-time)} until service closes`:'Customer-service window ended';
    $('next-title').textContent=s.next?.title||'End of the shift';
    $('next-note').textContent=s.next?.note||(s.open.length?`${s.open.length} tasks still open. Update them as the work finishes.`:'All applicable tasks are marked Done.');
    $('next-time').textContent=s.next?G.formatTime(s.next.time):'10:00 PM';
    $('next-countdown').textContent=s.next?(s.next.time===time?'Now':`In ${G.duration(s.next.time-time)}`):'Schedule finished';
    $('now-marker').style.left=`${G.position(time)}%`;
    $('now-marker').querySelector('span').textContent=time<G.START?'BEFORE':time>G.END?'ENDED':'NOW';
    $('timeline').setAttribute('aria-label',`Shift timeline. ${formatted}. ${s.done} tasks done. ${s.na} not applicable.`);
    $('demo-time').value=live?Math.min(G.END,Math.max(G.START,time)):demo;
    $('demo-time').disabled=live;
    $('demo-output').textContent=formatted;
    $('live-toggle').textContent=live?'Use demo clock':'Use live clock';
    $('live-toggle').setAttribute('aria-pressed',String(live));
    $('clock-help').textContent=live?'Live time from this device':'Demo time · task states stay as you set them';
    $('work-count').textContent=`${s.open.length} / ${G.tasks.length-s.na}`;
    $('task-segments').innerHTML=G.tasks.map(t=>`<i class="${slug(state[t.id])}"></i>`).join('');
    $('work-note').textContent=`${s.done} done · ${s.na} not applicable · ${s.blocked} blocked · ${s.extra} need more time · ${s.dependencies} dependencies`;
    $('remaining-label').textContent=G.duration(s.remaining);
    $('remaining-bar').style.width=`${s.remaining/(G.END-G.START)*100}%`;
    $('task-summary').textContent=`${s.done} done · ${s.na} not applicable · ${s.open.length} open`;
    G.phases.forEach((p,i)=>{const list=G.tasks.filter(t=>t.phase===i && state[t.id]!=='NA Does not apply'), done=list.filter(t=>state[t.id]==='Done').length;$(`phase-fill-${i}`).style.width=`${list.length?done/list.length*100:0}%`;$(`group-count-${i}`).textContent=`${done} of ${list.length} applicable done`;});
    G.tasks.forEach(t=>{const status=state[t.id];$(`dependency-wrap-${t.id}`).hidden=status!=='Dependency';$(`dependency-${t.id}`).value=dependencies[t.id];$(`dependency-detail-${t.id}`).textContent=dependencies[t.id];$(`card-${t.id}`).className=`task-card ${slug(status)}`;$(`state-${t.id}`).value=status;$(`timing-${t.id}`).textContent=status==='NA Does not apply'?'Not applicable':status==='Dependency'?'Waiting on dependency':status==='Done'?'✓ Complete':status==='Blocked'?'Needs a hand':status==='Needs More Time'?'More time needed':time<t.time?`In ${G.duration(t.time-time)}`:time>t.end?'Still open':t.milestone?'Scheduled now':'In this window';});
  }
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
    const view=button.dataset.view, vertical=view==='vertical';
    $('milestones-view').hidden=view!=='milestones';
    $('dependencies-view').hidden=view!=='dependencies';
    $('tasks-view').hidden=!['vertical','grouped'].includes(view);
    $('tasks').classList.toggle('vertical-view',vertical);
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    $('vertical-note').hidden=!vertical;
  }));
  $('tasks').addEventListener('change',e=>{if(e.target.dataset.task)setStatus(e.target.dataset.task,e.target.value);if(e.target.dataset.dependency){const id=e.target.dataset.dependency;if(state[id]==='Dependency'&&G.dependencyOptions.includes(e.target.value)){dependencies[id]=e.target.value;save();render();}else if(e.target.value===''){dependencies[id]='';save();render();}}});
  $('demo-time').addEventListener('input',e=>{demo=Number(e.target.value);save();render();});
  $('live-toggle').addEventListener('click',()=>{live=!live;save();render();});
  $('reset').addEventListener('click',()=>{$('reset-dialog').showModal();});
  $('reset-dialog').addEventListener('close',()=>{if($('reset-dialog').returnValue==='reset'){state=G.cleanState();dependencies=G.cleanDependencies();demo=G.START;live=false;save();render();}});
  window.addEventListener('storage',e=>{if(e.key===KEY){try{const v=JSON.parse(e.newValue);state=G.cleanState(v?.tasks);dependencies=G.cleanDependencies(v?.dependencies);render();}catch{}}});
  setInterval(()=>{if(live)render();},15000);
  render();
  if(!storageOK)$('save-status').textContent='Browser storage unavailable. Changes last until this page closes.';
  if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'set_shift_task_status',title:'Update a shift task',description:'Set the status of a Ghost Lead task and save it in this browser.',inputSchema:{type:'object',properties:{id:{type:'string',enum:G.tasks.map(t=>t.id)},status:{type:'string',enum:G.statuses}},required:['id','status'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>setStatus(input?.id,input?.status)})).catch(()=>{});}catch{}}
})();
