(function () {
  const config = {
    apiKey: "AIzaSyDfucFAu17khRS7PD0RwOmVHfeDxvpJGzQ",
    authDomain: "shoplike-vintage-live.firebaseapp.com",
    projectId: "shoplike-vintage-live",
    storageBucket: "shoplike-vintage-live.firebasestorage.app",
    messagingSenderId: "169234995971",
    appId: "1:169234995971:web:98a1c3c4a55e3649842736"
  };
  if (!window.firebase) throw new Error("Firebase SDK did not load.");
  const app = window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(config);
  const auth = app.auth();
  const db = app.firestore();
  window.__shoplikeFirebaseAuth = auth;

  const userShape = (u) => u ? ({
    id: u.uid, uid: u.uid, email: u.email || "",
    user_metadata: { name: u.displayName || (u.email || "").split("@")[0], phone: u.phoneNumber || null }
  }) : null;
  const sessionShape = async (u) => u ? ({
    access_token: await u.getIdToken(), user: userShape(u), expires_at: Math.floor(Date.now()/1000)+3600
  }) : null;

  const authApi = {
    onAuthStateChange(callback) {
      const unsub = auth.onAuthStateChanged(async (u) => {
        callback(u ? "SIGNED_IN" : "SIGNED_OUT", await sessionShape(u));
      });
      return { data: { subscription: { unsubscribe: unsub } } };
    },
    async signInWithPassword({email,password}) {
      const cred = await auth.signInWithEmailAndPassword(String(email).trim(), password);
      const session = await sessionShape(cred.user);
      return { data: { user: userShape(cred.user), session }, error: null };
    },
    async signUp({email,password,options={}}) {
      const cred = await auth.createUserWithEmailAndPassword(String(email).trim(), password);
      const name = options.data?.name || "";
      if (name) await cred.user.updateProfile({displayName:name});
      const session = await sessionShape(cred.user);
      return { data: { user: userShape(cred.user), session }, error: null };
    },
    async signOut() { await auth.signOut(); return { error: null }; },
    async getSession() { return { data: { session: await sessionShape(auth.currentUser) }, error: null }; },
    async updateUser({password}) {
      if (!auth.currentUser) return { error: new Error("Please sign in again.") };
      await auth.currentUser.updatePassword(password);
      return { data: { user: userShape(auth.currentUser) }, error: null };
    },
    async resetPasswordForEmail(email, options={}) {
      await auth.sendPasswordResetEmail(email, options.redirectTo ? {url:options.redirectTo} : undefined);
      return { error: null };
    }
  };

  class Query {
    constructor(table) { this.table=table; this.op="select"; this.payload=null; this.filters=[]; this.orders=[]; this.start=0; this.end=null; this.max=null; this.one=false; this.countMode=false; this.head=false; }
    select(_fields,opts={}) { this.countMode=opts.count==="exact"; this.head=!!opts.head; return this; }
    insert(data) { this.op="insert"; this.payload=data; return this; }
    upsert(data) { this.op="upsert"; this.payload=data; return this; }
    update(data) { this.op="update"; this.payload=data; return this; }
    delete() { this.op="delete"; return this; }
    eq(k,v) { this.filters.push([k,"eq",v]); return this; }
    neq(k,v) { this.filters.push([k,"neq",v]); return this; }
    gte(k,v) { this.filters.push([k,"gte",v]); return this; }
    lte(k,v) { this.filters.push([k,"lte",v]); return this; }
    ilike(k,v) { this.filters.push([k,"ilike",v]); return this; }
    or(expr) { this.filters.push(["__or","or",expr]); return this; }
    order(k,opts={}) { this.orders.push([k,opts.ascending!==false]); return this; }
    range(a,b) { this.start=a; this.end=b; return this; }
    limit(n) { this.max=n; return this; }
    single() { this.one=true; return this.run(); }
    maybeSingle() { this.one=true; return this.run(); }
    then(resolve,reject) { return this.run().then(resolve,reject); }
    async run() {
      try {
        const col=db.collection(this.table);
        if (this.op==="insert" || this.op==="upsert") {
          const rows=Array.isArray(this.payload)?this.payload:[this.payload];
          const saved=[];
          for (const row0 of rows) {
            const row={...row0};
            if (!row.created_at) row.created_at=new Date().toISOString();
            const id=(this.table==="orders" && row.order_ref) ? String(row.order_ref) : (row.id ? String(row.id) : null);
            const ref=id?col.doc(id):col.doc();
            await ref.set(row,{merge:this.op==="upsert"});
            saved.push({...row,id:ref.id});
          }
          return {data:Array.isArray(this.payload)?saved:saved[0],error:null,count:saved.length};
        }
        let docs=[];
        if (this.table==="orders") {
          const byRef=this.filters.find(f=>f[0]==="order_ref"&&f[1]==="eq");
          if (byRef) {
            const snap=await col.doc(String(byRef[2])).get();
            if (snap.exists) docs=[{...snap.data(),id:snap.id}];
          } else {
            const snap=await col.get();
            docs=snap.docs.map(d=>({...d.data(),id:d.id}));
          }
        } else {
          const snap=await col.get();
          docs=snap.docs.map(d=>({...d.data(),id:d.id}));
        }
        const matches=(row,k,op,v)=>{
          const x=row[k];
          if(op==="eq") return x===v;
          if(op==="neq") return x!==v;
          if(op==="gte") return x>=v;
          if(op==="lte") return x<=v;
          if(op==="ilike") return String(x??"").toLowerCase().includes(String(v).replace(/%/g,"").toLowerCase());
          return true;
        };
        docs=docs.filter(row=>this.filters.every(([k,op,v])=>op==="or" ? String(v).split(",").some(part=>{const m=part.match(/(email|name)\.ilike\.%(.*)%/);return m&&String(row[m[1]]||"").toLowerCase().includes(m[2].toLowerCase());}) : matches(row,k,op,v)));
        for (const [key,asc] of this.orders) docs.sort((a,b)=>{const x=a[key],y=b[key];return (x>y?1:x<y?-1:0)*(asc?1:-1);});
        const total=docs.length;
        if(this.end!==null) docs=docs.slice(this.start,this.end+1); else if(this.start) docs=docs.slice(this.start);
        if(this.max!==null) docs=docs.slice(0,this.max);
        if(this.op==="update"||this.op==="delete") {
          for(const row of docs) {
            const ref=col.doc(String(row.id));
            if(this.op==="delete") await ref.delete();
            else { const patch={...this.payload}; delete patch.id; await ref.set(patch,{merge:true}); }
          }
          return {data:docs,error:null,count:docs.length};
        }
        if(this.head) return {data:null,error:null,count:total};
        if(this.one) return {data:docs[0]||null,error:null,count:total};
        return {data:docs,error:null,count:total};
      } catch(error) { return {data:null,error,count:null}; }
    }
  }
  const client = { auth: authApi, from: (table)=>new Query(table) };
  window.__shoplikeFirebaseClient=client;
})();