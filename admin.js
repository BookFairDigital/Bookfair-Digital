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
  const rows=$("rows"), empty=$("empty"), modal=$("modal"), toast=$("toast"), detailModal=$("detailModal");
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
    let a=data.filter(x=>(f==="all"||x.book===f)&&(`${x.username||""} ${x.fullName||""} ${x.district||""} ${x.contact||""}`.toLowerCase().includes(q)));
    rows.innerHTML=a.map(x=>`<tr class="student-row" data-id="${esc(x.id)}">
      <td><strong>${esc(x.username)}</strong></td>
      <td><span class="muted password-note">Firebase password is not readable</span></td>
      <td>${esc(bookName(x.book))}</td>
      <td>${esc(x.fullName||"Not registered")}</td>
      <td>${esc(x.district||"—")}</td>
      <td>${esc(x.contact||"—")}</td>
      <td><span class="pill ${x.registered?"green":"gold"}">${x.registered?"REGISTERED":"PENDING"}</span></td>
      <td><span class="pill ${x.active===false?"gold":"green"}">${x.active===false?"INACTIVE":"ACTIVE"}</span></td>
    </tr>`).join("");
    empty.style.display=a.length?"none":"block";
    $("total").textContent=data.length;
    $("b1").textContent=data.filter(x=>x.book==="01").length;
    $("b2").textContent=data.filter(x=>x.book==="02").length;
    $("b3").textContent=data.filter(x=>x.book==="03").length;
    document.querySelectorAll(".student-row").forEach(r=>r.onclick=()=>showDetails(r.dataset.id));
  }

  function showDetails(id){
    const x=data.find(v=>v.id===id); if(!x)return;
    $("detailContent").innerHTML=`
      <div class="detail-grid">
        <div><small>USERNAME</small><strong>${esc(x.username||"—")}</strong></div>
        <div><small>ASSIGNED BOOK</small><strong>${esc(bookName(x.book))}</strong></div>
        <div><small>FULL NAME</small><strong>${esc(x.fullName||"Not registered")}</strong></div>
        <div><small>DISTRICT</small><strong>${esc(x.district||"Not provided")}</strong></div>
        <div><small>CONTACT NUMBER</small><strong>${esc(x.contact||"Not provided")}</strong></div>
        <div><small>REGISTRATION</small><strong>${x.registered?"Registered":"Pending"}</strong></div>
        <div><small>ACCOUNT</small><strong>${x.active===false?"Inactive":"Active"}</strong></div>
      </div>
      <div class="security-note"><b>Password:</b> Firebase Authentication does not expose passwords after account creation. The admin can only receive the generated password at creation time. If a password needs to be changed later, use a secure server-side password reset/provisioning flow.</div>`;
    detailModal.classList.add("show");
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
  $("detailClose").onclick=()=>detailModal.classList.remove("show");
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

  function downloadExcel(items, name="bookfair-students.xlsx"){
    const rows=items.map(x=>({
      "Username":x.username||"",
      "Password":x.password||"",
      "Assigned Book":x.book?`Book ${String(x.book).padStart(2,"0")}`:"",
      "Full Name":x.fullName||"",
      "District":x.district||"",
      "Contact Number":x.contact||""
    }));
    const ws=XLSX.utils.json_to_sheet(rows,{header:["Username","Password","Assigned Book","Full Name","District","Contact Number"]});
    ws["!cols"]=[{wch:20},{wch:20},{wch:28},{wch:20},{wch:20}];
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"Student Accounts");
    XLSX.writeFile(wb,name);
  }

  function downloadTemplate(){
    const rows=[
      {"Username":"ACC26-00001","Password":"BookFair@123","Assigned Book":"Book 01","Full Name":"","District":"","Contact Number":""},
      {"Username":"ACC26-00002","Password":"BookFair@456","Assigned Book":"Book 02","Full Name":"","District":"","Contact Number":""},
      {"Username":"ACC26-00003","Password":"BookFair@789","Assigned Book":"Book 03","Full Name":"","District":"","Contact Number":""}
    ];
    const ws=XLSX.utils.json_to_sheet(rows,{header:["Username","Password","Assigned Book","Full Name","District","Contact Number"]});
    ws["!cols"]=[{wch:20},{wch:20},{wch:28},{wch:20},{wch:20}];
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"Student Accounts");
    const ins=XLSX.utils.aoa_to_sheet([
      ["BookFair Digital – Student Account Import"],
      [""],
      ["Username","Unique account username. Required."],
      ["Password","Password for this account. Required; minimum 6 characters."],
      ["Assigned Book","Use Book 01, Book 02, or Book 03. Required."],
      ["Full Name","Optional; student can complete this during first registration."],
      ["District","Optional; student can complete this during first registration."],
      ["Contact Number","Optional; student can complete this during first registration."],
      [""],
      ["Password is used only to create the Firebase Authentication account; it is not stored in Firestore."],
      ["Delete the example rows before importing real accounts."],
      ["Keep this Excel file secure because it contains account passwords."]
    ]);
    ins["!cols"]=[{wch:28},{wch:85}];
    XLSX.utils.book_append_sheet(wb,ins,"Instructions");
    XLSX.writeFile(wb,"BookFair-Student-Accounts-Template.xlsx");
  }

  function showCredential(u,p,b){
    const ok=confirm(`STUDENT ACCOUNT CREATED\n\nUsername: ${u}\nPassword: ${p}\nBook: ${bookName(b)}\n\nSave these credentials now. The password cannot be read back from Firebase later.`);
    if(ok) downloadExcel([{username:u,password:p,book:b}],"bookfair-created-account.xlsx");
  }

  function normalizeBook(v){
    const s=String(v??"").trim().toLowerCase().replace(/\s+/g," ");
    if(s==="01"||s==="book 01"||s.includes("book 01")) return "01";
    if(s==="02"||s==="book 02"||s.includes("book 02")) return "02";
    if(s==="03"||s==="book 03"||s.includes("book 03")) return "03";
    return "";
  }

  $("search").oninput=render;$("bookFilter").onchange=render;
  $("templateBtn").onclick=downloadTemplate;

  $("importBtn").onclick=()=>$("fileInput").click();
  $("fileInput").onchange=async()=>{
    const f=$("fileInput").files[0]; if(!f)return;
    try{
      if(typeof XLSX==="undefined") throw new Error("Excel reader could not be loaded. Refresh the page and try again.");
      const buf=await f.arrayBuffer();
      const wb=XLSX.read(buf,{type:"array"});
      const first=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(first,{defval:""});
      if(!rows.length) throw new Error("The Excel sheet is empty.");
      const keyMap={};
      Object.keys(rows[0]).forEach(k=>keyMap[k.trim().toLowerCase()]=k);
      const ku=keyMap["username"], kp=keyMap["password"], kb=keyMap["assigned book"], kf=keyMap["full name"], kd=keyMap["district"], kc=keyMap["contact number"];
      if(!ku||!kp||!kb) throw new Error("Excel must contain Username, Password and Assigned Book columns.");
      let created=[],failed=[];
      for(const row of rows){
        const u=String(row[ku]??"").trim();
        const p=String(row[kp]??"").trim();
        const b=normalizeBook(row[kb]);
        if(!u && !p && !b && !String(row[kf]??"").trim()) continue;
        if(!u||!p||!b){failed.push({username:u||"(blank)",reason:"Username, Password or Assigned Book missing"});continue;}
        if(p.length<6){failed.push({username:u,reason:"Password must be at least 6 characters"});continue;}
        try{
          const createdAccount=await createStudent(u,p,b);
          // Preserve any optional pre-registration data supplied in the Excel sheet.
          const fullName=String(row[kf]??"").trim();
          const district=String(row[kd]??"").trim();
          const contact=String(row[kc]??"").trim();
          if(fullName||district||contact){
            await setDoc(doc(db,"students",createdAccount.uid),{fullName,district,contact,registered:Boolean(fullName&&district&&contact)},{merge:true});
          }
          created.push({...createdAccount,fullName,district,contact});
        }catch(e){
          console.error(e);
          failed.push({username:u,reason:e.code==="auth/email-already-in-use"?"Username already exists":(e.message||"Creation failed")});
        }
      }
      $("fileInput").value="";
      await load();
      if(created.length) downloadExcel(created,"bookfair-created-accounts.xlsx");
      msg(`${created.length} account(s) created. ${failed.length?failed.length+" row(s) failed.":"All rows imported successfully."}`,failed.length>0);
      if(failed.length) console.table(failed);
    }catch(e){
      console.error(e); $("fileInput").value=""; msg(e.message||"Excel import failed.",true);
    }
  };

  $("downloadBtn").onclick=()=>downloadExcel(data,"bookfair-students-export.xlsx");
  await load();
}
