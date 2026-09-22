import{_ as m}from"./slidev/VClicks-BPn9L9Ry.js";import{o as h,V as c,a3 as a,b as t,a2 as p,a4 as n,z as k,ax as g,ay as f,G as o}from"./modules/vue-CoOMDy5m.js";import{I as _}from"./slidev/default-CybaTIvT.js";import{u as w,f as y}from"./slidev/context-BAjs2YpB.js";import{u as z}from"./slidev/useDarkMode-SSz8x6Ia.js";import"./index-DasGVWvN.js";import"./modules/shiki-DCH9zjuJ.js";const x=["src"],V={__name:"token-storage.md__slidev_16",setup(b){const{$clicksContext:r,$frontmatter:i}=w();r.setup();const{isDark:l}=z(),u=s=>`/token-storage/charts/${s}.html${l.value?"?dark":""}`;return(s,e)=>{const d=m;return h(),c(_,g(f(o(y)(o(i),15))),{default:a(()=>[e[1]||(e[1]=t("h2",null,"Agent writes",-1)),t("iframe",{src:u("agent-write"),class:"w-full border-0 mt-3",style:{height:"338px"},title:"Agent and human write latency"},null,8,x),p(d,null,{default:a(()=>[...e[0]||(e[0]=[t("ul",null,[t("li",null,[n("The model "),t("strong",null,"already produced the IDs"),n(".")]),t("li",null,"A byte store throws them away, detokenizes (50.3us), then compresses")],-1)])]),_:1}),k(`
LOG axis, unlike the read chart: this spans 0.5us to 405us, and on a linear
axis every token bar vanishes into the baseline.

TOKEN IDs, English: r50k raw 0.5us against LZ4's 48.4us, gzip-9 71.6, zstd-19
254.8, zstd --train 405.0. The model already emitted the IDs, so a token store
just packs them; a byte store has to detokenize first (45.5us) and then
compress.

UTF-8 flips it: LZ4 2.9us against r50k raw's 235.8, because a text writer hands
you characters and somebody has to tokenize them. Real cost, rarer path -- in
an agentic system the agent does most of the writing.

AGENT write, English: r50k raw 1.9us against LZ4 35.1us, gzip 130.8, zstd-19
727.9, zstd --train 960.2. The model emitted the IDs, so a token store just
packs them; a byte store has to detokenize first and then compress.

HUMAN write: r50k raw 439.8us, LZ4 11.4us -- flipped, because a human hands you
text and somebody must tokenize it. That is a real cost and worth naming. In an
agentic system it is also the rarer path: the agent does most of the writing.
`)]),_:1},16)}}};export{V as default};
