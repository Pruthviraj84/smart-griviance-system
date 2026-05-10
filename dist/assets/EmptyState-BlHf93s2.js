import{c as m,j as e,C as l}from"./index-ClzcNA3r.js";import{B as n}from"./Button-CgOs-e0C.js";/**
 * @license lucide-react v0.483.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=[["path",{d:"m13.5 8.5-5 5",key:"1cs55j"}],["path",{d:"m8.5 8.5 5 5",key:"a8mexj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]],o=m("SearchX",x);function p({title:a="Nothing here yet",message:c="No items to display.",icon:r="clipboard",actionLabel:t,onAction:s}){const i=r==="search"?o:l;return e.jsxs("div",{className:"flex flex-col items-center justify-center py-16 text-center",children:[e.jsx("div",{className:"flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-slate-500 mb-4",children:e.jsx(i,{className:"h-8 w-8"})}),e.jsx("h3",{className:"text-base font-semibold text-slate-900",children:a}),e.jsx("p",{className:"mt-1 text-sm text-slate-500 max-w-xs",children:c}),t&&s&&e.jsx(n,{variant:"primary",className:"mt-5",onClick:s,children:t})]})}export{p as E};
