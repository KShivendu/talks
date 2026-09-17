import{o as i,V as c,a3 as d,z as u,b as t,ax as l,ay as m,G as r}from"./modules/vue-Bhcaf6WO.js";import{I as k}from"./slidev/default-LhATU_pO.js";import{u as f,f as y}from"./slidev/context-DWJeXq-x.js";import{u as _}from"./slidev/useDarkMode-DdaygJYo.js";import"./index-BsfsTW5f.js";import"./modules/shiki-Dq2beWmg.js";const b=["src"],A={__name:"token-storage.md__slidev_15",setup(g){const{$clicksContext:o,$frontmatter:s}=f();o.setup();const{isDark:a}=_(),p=e=>`/token-storage/charts/${e}.html${a.value?"?dark":""}`;return(e,n)=>(i(),c(k,l(m(r(y)(r(s),14))),{default:d(()=>[u(`
## Fixing it:


<CodeBlockWrapper v-bind="{}" :title='""' :ranges='["all","3-8","10-15","12"]'>

\`\`\`python
# BPE numbers tokens by merge order. streamvbyte pays for big integers.
# So renumber once, by real-world frequency, and every document gets smaller.
corpus_ids = np.array(enc.encode(corpus_text), dtype=np.int64)
counts  = np.bincount(corpus_ids, minlength=VOCAB)
order   = np.argsort(-counts)                        # most -> least frequent
rank_of = np.empty(VOCAB, dtype=np.uint32)
rank_of[order] = np.arange(VOCAB, dtype=np.uint32)   # token id   -> freq rank
token_of_rank  = order                               # freq rank  -> token id

def compress(text):
    ids   = np.array(enc.encode(text), dtype=np.int64)
    ranks = rank_of[ids]                    # SAME tokens, new numbers
    out = np.zeros(len(ranks) * 2 + 1024, dtype=np.uint32)
    n = codec.encodeArray(ranks, len(ranks), out, len(out))       # streamvbyte
    return len(ranks).to_bytes(4, "big") + out[:n].tobytes()
\`\`\`

</CodeBlockWrapper>

`),n[0]||(n[0]=t("h2",null,"Pick your point on the curve",-1)),t("iframe",{src:p("frontier"),class:"w-full border-0",style:{height:"400px"},title:"Compression ratio against decode cost"},null,8,b)]),_:1},16))}};export{A as default};
