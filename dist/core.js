(function (root) {
  const START = 810, CLOSE = 1260, END = 1320;
  const statuses = ['Not Started', 'Started', 'Done', 'Needs More Time', 'Blocked'];
  const tasks = [
    {id:'scan', title:'Take a shift scan', time:810, end:830, phase:0, detail:'See what is ready, what needs attention, and what is already underway.'},
    {id:'rotisserie', title:'Check & start rotisserie', time:810, end:855, phase:0, detail:'Check whole-chicken status. Prepare and start the next cook if needed.'},
    {id:'hot-assess', title:'Assess the hot case', time:830, end:860, phase:0, detail:'Check the hot case and customer essentials; identify what needs replenishing.'},
    {id:'breaded', title:'Plan breaded-chicken production', time:850, end:900, phase:0, detail:'Check inventory and decide what tonight’s production needs to cover.'},
    {id:'dinner', title:'Dinner readiness', time:960, end:990, phase:1, milestone:true, detail:'Check that the hot case and dinner essentials are ready for the 4:00–4:30 rush.'},
    {id:'cheese', title:'Begin cheese slicer shutdown', time:1130, end:1140, phase:2, detail:'Start the slicer shutdown sequence with the cheese slicer.'},
    {id:'slicers', title:'Slicers closed', time:1140, end:1140, phase:2, milestone:true, detail:'Confirm the slicer shutdown milestone is complete.'},
    {id:'hot-close', title:'Empty & shut down the hot case', time:1230, end:1245, phase:2, detail:'Remove hot-case food and switch off the case.'},
    {id:'dishes-start', title:'Begin dishwashing', time:1230, end:1260, phase:2, detail:'Move the hot-case dishes into the washing sequence.'},
    {id:'salads', title:'Cover salads & switch off lights', time:1245, end:1260, phase:2, detail:'Cover salads and turn off the appropriate case lights.'},
    {id:'close', title:'Customer service closed', time:1260, end:1260, phase:3, milestone:true, detail:'Confirm the 9:00 PM customer-service close.'},
    {id:'final-dishes', title:'Finish the dishes', time:1260, end:1320, phase:3, detail:'Finish the remaining washing and put away clean equipment.'},
    {id:'cleanup', title:'Final cleanup', time:1260, end:1320, phase:3, detail:'Complete the remaining closing cleanup.'},
    {id:'donations', title:'Wrap up donations', time:1260, end:1320, phase:3, detail:'Complete the donation work and remaining end-of-shift checks.'}
  ];
  const phases = [
    {name:'Set up the shift', short:'Assess & prepare', start:810, end:960},
    {name:'Ready for dinner', short:'Dinner service', start:960, end:1130},
    {name:'Wind down service', short:'Service shutdown', start:1130, end:1260},
    {name:'Finish the close', short:'Final close', start:1260, end:1320}
  ];
  const milestones = [
    {time:960, title:'Dinner readiness', note:'Readiness window · 4:00–4:30 PM'},
    {time:1130, title:'Cheese slicer shutdown', note:'Begin the slicer shutdown sequence'},
    {time:1140, title:'Slicers closed', note:'Slicer shutdown milestone'},
    {time:1230, title:'Hot case off · dishes begin', note:'Start the next closing sequence'},
    {time:1245, title:'Salads covered · lights off', note:'Prepare the cases for close'},
    {time:1260, title:'Customer-service close', note:'Service ends · final closing hour begins'},
    {time:1320, title:'Shift complete', note:'Final dishes, cleanup, and donations wrapped up'}
  ];
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const position = time => clamp((time - START) / (END - START) * 100, 0, 100);
  const formatTime = time => { const h = Math.floor(time / 60); return `${h % 12 || 12}:${String(Math.floor(time % 60)).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`; };
  const duration = n => { n = Math.max(0, Math.ceil(n)); return n >= 60 ? `${Math.floor(n / 60)}h ${n % 60}m` : `${n}m`; };
  function cleanState(raw) {
    return Object.fromEntries(tasks.map(t => [t.id, statuses.includes(raw?.[t.id]) ? raw[t.id] : 'Not Started']));
  }
  function summarize(time, state) {
    const open = tasks.filter(t => state[t.id] !== 'Done');
    return {open, done:tasks.length-open.length, remaining:Math.max(0, END-Math.max(START,time)),
      next:milestones.find(m=>m.time>=time), blocked:open.filter(t=>state[t.id]==='Blocked').length,
      extra:open.filter(t=>state[t.id]==='Needs More Time').length,
      status:time<START?'Before shift':time>=END?(open.length?'Shift ended · work still open':'Shift complete'):time>=CLOSE?'Final closing hour':'Service open'};
  }
  const api = {START,CLOSE,END,statuses,tasks,phases,milestones,position,formatTime,duration,cleanState,summarize};
  if (typeof module !== 'undefined') module.exports=api;
  root.GhostLead=api;
})(globalThis);
