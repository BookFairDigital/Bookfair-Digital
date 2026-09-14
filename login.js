import {auth,db,signInWithEmailAndPassword,signOut,doc,getDoc} from "./firebase.js";

const form=document.getElementById("login");
const m=document.getElementById("m");
const emailForUsername=(u)=>u.toLowerCase()+"@bookfairdigital.local";

function show(message,error=true){
  m.textContent=message;
  m.className=error?"error-msg":"success-msg";
}

form.onsubmit=async(e)=>{
  e.preventDefault();
  const u=document.getElementById("u").value.trim();
  const p=document.getElementById("p").value;
  if(!u||!p){show("Please enter your username and password.");return;}
  const btn=form.querySelector("button[type=submit]");
  btn.disabled=true;
  btn.innerHTML="Checking…";
  show("Checking your account…",false);
  try{
    // Make sure a previous admin/student session does not interfere with this login.
    try{ await signOut(auth); }catch(_){}
    const credential=await signInWithEmailAndPassword(auth,emailForUsername(u),p);
    const profileRef=doc(db,"students",credential.user.uid);
    const profile=await getDoc(profileRef);
    if(!profile.exists()){
      await signOut(auth);
      show("Login succeeded, but this student account is not configured yet. Please contact the administrator.");
      return;
    }
    const data=profile.data();
    if(data.active===false){
      await signOut(auth);
      show("This student account is inactive. Please contact the administrator.");
      return;
    }
    localStorage.setItem("bf_login",data.username||u);
    location.href=data.registered?"dashboard.html":"register.html";
  }catch(err){
    console.error("Student login error:",err);
    const code=err?.code||"";
    let message="Incorrect username or password.";
    if(code==="auth/user-not-found") message="This username is not registered.";
    else if(code==="auth/wrong-password" || code==="auth/invalid-credential") message="Incorrect username or password.";
    else if(code==="auth/too-many-requests") message="Too many attempts. Please wait a few minutes and try again.";
    else if(code==="auth/user-disabled") message="This account has been disabled. Please contact the administrator.";
    else if(code==="permission-denied") message="The account exists, but its student profile is not accessible. Please contact the administrator.";
    else if(code==="auth/network-request-failed") message="Network error. Check your internet connection and try again.";
    show(message);
  }finally{
    btn.disabled=false;
    btn.innerHTML="Login <span>→</span>";
  }
};
