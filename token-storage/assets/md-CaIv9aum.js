import{o as d,V as u,a3 as h,b as t,a4 as a,z as m,ax as c,ay as p,G as n}from"./modules/vue-CoOMDy5m.js";import{I as k}from"./slidev/default-9EsbZg5w.js";import{u as g,f}from"./slidev/context-B1JK9mpH.js";import{u as w}from"./slidev/useDarkMode-DHNI4PVF.js";import"./index-jFREmn6y.js";import"./modules/shiki-DCH9zjuJ.js";const y=["src"],L={__name:"token-storage.md__slidev_16",setup(z){const{$clicksContext:r,$frontmatter:o}=g();r.setup();const{isDark:i}=w(),l=s=>`/token-storage/charts/${s}.html${i.value?"?dark":""}`;return(s,e)=>(d(),u(k,c(p(n(f)(n(o),15))),{default:h(()=>[e[0]||(e[0]=t("h2",null,"Agent writes",-1)),t("iframe",{src:l("agent-write"),class:"w-full border-0",style:{height:"400px"},title:"Agent and human write latency"},null,8,y),e[1]||(e[1]=t("ul",null,[t("li",null,[a("The model "),t("strong",null,"already produced the IDs"),a(".")]),t("li",null,"A byte store throws them away, detokenizes (50.3us), then compresses")],-1)),m(`
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
`)]),_:1},16))}};export{L as default};
