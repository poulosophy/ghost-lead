const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1100}});
const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{document.modelContext={registerTool:tool=>{window.testTool=tool;}};});
await page.goto((process.env.TEST_URL || 'http://127.0.0.1:4173'));
assert.equal(await page.locator('.task-card').count(),19);
assert.equal(await page.locator('#clock').innerText(),'5:45 PM');
await page.selectOption('#state-scan','Done');await page.selectOption('#state-rotisserie','Blocked');await page.selectOption('#state-breaded','Needs More Time');await page.selectOption('#state-hot-assess','Started');
assert.equal(await page.locator('#work-count').innerText(),'18 / 19');
await page.reload();assert.equal(await page.inputValue('#state-scan'),'Done');assert.equal(await page.inputValue('#state-rotisserie'),'Blocked');
await page.locator('#demo-time').fill('1260');await page.locator('#demo-time').dispatchEvent('input');
assert.equal(await page.locator('#shift-status').innerText(),'Final closing hour');assert.equal(await page.locator('#time-left').innerText(),'1h 0m');
await page.locator('#demo-time').fill('1320');await page.locator('#demo-time').dispatchEvent('input');assert.match(await page.locator('#shift-status').innerText(),/work still open/);
await page.click('#live-toggle');assert.equal(await page.locator('#demo-time').isDisabled(),true);await page.click('#live-toggle');
assert.equal(await page.evaluate(()=>window.testTool.name),'set_shift_task_status');
assert.deepEqual(await page.evaluate(()=>window.testTool.execute({id:'dinner-chicken',status:'Done'})),{id:'dinner-chicken',status:'Done'});
assert.equal(await page.inputValue('#state-dinner-chicken'),'Done');
assert.equal(await page.evaluate(()=>{try{window.testTool.execute({id:'bad',status:'Done'});return false;}catch{return true;}}),true);
await page.click('#reset');await page.getByRole('button',{name:'Keep working'}).click();assert.equal(await page.inputValue('#state-scan'),'Done');
await page.click('#reset');await page.locator('dialog button[value="reset"]').click();await page.waitForFunction(()=>document.querySelector('#state-scan').value==='Not Started');assert.equal(await page.inputValue('#state-scan'),'Not Started');assert.equal(await page.locator('#clock').innerText(),'1:30 PM');
await page.locator('#demo-time').fill('1065');await page.locator('#demo-time').dispatchEvent('input');
for(const [name,width,height] of [['mac',1440,1100],['ipad',820,1180],['phone',390,844]]){
 await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name} page overflows`);await page.waitForTimeout(250);await page.screenshot({animations:'disabled',path:`/tmp/ghost-lead-${name}.png`,fullPage:true});
 const controls=await page.locator('select:visible').evaluateAll(els=>els.every(e=>e.getBoundingClientRect().height>=44));assert.ok(controls);
}
await page.selectOption('#state-scan','Dependency');
assert.equal(await page.locator('#dependency-scan').isVisible(),true);
const reasons=await page.locator('#dependency-scan option').allTextContents();assert.equal(reasons.length,9);
for(const reason of reasons.slice(1)){await page.selectOption('#dependency-scan',{label:reason});assert.equal(await page.locator('#dependency-detail-scan').innerText(),reason);}
await page.reload();assert.equal(await page.inputValue('#state-scan'),'Dependency');assert.equal(await page.inputValue('#dependency-scan'),reasons[8]);
for(const view of ['grouped','vertical']){await page.click('[data-view='+view+']');for(const width of [320,390,820,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}}
await page.selectOption('#state-scan','Done');assert.equal(await page.locator('#dependency-scan').isVisible(),false);
await page.selectOption('#state-scan','Dependency');assert.equal(await page.inputValue('#dependency-scan'),'');
await page.selectOption('#dependency-scan','Oven is in use');await page.click('#reset');await page.locator('dialog button[value="reset"]').click();await page.waitForFunction(()=>document.querySelector('#state-scan').value==='Not Started');assert.equal(await page.inputValue('#dependency-scan'),'');assert.equal(await page.locator('#dependency-scan').isVisible(),false);
await page.selectOption('#state-dinner-chicken','NA Does not apply');assert.equal(await page.locator('#work-count').innerText(),'18 / 18');await page.reload();assert.equal(await page.inputValue('#state-dinner-chicken'),'NA Does not apply');assert.match(await page.locator('#work-note').innerText(),/1 not applicable/);
await page.evaluate(()=>{for(const t of GhostLead.tasks)window.testTool.execute({id:t.id,status:'NA Does not apply'});});assert.equal(await page.locator('#work-count').innerText(),'0 / 0');assert.equal(await page.locator('#phase-fill-1').evaluate(e=>e.style.width),'0%');
const filepage=await context.newPage();await filepage.goto(require('node:url').pathToFileURL(require('node:path').join(__dirname,'../dist/index.html')).href);assert.equal(await filepage.locator('.task-card').count(),19);await filepage.selectOption('#state-scan','Done');assert.equal(await filepage.locator('#work-count').innerText(),'18 / 19');
const blocked=await context.newPage();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('disabled');}});});await blocked.goto((process.env.TEST_URL || 'http://127.0.0.1:4173'));await blocked.selectOption('#state-scan','Done');assert.match(await blocked.locator('#save-status').innerText(),/unavailable/);
assert.deepEqual(errors,[]);await browser.close();console.log('PASS: task states, persistence, clock, reset/cancel, responsive widths, touch targets, file mode, storage fallback, WebMCP validation, no runtime errors.');
})().catch(e=>{console.error(e);process.exit(1)});
