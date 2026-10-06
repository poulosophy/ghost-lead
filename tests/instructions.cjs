const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));

await page.route('**/cloud.js',route=>route.fulfill({contentType:'application/javascript',body:`
window.GhostCloud={
canEdit:sessionStorage.getItem('test-editor')==='yes',
async load(){return JSON.parse(sessionStorage.getItem('test-instructions')||'{}');},
async save(id,body){if(!this.canEdit)throw Error('denied');const data=await this.load();data[id]=body;sessionStorage.setItem('test-instructions',JSON.stringify(data));return body;},
async signIn(){this.canEdit=true;sessionStorage.setItem('test-editor','yes');await this.checkAuth();},
async signOut(){this.canEdit=false;sessionStorage.removeItem('test-editor');await this.checkAuth();},
async checkAuth(){dispatchEvent(new CustomEvent('ghost-auth',{detail:{canEdit:this.canEdit,user:this.canEdit?{id:'test'}:null}}));}
};
`}));
await page.goto(process.env.TEST_URL||'http://127.0.0.1:4180');
await page.waitForFunction(()=>document.querySelector('#instructions-connection').textContent==='Instructions are shared online.');
assert.equal(await page.locator('#instructions-edit-scan').isDisabled(),true);
await page.click('#editor-signin');await page.fill('#editor-email','editor@example.test');await page.fill('#editor-password','test-password');await page.click('#editor-submit');
await page.waitForFunction(()=>!document.querySelector('#instructions-edit-scan').disabled);

assert.equal(await page.locator('.instructions-section').count(),19);
const action=a=>page.locator('[data-instruction-action="'+a+'"][data-id="scan"]');
await action('view').click();await action('edit').click();
const value='Step 1: Gather supplies.\nStep 2: <script>window.bad=true</script>\n'+ 'Detailed instructions. '.repeat(80);
await page.locator('#instructions-text-scan').fill(value);
await page.selectOption('#state-scan','Started');
assert.equal(await page.inputValue('#instructions-text-scan'),value);
await action('save').click();assert.equal(await page.locator('#instructions-full-scan').textContent(),value);
assert.equal(await page.evaluate(()=>window.bad),undefined);
await action('close').click();assert.equal(await page.locator('#instructions-panel-scan').isVisible(),false);
await page.reload();await action('view').click();assert.equal(await page.locator('#instructions-full-scan').textContent(),value);
await action('edit').click();await page.locator('#instructions-text-scan').fill('discard');await action('cancel').click();assert.equal(await page.locator('#instructions-full-scan').textContent(),value);
await page.click('#reset');await page.locator('dialog button[value=reset]').click();await page.waitForFunction(()=>document.querySelector('#state-scan').value==='Not Started');assert.equal(await page.locator('#instructions-full-scan').textContent(),value);
for(const view of ['grouped','vertical']){await page.click('[data-view='+view+']');for(const width of [320,390,820,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}}
await action('edit').click();await page.locator('#instructions-text-scan').fill('unsaved');
await page.evaluate(()=>GhostCloud.save=async()=>{throw Error('offline');});await action('save').click();
assert.equal(await page.locator('#instructions-editor-scan').isVisible(),true);assert.match(await page.locator('#instructions-message-scan').innerText(),/Could not save/);assert.equal(await page.inputValue('#instructions-text-scan'),'unsaved');
await page.click('#editor-signout');assert.equal(await page.locator('#instructions-edit-scan').isDisabled(),true);assert.deepEqual(errors,[]);await browser.close();console.log('PASS: instructions preview, viewing, editing, save/cancel, persistence, reset preservation, plain text safety, responsive layout and storage failure.');
})().catch(e=>{console.error(e);process.exit(1)});
