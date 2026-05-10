import{c,j as r,v as t,w as d,e as i}from"./index-ClzcNA3r.js";/**
 * @license lucide-react v0.483.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]],p=c("Clock",x);/**
 * @license lucide-react v0.483.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],f=c("TriangleAlert",m);function g({children:o,status:e,priority:s,className:l=""}){const n=e?t[e]:s?d[s]:null,a=()=>e==="Pending"?r.jsx(f,{className:"w-3.5 h-3.5"}):e==="In Progress"?r.jsx(p,{className:"w-3.5 h-3.5"}):e==="Completed"||e==="Resolved"||e==="Verified"?r.jsx(i,{className:"w-3.5 h-3.5"}):null;return n?r.jsxs("span",{className:`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${n.bg} ${n.text} ${n.border} ${l} shadow-sm`,children:[a()||n.dot&&r.jsx("span",{className:`h-1.5 w-1.5 rounded-full ${n.dot}`}),o]}):r.jsx("span",{className:`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 ${l}`,children:o})}export{g as B,p as C,f as T};
