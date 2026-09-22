import{_ as u}from"./slidev/VClicks-B4FOymBw.js";import{_ as c}from"./slidev/CodeBlockWrapper.vue_vue_type_script_setup_true_lang--pDloUcT.js";import{o as m,V as f,a3 as l,b as s,a2 as e,au as d,a4 as n,ax as _,ay as k,G as t}from"./modules/vue-CoOMDy5m.js";import{I as g}from"./slidev/default-9FzjUTLN.js";import{u as x,f as b}from"./slidev/context-C-Xa5uA3.js";import"./index-CMEK9LTR.js";import"./modules/shiki-DCH9zjuJ.js";import"./modules/unplugin-icons-C6An18XB.js";const w={__name:"token-storage.md__slidev_13",setup(T){const{$clicksContext:p,$frontmatter:o}=x();return p.setup(),(h,a)=>{const r=c,i=u;return m(),f(g,_(k(t(b)(t(o),12))),{default:l(()=>[a[2]||(a[2]=s("h2",null,"Before: Translate on every read/write",-1)),e(r,d({},{title:"",ranges:[]}),{default:l(()=>[...a[0]||(a[0]=[s("pre",{class:"shiki shiki-themes marp-sunburst marp-sunburst slidev-code",style:{"--shiki-light":"#ffffff","--shiki-dark":"#ffffff","--shiki-light-bg":"#182b3a","--shiki-dark-bg":"#182b3a"}},[s("code",{class:"language-text"},[s("span",{class:"line"},[s("span",null,"  WRITE (agent)                   READ (agent)")]),n(`
`),s("span",{class:"line"},[s("span")]),n(`
`),s("span",{class:"line"},[s("span",null,"  ╭────────────╮                  ╭────────────╮")]),n(`
`),s("span",{class:"line"},[s("span",null,"  │ token IDs  │                  │ token IDs  │")]),n(`
`),s("span",{class:"line"},[s("span",null,"  ╰─────┬──────╯                  ╰─────┬──────╯")]),n(`
`),s("span",{class:"line"},[s("span",null,"        │                               ▲")]),n(`
`),s("span",{class:"line"},[s("span",null,"        │  detokenize  50 µs            │  tokenize  237 µs")]),n(`
`),s("span",{class:"line"},[s("span",null,"        ▼                               │")]),n(`
`),s("span",{class:"line"},[s("span",null,"  ╭─────┴──────╮                  ╭─────┴──────╮")]),n(`
`),s("span",{class:"line"},[s("span",null,"  │ UTF-8 text │                  │ UTF-8 text │")]),n(`
`),s("span",{class:"line"},[s("span",null,"  ╰─────┬──────╯                  ╰─────┬──────╯")]),n(`
`),s("span",{class:"line"},[s("span",null,"        │                               ▲")]),n(`
`),s("span",{class:"line"},[s("span",null,"        │  LZ4 compress  2.9 µs         │  LZ4 decompress  1.0 µs")]),n(`
`),s("span",{class:"line"},[s("span",null,"        ▼                               │")]),n(`
`),s("span",{class:"line"},[s("span",null,"  ╭─────┴───────────────────────────────┴──────╮")]),n(`
`),s("span",{class:"line"},[s("span",null,"  │                    DISK                    │")]),n(`
`),s("span",{class:"line"},[s("span",null,"  ╰────────────────────────────────────────────╯")])])],-1)])]),_:1},16),e(i,null,{default:l(()=>[...a[1]||(a[1]=[s("ul",null,[s("li",null,"Models don’t understand UTF-8. So you translate on every read/write")],-1)])]),_:1})]),_:1},16)}}};export{w as default};
