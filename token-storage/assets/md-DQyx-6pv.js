import{_ as i}from"./slidev/CodeBlockWrapper.vue_vue_type_script_setup_true_lang-DdcWRWO8.js";import{o as r,V as u,a3 as l,b as s,a2 as c,au as f,a4 as n,ax as m,ay as d,G as e}from"./modules/vue-Bhcaf6WO.js";import{I as k}from"./slidev/default-BPSVFg7_.js";import{u as g,f as _}from"./slidev/context-BU_9hwq0.js";import"./modules/unplugin-icons-DAseOUFi.js";import"./index-DcwH9wxq.js";import"./modules/shiki-Dq2beWmg.js";const C={__name:"token-storage.md__slidev_17",setup(x){const{$clicksContext:t,$frontmatter:p}=g();return t.setup(),(b,a)=>{const o=i;return r(),u(k,m(d(e(_)(e(p),16))),{default:l(()=>[a[1]||(a[1]=s("h2",null,"Two representations, paid for twice",-1)),c(o,f({},{title:"",ranges:[]}),{default:l(()=>[...a[0]||(a[0]=[s("pre",{class:"shiki shiki-themes marp-sunburst marp-sunburst slidev-code",style:{"--shiki-light":"#ffffff","--shiki-dark":"#ffffff","--shiki-light-bg":"#182b3a","--shiki-dark-bg":"#182b3a"}},[s("code",{class:"language-text"},[s("span",{class:"line"},[s("span",null,"  WRITE (agent)                   READ (agent)")]),n(`
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
`),s("span",{class:"line"},[s("span",null,"  ╰────────────────────────────────────────────╯")])])],-1)])]),_:1},16),a[2]||(a[2]=s("ul",null,[s("li",null,[n("Stored once, kept in "),s("strong",null,"two"),n(" forms, translated on every access")])],-1))]),_:1},16)}}};export{C as default};
