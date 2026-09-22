import{_ as c}from"./slidev/VClicks-Bk1K9ErT.js";import{_ as u}from"./slidev/CodeBlockWrapper.vue_vue_type_script_setup_true_lang-BEK2L50F.js";import{o as d,V as m,a3 as e,b as s,a2 as l,au as f,a4 as a,ax as h,ay as k,G as t}from"./modules/vue-8QF3wQng.js";import{I as g}from"./slidev/default-BdptKgz1.js";import{u as _,f as x}from"./slidev/context-B5iU3c9n.js";import"./index-CJtpCXdy.js";import"./modules/shiki-BFg_G924.js";import"./modules/unplugin-icons-oR_3B1DO.js";const b={class:"text-xs leading-tight"},R={__name:"if-splade.md__slidev_7",setup(v){const{$clicksContext:o,$frontmatter:i}=_();return o.setup(),(w,n)=>{const r=u,p=c;return d(),m(g,h(k(t(x)(t(i),6))),{default:e(()=>[n[2]||(n[2]=s("h2",null,"SPLADE: learned tokens and weights",-1)),s("div",b,[l(r,f({},{title:"",ranges:[]}),{default:e(()=>[...n[0]||(n[0]=[s("pre",{class:"shiki shiki-themes marp-sunburst marp-sunburst slidev-code",style:{"--shiki-light":"#ffffff","--shiki-dark":"#ffffff","--shiki-light-bg":"#182b3a","--shiki-dark-bg":"#182b3a"}},[s("code",{class:"language-text"},[s("span",{class:"line"},[s("span",null,'  "heart attack"  →  [CLS]   heart   attack   [SEP]        4 positions, through BERT')]),a(`
`),s("span",{class:"line"},[s("span",null,"                        │       │        │       │")]),a(`
`),s("span",{class:"line"},[s("span",null,"     MLM head ──────────┴───────┴────────┴───────┘")]),a(`
`),s("span",{class:"line"},[s("span",null,"                        ↓       ↓        ↓       ↓")]),a(`
`),s("span",{class:"line"},[s("span",null,"     EVERY position scores ALL 30,522 words.  score = log(1 + ReLU(logit))")]),a(`
`),s("span",{class:"line"},[s("span")]),a(`
`),s("span",{class:"line"},[s("span",null,"                     [CLS]   heart   attack   [SEP]      max    kept from")]),a(`
`),s("span",{class:"line"},[s("span",null,"        heart        0.537   1.599    0.962   0.000  →  1.599   heart")]),a(`
`),s("span",{class:"line"},[s("span",null,"        attack       0.000   0.000    1.133   0.000  →  1.133   attack")]),a(`
`),s("span",{class:"line"},[s("span",null,"        cardiac      0.000   0.767    0.000   0.000  →  0.767   heart")]),a(`
`),s("span",{class:"line"},[s("span",null,"        stroke       0.000   0.323    0.589   0.000  →  0.589   attack ---> not from heart")]),a(`
`),s("span",{class:"line"},[s("span",null,"        disease      0.331   0.000    0.669   0.000  →  0.669   attack")]),a(`
`),s("span",{class:"line"},[s("span",null,"          ⋮            ⋮       ⋮        ⋮       ⋮           ⋮")]),a(`
`),s("span",{class:"line"},[s("span",null,"     words scored:     47      19       25       0      →  71 non-zero of 30,522")]),a(`
`),s("span",{class:"line"},[s("span")]),a(`
`),s("span",{class:"line"},[s("span",null,"  the indexed vector, a bag of weighted words:")]),a(`
`),s("span",{class:"line"},[s("span")]),a(`
`),s("span",{class:"line"},[s("span",null,"     { heart: 1.599, attack: 1.133, die: 0.773, cardiac: 0.767, ...")]),a(`
`),s("span",{class:"line"},[s("span",null,"       card: 0.568, ... ##io: 0.347, ... }            71 entries, 39 of them subwords")]),a(`
`),s("span",{class:"line"},[s("span",null,'                                                      card + ##io spells "cardio"')])])],-1)])]),_:1},16)]),l(p,null,{default:e(()=>[...n[1]||(n[1]=[s("ul",null,[s("li",null,[s("p",null,[s("strong",null,"Every token scores the whole vocabulary"),a(", then each vocab item keeps its max score")])]),s("li",null,[s("p",null,"Original tokens get get higher weight than expansions. Some are dropped")])],-1)])]),_:1})]),_:1},16)}}};export{R as default};
