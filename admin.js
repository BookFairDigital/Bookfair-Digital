import {auth,db,doc,setDoc,getDocs,collection} from "./firebase.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {initializeApp,getApps} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {firebaseConfig} from "./firebase-config.js";
import {getAuth,createUserWithEmailAndPassword,signOut as secondarySignOut} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const ADMIN_UID = "SU2kLL2ovwPXGyJ436s8PJpLJQZ2";
const SECONDARY_APP_NAME = "bookfairStudentProvisioning";

onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "admin-login.html";
  if (user.uid !== ADMIN_UID) {
    await signOut(auth);
    alert("This account is not authorized as an administrator.");
    return location.href = "admin-login.html";
  }
  await initAdmin();
});

async function initAdmin(){
  const $=id=>document.getElementById(id);
  const rows=$("rows"), empty=$("empty"), modal=$("modal"), toast=$("toast");
  let data=[];
  let secondaryAuth;

  function getSecondaryAuth(){
    const existing=getApps().find(a=>a.name===SECONDARY_APP_NAME);
    const app=existing||initializeApp(firebaseConfig,SECONDARY_APP_NAME);
    return secondaryAuth||getAuth(app);
  }

  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function bookName(b){return b==="01"?"Book 01 · A/L Accounting":b==="02"?"Book 02":"Book 03"}
  function msg(t,error=false){toast.textContent=t;toast.className="toast show"+(error?" error":"");setTimeout(()=>toast.classList.remove("show"),2600)}

  async function load(){
    try{
      const snap=await getDocs(collection(db,"students"));
      data=snap.docs.map(d=>({id:d.id,...d.data()}));
      render();
    }catch(e){
      console.error(e);
      msg("Could not load student accounts from Firestore.",true);
    }
  }

  function render(){
    let q=($("search").value||"").toLowerCase().trim(), f=$("bookFilter").value;
    let a=data.filter(x=>(f==="all"||x.book===f)&&(`${x.username||""} ${x.fullName||""}`.toLowerCase().includes(q)));
    rows.innerHTML=a.map(x=>`<tr><td><strong>${esc(x.username)}</strong></td><td><span class="muted">Hidden after creation</span></td><td>${esc(bookName(x.book))}</td><td>${esc(x.fullName||"Not registered")}</td><td><span class="pill ${x.registered?"green":"gold"}">${x.registered?"REGISTERED":"PENDING"}</span></td><td><span class="pill ${x.active===false?"gold":"green"}">${x.active===false?"INACTIVE":"ACTIVE"}</span></td></tr>`).join("");
    empty.style.display=a.length?"none":"block";
    $("total").textContent=data.length;
    $("b1").textContent=data.filter(x=>x.book==="01").length;
    $("b2").textContent=data.filter(x=>x.book==="02").length;
    $("b3").textContent=data.filter(x=>x.book==="03").length;
  }

  function randomPass(){
    const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    return Array.from({length:10},()=>chars[Math.floor(Math.random()*chars.length)]).join("");
  }
  function validUsername(u){return /^[A-Za-z0-9._-]{3,40}$/.test(u) && u.toLowerCase()!=="admin"}
  function internalEmail(u){return u.toLowerCase()+"@bookfairdigital.local"}

  async function createStudent(username,password,book){
    username=username.trim(); password=password.trim(); book=book.trim();
    if(!validUsername(username)) throw new Error("Username must be 3–40 characters using letters, numbers, dot, underscore or hyphen.");
    if(password.length<6) throw new Error("Password must be at least 6 characters.");
    if(!["01","02","03"].includes(book)) throw new Error("Invalid book assignment.");

    const sa=getSecondaryAuth();
    const cred=await createUserWithEmailAndPassword(sa,internalEmail(username),password);
    await setDoc(doc(db,"students",cred.user.uid),{
      username,
      book,
      registered:false,
      active:true,
      fullName:"",
      district:"",
      contact:"",
      createdAt:new Date().toISOString()
    });
    await secondarySignOut(sa);
    return {username,password,book,uid:cred.user.uid};
  }

  $("newBtn").onclick=()=>{modal.classList.add("show");$("newUser").value="";$("newPass").value=randomPass();$("newUser").focus()};
  function closeModal(){modal.classList.remove("show")}
  $("close").onclick=closeModal;$("cancel").onclick=closeModal;
  $("gen").onclick=()=>$("newPass").value=randomPass();

  $("create").onclick=async()=>{
    const btn=$("create");
    const u=$("newUser").value.trim(),p=$("newPass").value.trim(),b=$("newBook").value;
    if(!u||!p)return msg("Username and password are required.",true);
    btn.disabled=true;btn.textContent="Creating…";
    try{
      await createStudent(u,p,b);
      closeModal();
      msg(`Account ${u} created successfully. Save the password now.`);
      await load();
      showCredential(u,p,b);
    }catch(e){console.error(e);msg(e.code==="auth/email-already-in-use"?"That username already exists.":(e.message||"Account creation failed."),true)}
    finally{btn.disabled=false;btn.textContent="Create Account"}
  };

  function showCredential(u,p,b){
    const ok=confirm(`STUDENT ACCOUNT CREATED\\n\\nUsername: ${u}\\nPassword: ${p}\\nBook: ${bookName(b)}\\n\\nPress OK to download a credential CSV.`);
    if(ok)downloadCSV([{username:u,password:p,book:b}],["username","password","book"],"student-credential.csv");
  }
  function downloadCSV(items,headers,name){
    const csv=headers.join(",")+"\\n"+items.map(x=>headers.map(h=>`"${String(x[h]??"").replaceAll('"','""')}"`).join(",")).join("\\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  $("search").oninput=render;$("bookFilter").onchange=render;
  $("templateBtn").onclick=()=>downloadCSV([
    {username:"ACC26-00001",password:"Abc12345",book:"01"},
    {username:"ACC26-00002",password:"Qwe98765",book:"02"},
    {username:"ACC26-00003",password:"Zxc45678",book:"03"}
  ],["username","password","book"],"bookfair-accounts-template.csv");

  $("importBtn").onclick=()=>$("fileInput").click();
  $("fileInput").onchange=async()=>{
    const f=$("fileInput").files[0]; if(!f)return;
    const lines=(await f.text()).replace(/\r/g,"").split("\n").filter(Boolean);
    const h=lines.shift().split(",").map(x=>x.trim().toLowerCase());
    const ui=h.indexOf("username"),pi=h.indexOf("password"),bi=h.indexOf("book");
    if(ui<0||pi<0||bi<0)return msg("CSV needs username,password,book.",true);
    let created=[],failed=0;
    for(let line of lines){
      const c=line.split(",").map(x=>x.trim().replace(/^"|"$/g,""));
      const u=c[ui],p=c[pi],b=c[bi];
      if(!u||!p||!["01","02","03"].includes(b)){failed++;continue}
      try{created.push(await createStudent(u,p,b))}catch(e){console.error(e);failed++}
    }
    $("fileInput").value="";
    await load();
    if(created.length)downloadCSV(created,["username","password","book"],"bookfair-created-credentials.csv");
    msg(`${created.length} account(s) created. ${failed?failed+" row(s) failed.":""}`,failed>0);
  };

  $("downloadBtn").onclick=()=>downloadCSV(data,["username","book","fullName","district","contact","registered","active"],"bookfair-students-export.csv");
  await load();
}
