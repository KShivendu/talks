import{_ as u}from"./slidev/VClicks-CjasPSLu.js";import{_ as c}from"./slidev/CodeBlockWrapper.vue_vue_type_script_setup_true_lang-BlnCk8XG.js";import{o as d,V as f,a3 as a,b as s,a2 as t,au as m,a4 as e,z as k,ax as g,ay as _,G as o}from"./modules/vue-CoOMDy5m.js";import{I as h}from"./slidev/default-CeNhx9LZ.js";import{u as b,f as x}from"./slidev/context-C-n4SQjw.js";import"./index-ZaDE5Y49.js";import"./modules/shiki-DCH9zjuJ.js";import"./modules/unplugin-icons-C6An18XB.js";const q={__name:"token-storage.md__slidev_14",setup(v){const{$clicksContext:l,$frontmatter:r}=b();return l.setup(),(I,n)=>{const i=c,p=u;return d(),f(h,g(_(o(x)(o(r),13))),{default:a(()=>[n[2]||(n[2]=s("h2",null,"After: Zero translation cost",-1)),t(i,m({},{title:"",ranges:[]}),{default:a(()=>[...n[0]||(n[0]=[s("pre",{class:"shiki shiki-themes marp-sunburst marp-sunburst slidev-code",style:{"--shiki-light":"#ffffff","--shiki-dark":"#ffffff","--shiki-light-bg":"#182b3a","--shiki-dark-bg":"#182b3a"}},[s("code",{class:"language-text"},[s("span",{class:"line"},[s("span",null,"  WRITE (agent)                   READ (agent)")]),e(`
`),s("span",{class:"line"},[s("span")]),e(`
`),s("span",{class:"line"},[s("span",null,"  ╭────────────╮                  ╭────────────╮")]),e(`
`),s("span",{class:"line"},[s("span",null,"  │ token IDs  │                  │ token IDs  │")]),e(`
`),s("span",{class:"line"},[s("span",null,"  ╰─────┬──────╯                  ╰─────┬──────╯")]),e(`
`),s("span",{class:"line"},[s("span",null,"        │                               ▲")]),e(`
`),s("span",{class:"line"},[s("span",null,"        │  +freq encode  2.7 µs         │  +freq decode  3.6 µs")]),e(`
`),s("span",{class:"line"},[s("span",null,"        ▼                               │")]),e(`
`),s("span",{class:"line"},[s("span",null,"  ╭─────┴───────────────────────────────┴──────╮")]),e(`
`),s("span",{class:"line"},[s("span",null,"  │                    DISK                    │")]),e(`
`),s("span",{class:"line"},[s("span",null,"  ╰────────────────────────────────────────────╯")]),e(`
`),s("span",{class:"line"},[s("span")]),e(`
`),s("span",{class:"line"},[s("span",null,"        detokenize once at the edge, only for a human:  50.3 µs")])])],-1)])]),_:1},16),t(p,null,{default:a(()=>[...n[1]||(n[1]=[s("ul",null,[s("li",null,[e("The UTF-8 boxes are gone. "),s("strong",null,"No translation required"),e(" on read/write")])],-1)])]),_:1}),k(`
Same layout as the previous slide so the difference is the missing middle row.
Before: token IDs -> UTF-8 -> disk, and back again on every access.
After: the IDs are the stored form, so a read hands them straight to the model.
Numbers are o200k +freq: 2.7us to encode, 3.6us to decode, against 237us to
re-tokenize. Detokenize survives, but once, at the edge, for a human.
`)]),_:1},16)}}};export{q as default};
