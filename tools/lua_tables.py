"""Minimal reader for the client's generated Lua config tables (Config.X = {...} with keys2Index/defaults).

Standard library only. It parses data literals; it never executes Lua."""
import re
TOK=re.compile(r'\s*(?:(--\[\[.*?\]\])|(--[^\n]*)|("(?:[^"\\]|\\.)*")|(\[\s*-?\d+(?:\.\d+)?\s*\]\s*=)|([A-Za-z_][A-Za-z0-9_]*\s*=(?!=))|(-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)|([{},;])|([A-Za-z_][A-Za-z0-9_.]*))',re.S)
def tokens(s,pos):
    out=[]
    while pos<len(s):
        m=TOK.match(s,pos)
        if not m: break
        pos=m.end()
        if m.group(1) or m.group(2): continue
        out.append(m)
    return out
def load_table(text, name):
    start=text.index('Config.%s = {'%name)+len('Config.%s = '%name)
    toks=[]; pos=start
    depth=0
    for m in TOK.finditer(text,start):
        g=m.lastindex
        val=m.group(g)
        toks.append((g,val.strip()))
        if val=='{': depth+=1
        elif val=='}':
            depth-=1
            if depth==0: break
    it=iter(range(len(toks)))
    idx=[0]
    def peek(): return toks[idx[0]]
    def nxt(): t=toks[idx[0]]; idx[0]+=1; return t
    def value():
        g,v=nxt()
        if v=='{':
            arr=[]; d={}; isd=False
            while True:
                g2,v2=peek()
                if v2=='}': nxt(); break
                if v2 in (',',';'): nxt(); continue
                if g2==4:
                    nxt(); k=float(re.sub(r'[\[\]=\s]','',v2)); k=int(k) if k==int(k) else k
                    d[k]=value(); isd=True
                elif g2==5:
                    nxt(); k=v2.rstrip('= ').strip(); d[k]=value(); isd=True
                else: arr.append(value())
            if isd:
                for i,a in enumerate(arr): d[i+1]=a
                return d
            return arr
        if g==3: return bytes(v[1:-1],'utf-8').decode('unicode_escape').encode('latin-1').decode('utf-8')
        if g==6: f=float(v); return int(f) if re.fullmatch(r'-?\d+',v) else f
        if v=='_': return None
        if v=='true': return True
        if v=='false': return False
        if v=='nil': return None
        return v
    return value()
def load(path,name):
    text=open(path,encoding='utf-8').read()
    rows=load_table(text,name)
    m=re.search(r'Config\.%s\.keys2Index = (\{[^}]*\})'%name,text)
    keys={k:int(v) for k,v in re.findall(r'(\w+)=(\d+)',m.group(1))}
    dm=re.search(r'Config\.%s\.defaults = \{'%name,text)
    defaults=load_table(text.replace('Config.%s.defaults = {'%name,'Config.__DEF = {'),'__DEF') if dm else {}
    out={}
    for rid,row in rows.items():
        r={}
        for k,i in keys.items():
            v=row[i-1] if isinstance(row,list) and i-1<len(row) else (row.get(i) if isinstance(row,dict) else None)
            if v is None: v=defaults.get(k)
            r[k]=v
        out[rid]=r
    return out
