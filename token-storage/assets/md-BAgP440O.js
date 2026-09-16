import{_ as p}from"./slidev/CodeBlockWrapper.vue_vue_type_script_setup_true_lang-Dbze-x4p.js";import{o as i,V as u,a3 as e,b as s,a2 as c,au as f,a4 as n,ax as m,ay as d,G as l}from"./modules/vue-BxUlBWr5.js";import{I as k}from"./slidev/default-CPmYQ5Nw.js";import{u as g,f as _}from"./slidev/context-CQp5oRl9.js";import"./modules/unplugin-icons-iXY3DeVX.js";import"./index-BJsXe0o0.js";import"./modules/shiki-t6mM8Mf5.js";const C={__name:"token-storage.md__slidev_16",setup(x){const{$clicksContext:t,$frontmatter:o}=g();return t.setup(),(b,a)=>{const r=p;return i(),u(k,m(d(l(_)(l(o),15))),{default:e(()=>[a[1]||(a[1]=s("h2",null,"Two representations, paid for twice",-1)),c(r,f({},{title:"",ranges:[]}),{default:e(()=>[...a[0]||(a[0]=[s("pre",{class:"shiki shiki-themes marp-sunburst marp-sunburst slidev-code",style:{"--shiki-light":"#ffffff","--shiki-dark":"#ffffff","--shiki-light-bg":"#182b3a","--shiki-dark-bg":"#182b3a"}},[s("code",{class:"language-text"},[s("span",{class:"line"},[s("span",null,"   WRITE (agent)                    READ (agent)")]),n(`
`),s("span",{class:"line"},[s("span",null,"   +------------+                   +------------+")]),n(`
`),s("span",{class:"line"},[s("span",null,"   | token IDs  |                   | token IDs  |")]),n(`
`),s("span",{class:"line"},[s("span",null,"   +------------+                   +------------+")]),n(`
`),s("span",{class:"line"},[s("span",null,"         | detokenize  50us               ^ tokenize  237us")]),n(`
`),s("span",{class:"line"},[s("span",null,"         v                                |")]),n(`
`),s("span",{class:"line"},[s("span",null,"   +------------+                   +------------+")]),n(`
`),s("span",{class:"line"},[s("span",null,"   | UTF-8 text |                   | UTF-8 text |")]),n(`
`),s("span",{class:"line"},[s("span",null,"   +------------+                   +------------+")]),n(`
`),s("span",{class:"line"},[s("span",null,"         | LZ4 compress  2.9us            ^ LZ4 decompress  1.0us")]),n(`
`),s("span",{class:"line"},[s("span",null,"         v                                |")]),n(`
`),s("span",{class:"line"},[s("span",null,"   +----------------[ DISK ]-----------------+")])])],-1)])]),_:1},16),a[2]||(a[2]=s("ul",null,[s("li",null,[n("Stored once, kept in "),s("strong",null,"two"),n(" forms, translated on every access")])],-1))]),_:1},16)}}};export{C as default};
