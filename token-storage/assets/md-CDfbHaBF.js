import{_ as i}from"./slidev/CodeBlockWrapper.vue_vue_type_script_setup_true_lang-CORg8HwG.js";import{o as p,V as u,a3 as a,b as e,a2 as d,au as c,a4 as s,z as f,ax as m,ay as k,G as t}from"./modules/vue-CoOMDy5m.js";import{I as g}from"./slidev/default-9EsbZg5w.js";import{u as h,f as _}from"./slidev/context-B1JK9mpH.js";import"./modules/unplugin-icons-C6An18XB.js";import"./index-jFREmn6y.js";import"./modules/shiki-DCH9zjuJ.js";const B={__name:"token-storage.md__slidev_14",setup(b){const{$clicksContext:l,$frontmatter:o}=h();return l.setup(),(x,n)=>{const r=i;return p(),u(g,m(k(t(_)(t(o),13))),{default:a(()=>[n[1]||(n[1]=e("h2",null,"After: Zero translation cost",-1)),d(r,c({},{title:"",ranges:[]}),{default:a(()=>[...n[0]||(n[0]=[e("pre",{class:"shiki shiki-themes marp-sunburst marp-sunburst slidev-code",style:{"--shiki-light":"#ffffff","--shiki-dark":"#ffffff","--shiki-light-bg":"#182b3a","--shiki-dark-bg":"#182b3a"}},[e("code",{class:"language-text"},[e("span",{class:"line"},[e("span",null,"  WRITE (agent)                   READ (agent)")]),s(`
`),e("span",{class:"line"},[e("span")]),s(`
`),e("span",{class:"line"},[e("span",null,"  ╭────────────╮                  ╭────────────╮")]),s(`
`),e("span",{class:"line"},[e("span",null,"  │ token IDs  │                  │ token IDs  │")]),s(`
`),e("span",{class:"line"},[e("span",null,"  ╰─────┬──────╯                  ╰─────┬──────╯")]),s(`
`),e("span",{class:"line"},[e("span",null,"        │                               ▲")]),s(`
`),e("span",{class:"line"},[e("span",null,"        │  +freq encode  2.7 µs         │  +freq decode  3.6 µs")]),s(`
`),e("span",{class:"line"},[e("span",null,"        ▼                               │")]),s(`
`),e("span",{class:"line"},[e("span",null,"  ╭─────┴───────────────────────────────┴──────╮")]),s(`
`),e("span",{class:"line"},[e("span",null,"  │                    DISK                    │")]),s(`
`),e("span",{class:"line"},[e("span",null,"  ╰────────────────────────────────────────────╯")]),s(`
`),e("span",{class:"line"},[e("span")]),s(`
`),e("span",{class:"line"},[e("span",null,"        detokenize once at the edge, only for a human:  50.3 µs")])])],-1)])]),_:1},16),n[2]||(n[2]=e("ul",null,[e("li",null,[s("The UTF-8 boxes are gone. "),e("strong",null,"No translation required"),s(" on read/write")])],-1)),f(`
Same layout as the previous slide so the difference is the missing middle row.
Before: token IDs -> UTF-8 -> disk, and back again on every access.
After: the IDs are the stored form, so a read hands them straight to the model.
Numbers are o200k +freq: 2.7us to encode, 3.6us to decode, against 237us to
re-tokenize. Detokenize survives, but once, at the edge, for a human.
`)]),_:1},16)}}};export{B as default};
