import{_ as r}from"./slidev/CodeBlockWrapper.vue_vue_type_script_setup_true_lang-Ce1EXOiP.js";import{o as i,V as u,a3 as l,b as s,a2 as c,au as f,a4 as n,ax as d,ay as m,G as e}from"./modules/vue-Bhcaf6WO.js";import{I as k}from"./slidev/default-BffRJpGk.js";import{u as g,f as _}from"./slidev/context-3kz2CT4S.js";import"./modules/unplugin-icons-DAseOUFi.js";import"./index-TqvvEqEv.js";import"./modules/shiki-Dq2beWmg.js";const D={__name:"token-storage.md__slidev_13",setup(x){const{$clicksContext:t,$frontmatter:p}=g();return t.setup(),(b,a)=>{const o=r;return i(),u(k,d(m(e(_)(e(p),12))),{default:l(()=>[a[1]||(a[1]=s("h2",null,"Before: Translation on every read/write",-1)),c(o,f({},{title:"",ranges:[]}),{default:l(()=>[...a[0]||(a[0]=[s("pre",{class:"shiki shiki-themes marp-sunburst marp-sunburst slidev-code",style:{"--shiki-light":"#ffffff","--shiki-dark":"#ffffff","--shiki-light-bg":"#182b3a","--shiki-dark-bg":"#182b3a"}},[s("code",{class:"language-text"},[s("span",{class:"line"},[s("span",null,"  WRITE (agent)                   READ (agent)")]),n(`
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
`),s("span",{class:"line"},[s("span",null,"  ╰────────────────────────────────────────────╯")])])],-1)])]),_:1},16),a[2]||(a[2]=s("ul",null,[s("li",null,"Models don’t understand UTF-8. So you translate on every read/write")],-1))]),_:1},16)}}};export{D as default};
