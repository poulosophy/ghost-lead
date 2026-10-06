(() => {
  const client=window.supabase?.createClient(
    'https://mrjjpdmpbvuyrbljhvnq.supabase.co',
    'sb_publishable_kFtM-PnWQ17IzYKkgB2ujg_h_38EoFk',
    {auth:{storageKey:'ghost-lead-editor-auth',detectSessionInUrl:false}}
  );
  let canEdit=false, user=null;
  let revision=0;
  const emit=()=>window.dispatchEvent(new CustomEvent('ghost-auth',{detail:{canEdit,user}}));
  async function checkAuth(){
    const current=++revision;
    canEdit=false;emit();
    if(!client)return;
    const {data,error}=await client.auth.getSession();
    if(current!==revision)return;
    user=error?null:data.session?.user||null;
    if(user){
      const result=await client.rpc('can_edit_instructions');
      if(current!==revision)return;
      canEdit=!result.error && result.data===true;
    }
    emit();
  }
  window.GhostCloud={
    get canEdit(){return canEdit;},
    async load(){
      if(!client)throw Error('Connection unavailable');
      const {data,error}=await client.from('task_instructions').select('task_id,body');
      if(error)throw error;
      return Object.fromEntries(data.map(row=>[row.task_id,row.body]));
    },
    async save(id,body){
      if(!client||!canEdit)throw Error('Editor sign-in required');
      const {data,error}=await client.from('task_instructions').upsert({task_id:id,body},{onConflict:'task_id'}).select('task_id,body').single();
      if(error)throw error;
      return data.body;
    },
    async signIn(email,password){
      if(!client)throw Error('Connection unavailable');
      const {error}=await client.auth.signInWithPassword({email,password});
      if(error)throw error;
      await checkAuth();
    },
    async signOut(){
      canEdit=false;user=null;revision++;emit();
      if(client){const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;}
    },
    checkAuth
  };
  if(client)client.auth.onAuthStateChange(()=>{setTimeout(()=>checkAuth().catch(()=>{canEdit=false;emit();}),0);});
})();
