import{_ as c}from"./slidev/VClicks-D-ELI-2W.js";import{_ as u}from"./slidev/CodeBlockWrapper.vue_vue_type_script_setup_true_lang-pclfTHbZ.js";import{o as d,V as m,a3 as e,b as s,a2 as l,au as f,a4 as n,ax as h,ay as k,G as t}from"./modules/vue-8QF3wQng.js";import{I as _}from"./slidev/default-BUFg2aGg.js";import{u as g,f as x}from"./slidev/context-XxSzQgfC.js";import"./index-CM0Gaf6f.js";import"./modules/shiki-BFg_G924.js";import"./modules/unplugin-icons-oR_3B1DO.js";const w={class:"text-xs leading-tight"},N={__name:"if-splade.md__slidev_7",setup(b){const{$clicksContext:o,$frontmatter:r}=g();return o.setup(),(L,a)=>{const i=u,p=c;return d(),m(_,h(k(t(x)(t(r),6))),{default:e(()=>[a[2]||(a[2]=s("h2",null,"SPLADE: the same dot product, learned terms and weights",-1)),s("div",w,[l(i,f({},{title:"",ranges:[]}),{default:e(()=>[...a[0]||(a[0]=[s("pre",{class:"shiki shiki-themes marp-sunburst marp-sunburst slidev-code",style:{"--shiki-light":"#ffffff","--shiki-dark":"#ffffff","--shiki-light-bg":"#182b3a","--shiki-dark-bg":"#182b3a"}},[s("code",{class:"language-text"},[s("span",{class:"line"},[s("span",null,'  "heart attack"  →  [CLS]   heart   attack   [SEP]        4 positions, through BERT')]),n(`
`),s("span",{class:"line"},[s("span",null,"                        │       │        │       │")]),n(`
`),s("span",{class:"line"},[s("span",null,"     MLM head ──────────┴───────┴────────┴───────┘")]),n(`
`),s("span",{class:"line"},[s("span",null,"                        ↓       ↓        ↓       ↓")]),n(`
`),s("span",{class:"line"},[s("span",null,"     EVERY position scores ALL 30,522 words.  score = log(1 + ReLU(logit))")]),n(`
`),s("span",{class:"line"},[s("span")]),n(`
`),s("span",{class:"line"},[s("span",null,"                     [CLS]   heart   attack   [SEP]      max    kept from")]),n(`
`),s("span",{class:"line"},[s("span",null,"        heart        0.537   1.599    0.962   0.000  →  1.599   heart")]),n(`
`),s("span",{class:"line"},[s("span",null,"        attack       0.000   0.000    1.133   0.000  →  1.133   attack")]),n(`
`),s("span",{class:"line"},[s("span",null,"        cardiac      0.000   0.767    0.000   0.000  →  0.767   heart")]),n(`
`),s("span",{class:"line"},[s("span",null,"        stroke       0.000   0.323    0.589   0.000  →  0.589   attack")]),n(`
`),s("span",{class:"line"},[s("span",null,"        disease      0.331   0.000    0.669   0.000  →  0.669   attack")]),n(`
`),s("span",{class:"line"},[s("span",null,"          ⋮            ⋮       ⋮        ⋮       ⋮           ⋮")]),n(`
`),s("span",{class:"line"},[s("span",null,"     words scored:     47      19       25       0      →  71 non-zero of 30,522")]),n(`
`),s("span",{class:"line"},[s("span")]),n(`
`),s("span",{class:"line"},[s("span",null,"  the indexed vector, a bag of weighted words:")]),n(`
`),s("span",{class:"line"},[s("span")]),n(`
`),s("span",{class:"line"},[s("span",null,"     { heart: 1.599, attack: 1.133, die: 0.773, cardiac: 0.767, ... 71 entries }")])])],-1)])]),_:1},16)]),l(p,null,{default:e(()=>[...a[1]||(a[1]=[s("ul",null,[s("li",null,[s("p",null,[n('Not "each token proposes its own words". '),s("strong",null,"Every token scores the whole vocabulary"),n(", then each word keeps its single best score")])]),s("li",null,[s("p",null,[s("code",null,"stroke"),n(" is kept from "),s("strong",null,"attack"),n(", not "),s("code",null,"heart"),n(". And "),s("code",null,"[CLS]"),n(" scores "),s("strong",null,"47"),n(" words, more than either real token")])])],-1)])]),_:1})]),_:1},16)}}};export{N as default};
