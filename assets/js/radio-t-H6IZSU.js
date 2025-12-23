import{c as r}from"./index-DgRZv62J.js";const c=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"?"http://localhost:3001/api":"https://nexus-backend-m492.onrender.com/api",i="nexus_admin_token",d=async(a,t={},s=!1)=>{if(!navigator.onLine)throw new Error("OFFLINE_MODE");try{const e=sessionStorage.getItem(i),o=new Headers(t.headers||{});e&&o.set("x-admin-key",e),!o.has("Content-Type")&&!(t.body instanceof FormData)&&o.set("Content-Type","application/json");const n=await fetch(a,{...t,headers:o});if(!n.ok){const h=await n.json().catch(()=>({message:n.statusText}));throw new Error(h.message||`API Error: ${n.status}`)}return await n.json()}catch(e){throw e}},w=async()=>{if(!navigator.onLine)throw new Error("Nelze zálohovat v offline režimu.");const a=sessionStorage.getItem(i),t=await fetch(`${c}/admin/backup`,{method:"GET",headers:{"x-admin-key":a||""}});if(!t.ok)throw new Error("Chyba při stahování zálohy (Access Denied?)");const s=await t.blob(),e=window.URL.createObjectURL(s),o=document.createElement("a");o.href=e,o.download=`nexus_backup_${new Date().toISOString().split("T")[0]}.json`,document.body.appendChild(o),o.click(),window.URL.revokeObjectURL(e),document.body.removeChild(o)},l=async(a,t,s,e)=>d(`${c}/admin/action`,{method:"POST",body:JSON.stringify({roomId:a,targetName:t,actionType:s,value:e})}),p=async a=>d(`${c}/rooms/${a}/status`);/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=r("Moon",[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]]);/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=r("Radio",[["path",{d:"M4.9 19.1C1 15.2 1 8.8 4.9 4.9",key:"1vaf9d"}],["path",{d:"M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5",key:"u1ii0m"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["path",{d:"M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5",key:"1j5fej"}],["path",{d:"M19.1 4.9C23 8.8 23 15.1 19.1 19",key:"10b0cb"}]]);export{y as M,k as R,l as a,w as d,p as g};
