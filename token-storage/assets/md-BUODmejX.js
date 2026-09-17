import{o as c,V as l,a3 as h,b as o,z as u,ax as d,ay as m,G as s}from"./modules/vue-Bhcaf6WO.js";import{I as p}from"./slidev/default-Dt6iYizB.js";import{u as x,f}from"./slidev/context-BfP9Oii9.js";import{u as g}from"./slidev/useDarkMode-D3grXWjQ.js";import"./index-D-AqEuvB.js";import"./modules/shiki-Dq2beWmg.js";const w=["src"],C={__name:"token-storage.md__slidev_12",setup(k){const{$clicksContext:a,$frontmatter:r}=x();a.setup();const{isDark:n}=g(),i=t=>`/token-storage/charts/${t}.html${n.value?"?dark":""}`;return(t,e)=>(c(),l(p,d(m(s(f)(s(r),11))),{default:h(()=>[e[0]||(e[0]=o("h2",null,"And what does that compression cost to write?",-1)),o("iframe",{src:i("chunk-encode"),class:"w-full border-0",style:{height:"400px"},title:"Encode cost across chunk sizes"},null,8,w),u(`
Same competition and the same grey ramp as the ratio sweep, so the pair reads
as one thought: what you get, then what it costs.

The claim is the worst case for us, so nobody can argue the choice of
opponent: across all three corpora and all four sizes, the CHEAPEST byte codec
still costs 8.1-17.7x more than the DEAREST token method. Extreme against
extreme would be 526x -- true, but that is picking your rival.

Do NOT say "encode cost grows faster than the input", which this slide used to
claim. Against an input that grows 8x (512 -> 4,096), only zstd-19 outgrows it
(11.3-12.1x). gzip-9 and zstd --train are about linear (6.7-9.0x), and LZ4
(3.4-4.3x), +freq (2.1-4.6x), +ANS (4.5-7.1x) are all sublinear. brotli, which
the old note singled out at "18-35x", is 5.9-7.5x -- sublinear too.
`)]),_:1},16))}};export{C as default};
