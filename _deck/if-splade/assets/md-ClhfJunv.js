import{_ as u}from"./slidev/VClicks-lD6_2e0k.js";import{_ as c}from"./slidev/CodeBlockWrapper.vue_vue_type_script_setup_true_lang-DhyQgUJA.js";import{o as d,V as m,a3 as l,b as s,a2 as e,au as f,a4 as n,ax as g,ay as h,G as t}from"./modules/vue-8QF3wQng.js";import{I as _}from"./slidev/default-C7tL22wX.js";import{u as k,f as v}from"./slidev/context-DIb8UZ9f.js";import"./index-WcMOSgtb.js";import"./modules/shiki-BFg_G924.js";import"./modules/unplugin-icons-oR_3B1DO.js";const x={class:"text-xs leading-tight"},M={__name:"if-splade.md__slidev_7",setup(b){const{$clicksContext:o,$frontmatter:r}=k();return o.setup(),(w,a)=>{const p=c,i=u;return d(),m(_,g(h(t(v)(t(r),6))),{default:l(()=>[a[2]||(a[2]=s("h2",null,"SPLADE: the same dot product, learned terms and weights",-1)),s("div",x,[e(p,f({},{title:"",ranges:[]}),{default:l(()=>[...a[0]||(a[0]=[s("pre",{class:"shiki shiki-themes marp-sunburst marp-sunburst slidev-code",style:{"--shiki-light":"#ffffff","--shiki-dark":"#ffffff","--shiki-light-bg":"#182b3a","--shiki-dark-bg":"#182b3a"}},[s("code",{class:"language-text"},[s("span",{class:"line"},[s("span",null,'       "heart attack"  through  naver/splade-v3-doc')]),n(`
`),s("span",{class:"line"},[s("span",null,"                     │")]),n(`
`),s("span",{class:"line"},[s("span",null,"                     │  wordpiece")]),n(`
`),s("span",{class:"line"},[s("span",null,"             ┌───────┴───────┐")]),n(`
`),s("span",{class:"line"},[s("span",null,"           heart           attack                2 tokens")]),n(`
`),s("span",{class:"line"},[s("span",null,"             │               │")]),n(`
`),s("span",{class:"line"},[s("span",null,"             └───── BERT ────┘                   12 layers")]),n(`
`),s("span",{class:"line"},[s("span",null,"                     │")]),n(`
`),s("span",{class:"line"},[s("span",null,"                 MLM head                        30,522 scores per token")]),n(`
`),s("span",{class:"line"},[s("span",null,"                     │                           the layer that guessed masked words")]),n(`
`),s("span",{class:"line"},[s("span",null,"              log(1 + ReLU(·))                   negatives vanish, big values squash")]),n(`
`),s("span",{class:"line"},[s("span",null,"                     │")]),n(`
`),s("span",{class:"line"},[s("span",null,"              max over tokens                    each word once, at its strongest")]),n(`
`),s("span",{class:"line"},[s("span",null,"                     ▼")]),n(`
`),s("span",{class:"line"},[s("span",null,"  ┌──────────────────────────────────────────────────────┐")]),n(`
`),s("span",{class:"line"},[s("span",null,"  │  heart 1.60   attack 1.13   cardiac 0.77   die 0.77  │   71 non-zero")]),n(`
`),s("span",{class:"line"},[s("span",null,"  │  stroke 0.59  card 0.57     corona 0.50    …         │   of 30,522")]),n(`
`),s("span",{class:"line"},[s("span",null,"  └──────────────────────────────────────────────────────┘")])])],-1)])]),_:1},16)]),e(i,null,{default:l(()=>[...a[1]||(a[1]=[s("ul",null,[s("li",null,[s("p",null,[n("One weight per "),s("strong",null,"vocabulary"),n(" word, not per document word. Still a "),s("strong",null,"sparse dot product"),n(": same index, same engine as BM25")])]),s("li",null,[s("p",null,[s("code",null,"ReLU"),n(" is what makes it sparse: real documents average "),s("strong",null,"325 of 30,522"),n(" non-zero, about "),s("strong",null,"1%")])])],-1)])]),_:1})]),_:1},16)}}};export{M as default};
