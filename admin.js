import {auth} from "./firebase.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
onAuthStateChanged(auth,user=>{if(!user){location.href="admin-login.html";return;} initAdmin();});
async function initAdmin(){const KEY="bf_admin_accounts";
const get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){return[]}};
const save=a=>localStorage.setItem(KEY,JSON.stringify(a));
const $=id=>document.getElementById(id), rows=$("rows"), empty=$("empty"), modal=$("modal"), toast=$("toast");
let data=get();
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function bookName(b){return b==="01"?"Book 01 · A/L Accounting":b==="02"?"Book 02":"Book 03"}
function render(){
 let q=($("search").value||"").toLowerCase().trim(), f=$("bookFilter").value;
 let a=data.filter(x=>(f==="all"||x.book===f)&&(`${x.username} ${x.fullName||""}`.toLowerCase().includes(q)));
 rows.innerHTML=a.map((x,i)=>`<tr><td><strong>${esc(x.username)}</strong></td><td><code>${esc(x.password)}</code></td><td>${esc(bookName(x.book))}</td><td>${esc(x.fullName||"Not registered")}</td><td><span class="pill ${x.registered?"green":"gold"}">${x.registered?"REGISTERED":"PENDING"}</span></td><td><button class="row-delete" data-id="${esc(x.id)}">Delete</button></td></tr>`).join("");
 empty.style.display=a.length?"none":"block";
 $("total").textContent=data.length;$("b1").textContent=data.filter(x=>x.book==="01").length;$("b2").textContent=data.filter(x=>x.book==="02").length;$("b3").textContent=data.filter(x=>x.book==="03").length;
 document.querySelectorAll(".row-delete").forEach(b=>b.onclick=()=>{data=data.filter(x=>x.id!==b.dataset.id);save(data);render()});
}
function msg(t){toast.textContent=t;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2300)}
function randomPass(){let chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";return Array.from({length:10},()=>chars[Math.floor(Math.random()*chars.length)]).join("")}
function openModal(){modal.classList.add("show");$("newUser").value="";$("newPass").value=randomPass();$("newUser").focus()}
function closeModal(){modal.classList.remove("show")}
$("newBtn").onclick=openModal;$("close").onclick=closeModal;$("cancel").onclick=closeModal;$("gen").onclick=()=>$("newPass").value=randomPass();
$("create").onclick=()=>{
 let u=$("newUser").value.trim(),p=$("newPass").value.trim(),b=$("newBook").value;
 if(!u||!p)return msg("Username and password are required.");
 if(data.some(x=>x.username.toLowerCase()===u.toLowerCase()))return msg("Username already exists.");
 data.push({id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(),username:u,password:p,book:b,registered:false,active:true,fullName:"",district:"",contact:""});
 save(data);render();closeModal();msg("Account created.");
};
$("search").oninput=render;$("bookFilter").onchange=render;
$("templateBtn").onclick=()=>{let csv="username,password,book\nACC26-00001,Abc12345,01\nACC26-00002,Qwe98765,02\nACC26-00003,Zxc45678,03\n";let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="bookfair-accounts-template.csv";a.click()};
$("importBtn").onclick=()=>document.getElementById("fileInput").click();
$("fileInput").onchange=async()=>{
 let f=$("fileInput").files[0];if(!f)return;
 let lines=(await f.text()).replace(/\r/g,"").split("\n").filter(Boolean),h=lines.shift().split(",").map(x=>x.trim().toLowerCase()),ui=h.indexOf("username"),pi=h.indexOf("password"),bi=h.indexOf("book");
 if(ui<0||pi<0||bi<0)return msg("CSV needs username,password,book.");
 let n=0;
 for(let line of lines){let c=line.split(",").map(x=>x.trim().replace(/^"|"$/g,"")),u=c[ui],p=c[pi],b=c[bi];if(!u||!p||!["01","02","03"].includes(b))continue;if(data.some(x=>x.username.toLowerCase()===u.toLowerCase()))continue;data.push({id:Date.now()+"_"+n,username:u,password:p,book:b,registered:false,active:true,fullName:"",district:"",contact:""});n++}
 save(data);render();msg(`${n} account(s) imported.`);$("fileInput").value="";
};
$("downloadBtn").onclick=()=>{
 let csv="username,password,book,fullName,district,contact,registered,active\n"+data.map(x=>[x.username,x.password,x.book,x.fullName,x.district,x.contact,x.registered,x.active].map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
 let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="bookfair-accounts-export.csv";a.click();
};
render();\n}\n