import { createServer } from 'node:http';
import { execSync } from 'node:child_process';

const PORT = 3333;

// Get all commits via git
const raw = execSync('git log --pretty=format:"%H|%ad|%s" --date=short', {
  encoding: 'utf-8',
  maxBuffer: 1024 * 1024 * 10,
});

const commits = raw
  .trim()
  .split('\n')
  .map((line) => {
    const clean = line.replace(/^"|"$/g, '');
    const idx1 = clean.indexOf('|');
    const idx2 = clean.indexOf('|', idx1 + 1);
    if (idx1 === -1 || idx2 === -1) return null;
    return {
      hash: clean.slice(0, idx1),
      date: clean.slice(idx1 + 1, idx2),
      message: clean.slice(idx2 + 1),
    };
  })
  .filter(Boolean)
  .reverse();

// Parse conventional commit
function parseCommit(msg) {
  const m = msg.match(
    /^(feat|fix|chore|docs|refactor|style|test|ci|perf|revert|debug|wip)(\(([^)]+)\))?[!]?:\s*(.+)/
  );
  if (m) return { type: m[1], scope: m[3] || null, subject: m[4] };
  return { type: 'other', scope: null, subject: msg };
}

const enriched = commits.map((c) => ({ ...c, ...parseCommit(c.message) }));

const milestones = [
  {
    date: '2025-11-25',
    title: 'Project Genesis',
    desc: 'Turborepo monorepo + Next.js 16 + TypeScript',
  },
  {
    date: '2025-11-26',
    title: 'Design System v1',
    desc: 'Blueprint aesthetic, theme system, UI components',
  },
  {
    date: '2025-11-28',
    title: 'Registry Backend',
    desc: 'Prisma DB, API routes, NPM sync workers, tool search',
  },
  {
    date: '2025-11-30',
    title: 'Tool Playground',
    desc: 'AI SDK v6, Railway sandbox, interactive tool execution',
  },
  {
    date: '2025-12-04',
    title: 'Health & Dynamic Loading',
    desc: 'Health checks, BM25 search, dynamic tool loading, Deno executor',
  },
  {
    date: '2025-12-05',
    title: 'CLI Generator',
    desc: '@tpmjs/create-basic-tools, persistent Deno cache',
  },
  {
    date: '2026-01-09',
    title: 'Hot-Swap Executors',
    desc: 'Vercel Sandbox SDK, custom executor docs, Claude CI',
  },
  {
    date: '2026-01-11',
    title: 'Agent System',
    desc: 'Agent chat, tool error rendering, API reference docs',
  },
  {
    date: '2026-01-13',
    title: 'MCP Bridge & Auth',
    desc: 'MCP Bridge, API key auth, username/slug URLs',
  },
  {
    date: '2026-01-14',
    title: 'Integration Tests',
    desc: 'GitHub Actions CI, comprehensive integration tests',
  },
  {
    date: '2026-01-16',
    title: 'Design System v2',
    desc: '14 new components, SWR, style guide compliance',
  },
  {
    date: '2026-01-17',
    title: 'Agent Chat Redesign',
    desc: 'GPT-4.1 models, judge tool, password reset',
  },
  {
    date: '2026-01-18',
    title: 'Scenarios System',
    desc: 'CLI package, collection testing, browser auth',
  },
  {
    date: '2026-01-20',
    title: 'CI Automation',
    desc: 'Tool-request pipeline, E2B sandbox, label-triggered Claude',
  },
  {
    date: '2026-01-23',
    title: 'Omega AI Agent',
    desc: 'Full AI agent chat, BM25 auto-loading, env var management',
  },
  {
    date: '2026-01-25',
    title: 'Skills Platform',
    desc: 'RealSkills Q&A, Streamdown rendering, design refresh',
  },
  {
    date: '2026-01-27',
    title: 'Scenario Evaluation',
    desc: 'JSON Schema validation, complete eval system',
  },
  {
    date: '2026-02-03',
    title: 'Executor Templates',
    desc: 'Railway, Unsandbox, Vercel deployment guides',
  },
  {
    date: '2026-02-07',
    title: 'MCP Hardening',
    desc: 'Schema sanitization, Resend tools, llms.txt',
  },
  {
    date: '2026-02-09',
    title: 'Omega Mac & Integrations',
    desc: 'Native SwiftUI app, Slack, Discord, Supabase tools',
  },
  {
    date: '2026-02-10',
    title: 'Live Analytics',
    desc: 'Real DB stats, view tracking, production CLAUDE.md',
  },
];

const apiData = JSON.stringify({ commits: enriched, milestones });

const activeDays = [...new Set(commits.map((c) => c.date))].length;
console.log(`\n  TPMJS Development Timeline`);
console.log(`  ──────────────────────────`);
console.log(`  ${commits.length} commits analyzed`);
console.log(`  ${milestones.length} milestones identified`);
console.log(`  ${activeDays} active days\n`);
console.log(`  → http://localhost:${PORT}\n`);

const html = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TPMJS Development Timeline</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg: #faf9f6;
  --card: #fff;
  --hover: #f5f3ef;
  --text: #1a1a1a;
  --muted: #6b6b6b;
  --border: #e5e2db;
  --border-l: #f0ede6;
  --accent: #4a7c59;
  --accent-l: #e8f0eb;
  --ms-bg: #1a1a1a;
  --ms-text: #faf9f6;
}

body { font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text); overflow: hidden; height: 100vh; }

/* ---- HEADER ---- */
.hdr {
  height: 52px;
  border-bottom: 1px solid var(--border);
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(250,249,246,0.88);
  backdrop-filter: blur(16px);
  position: relative;
  z-index: 100;
}
.hdr h1 { font-size: 16px; font-weight: 700; letter-spacing: -0.03em; }
.hdr h1 span { color: var(--muted); font-weight: 400; margin-left: 6px; }
.hdr-stats { display: flex; gap: 20px; font-size: 12px; color: var(--muted); }
.hdr-stats b { color: var(--text); }

/* ---- FILTERS ---- */
.bar {
  height: 42px;
  border-bottom: 1px solid var(--border-l);
  padding: 0 28px;
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(250,249,246,0.92);
  backdrop-filter: blur(16px);
  position: relative;
  z-index: 99;
  overflow-x: auto;
}
.fl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin-right: 4px; flex-shrink: 0; }
.chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 500;
  cursor: pointer; border: 1px solid var(--border); background: var(--card); color: var(--muted);
  transition: all .12s; user-select: none; flex-shrink: 0;
}
.chip:hover { border-color: var(--muted); }
.chip.on { border-color: transparent; color: #fff; }
.chip .d { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.sep { width: 1px; height: 18px; background: var(--border); margin: 0 6px; flex-shrink: 0; }
.zc { margin-left: auto; display: flex; gap: 3px; align-items: center; flex-shrink: 0; }
.zb {
  width: 26px; height: 26px; border-radius: 5px; border: 1px solid var(--border);
  background: var(--card); cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: var(--muted); transition: all .12s;
}
.zb:hover { border-color: var(--muted); color: var(--text); }
.zl { font-size: 10px; color: var(--muted); min-width: 32px; text-align: center; font-family: 'JetBrains Mono', monospace; }

/* ---- TIMELINE ---- */
.tw {
  height: calc(100vh - 94px);
  overflow: auto;
  cursor: grab;
  position: relative;
}
.tw:active { cursor: grabbing; }
.tw::-webkit-scrollbar { width: 6px; height: 6px; }
.tw::-webkit-scrollbar-track { background: transparent; }
.tw::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

.tl { position: relative; padding: 0 0 80px; }

/* date ruler */
.ruler {
  position: sticky; top: 0; z-index: 50;
  display: flex; height: 32px;
  background: var(--bg);
  border-bottom: 2px solid var(--text);
}
.rm {
  flex-shrink: 0; font-size: 10px; font-weight: 600; color: var(--muted);
  position: relative; display: flex; align-items: flex-end; padding: 0 0 6px 6px;
  letter-spacing: .01em;
}
.rm::before {
  content: ''; position: absolute; bottom: -2px; left: 0;
  width: 1px; height: 6px; background: var(--text);
}
.rm.mo { color: var(--text); font-weight: 700; font-size: 11px; }
.rm.td { color: var(--accent); font-weight: 700; }
.rm.td::before { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); bottom: -5px; left: -3px; }

/* grid */
.gl { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--border-l); pointer-events: none; z-index: 0; }
.gl.mo { background: var(--border); }

/* cards */
.lanes { position: relative; padding-top: 12px; }
.cc {
  position: absolute; height: 26px; border-radius: 5px;
  padding: 0 8px; display: flex; align-items: center; gap: 5px;
  font-size: 10.5px; font-weight: 500; white-space: nowrap; overflow: hidden;
  cursor: pointer; transition: all .12s; box-shadow: 0 1px 2px rgba(0,0,0,.06);
  z-index: 1;
}
.cc:hover { z-index: 10; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.1); overflow: visible; }
.cc:hover .ct { overflow: visible; }
.cd { font-family: 'JetBrains Mono', monospace; font-size: 9px; opacity: .65; flex-shrink: 0; }
.ct { overflow: hidden; text-overflow: ellipsis; }

/* milestones */
.ms {
  position: absolute; z-index: 20; cursor: pointer;
}
.mf {
  background: var(--ms-bg); color: var(--ms-text);
  padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;
  white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,.12);
  position: relative; transition: all .12s;
}
.mf::after {
  content: ''; position: absolute; bottom: -5px; left: 12px;
  border-left: 5px solid transparent; border-right: 5px solid transparent;
  border-top: 5px solid var(--ms-bg);
}
.ms:hover .mf { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.18); }
.ml {
  position: absolute; top: 30px; left: 14px; width: 2px;
  background: repeating-linear-gradient(to bottom, var(--ms-bg) 0, var(--ms-bg) 3px, transparent 3px, transparent 7px);
  opacity: .2; pointer-events: none;
}
.md {
  display: none; position: absolute; top: 34px; left: 0;
  background: var(--card); border: 1px solid var(--border); border-radius: 7px;
  padding: 9px 12px; font-size: 11px; color: var(--muted); max-width: 200px;
  box-shadow: 0 4px 14px rgba(0,0,0,.1); z-index: 100; line-height: 1.5;
}
.ms:hover .md { display: block; }

/* today line */
.today { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--accent); z-index: 15; opacity: .5; }
.today span {
  position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
  background: var(--accent); color: #fff; padding: 2px 7px; border-radius: 3px;
  font-size: 9px; font-weight: 700; white-space: nowrap;
}

/* tooltip */
.tt {
  display: none; position: fixed; z-index: 1000;
  background: var(--card); border: 1px solid var(--border); border-radius: 8px;
  padding: 12px 16px; max-width: 380px; box-shadow: 0 10px 30px rgba(0,0,0,.12);
  font-size: 12px; line-height: 1.5; pointer-events: none;
}
.tt.show { display: block; }
.tt-h { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); margin-bottom: 3px; }
.tt-m { font-weight: 600; margin-bottom: 5px; }
.tt-r { display: flex; gap: 7px; align-items: center; }
.tt-t { display: inline-flex; padding: 1px 7px; border-radius: 3px; font-size: 10px; font-weight: 700; }
.tt-s { font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
.tt-d { font-size: 10px; color: var(--muted); margin-left: auto; }

/* summary */
.sum {
  position: fixed; right: 0; top: 0; width: 0; height: 100vh;
  background: var(--card); border-left: 1px solid var(--border);
  z-index: 200; overflow-y: auto; transition: width .25s;
  box-shadow: -4px 0 20px rgba(0,0,0,.06);
}
.sum.open { width: 340px; }
.sum-in { padding: 20px; }
.sum-x {
  position: absolute; top: 14px; right: 14px;
  width: 26px; height: 26px; border-radius: 5px; border: 1px solid var(--border);
  background: var(--card); cursor: pointer; display: flex; align-items: center;
  justify-content: center; font-size: 13px; color: var(--muted);
}
.sum h2 { font-size: 14px; font-weight: 700; margin-bottom: 14px; }
.ss { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-l); font-size: 12px; }
.ss .l { color: var(--muted); }
.ss .v { font-weight: 700; }
.sc { margin-top: 16px; }
.br { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 11px; }
.bl { width: 54px; text-align: right; font-weight: 500; font-family: 'JetBrains Mono', monospace; font-size: 10px; flex-shrink: 0; }
.bt { flex: 1; height: 16px; background: var(--bg); border-radius: 3px; overflow: hidden; }
.bf { height: 100%; border-radius: 3px; display: flex; align-items: center; padding-left: 5px; font-size: 9px; font-weight: 700; color: #fff; }

/* info btn */
.ib {
  position: fixed; bottom: 20px; right: 20px; z-index: 50;
  width: 36px; height: 36px; border-radius: 8px;
  background: var(--ms-bg); color: var(--ms-text); border: none;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.12); transition: all .12s;
}
.ib:hover { transform: scale(1.06); }

/* loading */
.loading {
  position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  background: var(--bg); z-index: 9999; font-size: 14px; color: var(--muted);
  transition: opacity .3s;
}
.loading.hide { opacity: 0; pointer-events: none; }
</style>
</head>
<body>

<div class="loading" id="loading">Loading timeline...</div>

<div class="hdr">
  <h1>TPMJS<span>Development Timeline</span></h1>
  <div class="hdr-stats" id="stats"></div>
</div>

<div class="bar" id="bar"><span class="fl">Filter</span></div>

<div class="tw" id="tw">
  <div class="tl" id="tl">
    <div class="ruler" id="ruler"></div>
    <div class="lanes" id="lanes"></div>
  </div>
</div>

<div class="tt" id="tt"></div>
<div class="sum" id="sum"><div class="sum-in" id="si"></div></div>
<button class="ib" id="ib" title="Summary">&#9776;</button>

<script>
(async function() {
  const res = await fetch('/api/data');
  const data = await res.json();
  const commits = data.commits;
  const milestones = data.milestones;
  document.getElementById('loading').classList.add('hide');
  init(commits, milestones);
})();

function init(commits, milestones) {
  const TC = {
    feat:{bg:'#4a7c59',t:'#fff'}, fix:{bg:'#c9a227',t:'#1a1a1a'},
    chore:{bg:'#8b8b8b',t:'#fff'}, docs:{bg:'#5b7fb5',t:'#fff'},
    refactor:{bg:'#9b6b9e',t:'#fff'}, style:{bg:'#c47a5a',t:'#fff'},
    test:{bg:'#5ba3a3',t:'#fff'}, ci:{bg:'#7a8b6e',t:'#fff'},
    perf:{bg:'#b5544a',t:'#fff'}, revert:{bg:'#a05555',t:'#fff'},
    debug:{bg:'#666',t:'#fff'}, wip:{bg:'#999',t:'#fff'},
    other:{bg:'#6b6b6b',t:'#fff'}
  };
  const today = '2026-02-15';
  const allDates = [...new Set(commits.map(c=>c.date))].sort();
  const d0 = allDates[0];
  const feats = commits.filter(c=>c.type==='feat').length;
  const fixes = commits.filter(c=>c.type==='fix').length;

  function dayDiff(a,b){ return Math.round((new Date(b)-new Date(a))/864e5); }
  const totalDays = dayDiff(d0, today) + 2;

  // stats
  document.getElementById('stats').innerHTML =
    '<div><b>'+commits.length+'</b> commits</div>'+
    '<div><b>'+feats+'</b> features</div>'+
    '<div><b>'+fixes+'</b> fixes</div>'+
    '<div><b>'+allDates.length+'</b> active days</div>'+
    '<div>'+d0+' &rarr; '+today+'</div>';

  // filters
  const types = [...new Set(commits.map(c=>c.type))].sort((a,b)=>{
    const o='feat fix refactor docs chore test ci style perf revert debug wip other'.split(' ');
    return o.indexOf(a)-o.indexOf(b);
  });
  const bar = document.getElementById('bar');
  const activeF = new Set();

  types.forEach(tp=>{
    const ch = document.createElement('button');
    ch.className='chip'; ch.dataset.type=tp;
    const c = TC[tp]||TC.other;
    ch.innerHTML='<span class="d" style="background:'+c.bg+'"></span>'+tp+' <span style="opacity:.5;font-size:9px">'+(commits.filter(x=>x.type===tp).length)+'</span>';
    ch.onclick=()=>{
      if(activeF.has(tp)){ activeF.delete(tp); ch.classList.remove('on'); ch.style.background=''; ch.style.borderColor=''; ch.style.color=''; }
      else { activeF.add(tp); ch.classList.add('on'); ch.style.background=c.bg; ch.style.borderColor=c.bg; ch.style.color=c.t; }
      render();
    };
    bar.appendChild(ch);
  });

  // zoom
  let dw = 90;
  const zDiv = document.createElement('div'); zDiv.className='zc';
  zDiv.innerHTML='<button class="zb" id="zo">&minus;</button><span class="zl" id="zlab">90</span><button class="zb" id="zi">+</button>';
  bar.appendChild(zDiv);
  document.getElementById('zi').onclick=()=>{ dw=Math.min(300,dw*1.3); document.getElementById('zlab').textContent=Math.round(dw); render(); };
  document.getElementById('zo').onclick=()=>{ dw=Math.max(20,dw*0.7); document.getElementById('zlab').textContent=Math.round(dw); render(); };

  const tw = document.getElementById('tw');
  tw.addEventListener('wheel', e=>{
    if(e.ctrlKey||e.metaKey){
      e.preventDefault();
      dw = Math.max(20,Math.min(300,dw*(e.deltaY<0?1.1:0.9)));
      document.getElementById('zlab').textContent=Math.round(dw);
      render();
    }
  },{passive:false});

  // drag
  let drag=false, sx, sl;
  tw.onmousedown=e=>{
    if(e.target.closest('.cc,.ms,.zb,.chip'))return;
    drag=true; sx=e.pageX; sl=tw.scrollLeft;
  };
  tw.onmouseleave=()=>drag=false;
  tw.onmouseup=()=>drag=false;
  tw.onmousemove=e=>{
    if(!drag)return; e.preventDefault();
    tw.scrollLeft=sl-(e.pageX-sx)*1.5;
  };

  // tooltip
  const ttEl = document.getElementById('tt');
  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function showTT(e,c){
    const col=TC[c.type]||TC.other;
    ttEl.innerHTML='<div class="tt-h">'+c.hash.slice(0,8)+'</div>'+
      '<div class="tt-m">'+esc(c.message)+'</div>'+
      '<div class="tt-r">'+
      '<span class="tt-t" style="background:'+col.bg+';color:'+col.t+'">'+c.type+'</span>'+
      (c.scope?'<span class="tt-s">'+c.scope+'</span>':'')+
      '<span class="tt-d">'+fmtFull(c.date)+'</span></div>';
    ttEl.classList.add('show');
    posTT(e);
  }
  function posTT(e){
    let x=e.clientX+14,y=e.clientY+14;
    if(x+380>innerWidth)x=e.clientX-394;
    if(y+100>innerHeight)y=e.clientY-110;
    ttEl.style.left=x+'px'; ttEl.style.top=y+'px';
  }
  function hideTT(){ ttEl.classList.remove('show'); }
  document.addEventListener('mousemove',e=>{ if(ttEl.classList.contains('show'))posTT(e); });

  const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(ds){ const d=new Date(ds+'T12:00:00'); return d.getDate()+' '+MO[d.getMonth()]; }
  function fmtFull(ds){ const d=new Date(ds+'T12:00:00'); return d.getDate()+' '+MO[d.getMonth()]+' '+d.getFullYear(); }
  function getX(dt){ return dayDiff(d0,dt)*dw; }

  function render(){
    const fc = activeF.size===0 ? commits : commits.filter(c=>activeF.has(c.type));
    const W = totalDays*dw + 80;
    const tl = document.getElementById('tl');
    tl.style.width = W+'px';

    // ruler
    const ruler = document.getElementById('ruler');
    ruler.innerHTML='';
    ruler.style.width=W+'px';

    const showEvery = dw<40?7:dw<65?3:1;
    const start = new Date(d0+'T12:00:00');

    for(let i=0;i<=totalDays;i++){
      const dd=new Date(start); dd.setDate(dd.getDate()+i);
      const ds=dd.toISOString().slice(0,10);
      const rm=document.createElement('div');
      rm.className='rm';
      rm.style.width=dw+'px';
      const isMo=dd.getDate()===1;
      const isTd=ds===today;
      if(isMo)rm.classList.add('mo');
      if(isTd)rm.classList.add('td');
      if(isMo||isTd||(i%showEvery===0)){
        rm.textContent=isMo?MO[dd.getMonth()]+' '+dd.getFullYear():fmt(ds);
      }
      ruler.appendChild(rm);
    }

    // lanes
    const lanes=document.getElementById('lanes');
    lanes.innerHTML='';

    // grid lines
    for(let i=0;i<=totalDays;i++){
      const dd=new Date(start); dd.setDate(dd.getDate()+i);
      const gl=document.createElement('div');
      gl.className='gl'+(dd.getDate()===1?' mo':'');
      gl.style.left=(i*dw)+'px';
      lanes.appendChild(gl);
    }

    // commit cards
    const LH=30;
    const slots=[];
    const byDate={};
    for(const c of fc){ if(!byDate[c.date])byDate[c.date]=[]; byDate[c.date].push(c); }
    const sortedD=Object.keys(byDate).sort();
    let maxL=0;

    for(const dt of sortedD){
      const cx=getX(dt);
      for(const c of byDate[dt]){
        const col=TC[c.type]||TC.other;
        const lab=c.subject||c.message;
        const cw=Math.max(dw*.85, Math.min(lab.length*6+70, dw*2.2));

        let lane=0;
        for(let l=0;l<slots.length;l++){
          if(slots[l]<=cx-3){lane=l;break;}
          lane=l+1;
        }
        if(lane>=slots.length)slots.push(0);
        slots[lane]=cx+cw;
        if(lane>maxL)maxL=lane;

        const el=document.createElement('div');
        el.className='cc';
        el.style.cssText='left:'+cx+'px;top:'+(lane*LH+40)+'px;width:'+cw+'px;background:'+col.bg+';color:'+col.t;
        el.innerHTML='<span class="cd">'+fmt(dt)+'</span><span class="ct">'+esc(lab)+'</span>';
        el.onmouseenter=e=>showTT(e,c);
        el.onmouseleave=hideTT;
        lanes.appendChild(el);
      }
    }

    lanes.style.height=((maxL+3)*LH+80)+'px';

    // milestones
    for(const ms of milestones){
      const mx=getX(ms.date);
      const el=document.createElement('div');
      el.className='ms';
      el.style.cssText='left:'+mx+'px;top:4px';
      const lh=Math.max(200,(maxL+2)*LH+40);
      el.innerHTML='<div class="mf">'+esc(ms.title)+'</div>'+
        '<div class="ml" style="height:'+lh+'px"></div>'+
        '<div class="md"><b>'+fmtFull(ms.date)+'</b><br>'+esc(ms.desc)+'</div>';
      lanes.appendChild(el);
    }

    // today
    const tx=getX(today);
    const tdEl=document.createElement('div');
    tdEl.className='today';
    tdEl.style.left=tx+'px';
    tdEl.innerHTML='<span>Today</span>';
    lanes.appendChild(tdEl);
  }

  render();

  // scroll to end (most recent)
  setTimeout(()=>{ tw.scrollLeft=tw.scrollWidth-tw.clientWidth; },150);

  // summary
  document.getElementById('ib').onclick=()=>{
    const s=document.getElementById('sum');
    s.classList.toggle('open');
    if(s.classList.contains('open'))renderSum();
  };

  function renderSum(){
    const si=document.getElementById('si');
    const tc={};
    for(const c of commits) tc[c.type]=(tc[c.type]||0)+1;
    const sorted=Object.entries(tc).sort((a,b)=>b[1]-a[1]);
    const mx=sorted[0][1];
    const sc={};
    for(const c of commits) if(c.scope) sc[c.scope]=(sc[c.scope]||0)+1;
    const topSc=Object.entries(sc).sort((a,b)=>b[1]-a[1]).slice(0,12);
    const dc={};
    for(const c of commits) dc[c.date]=(dc[c.date]||0)+1;
    const busiest=Object.entries(dc).sort((a,b)=>b[1]-a[1]).slice(0,5);

    si.innerHTML='<button class="sum-x" onclick="document.getElementById(\'sum\').classList.remove(\'open\')">&times;</button>'+
      '<h2>Project Summary</h2>'+
      '<div class="ss"><span class="l">Total commits</span><span class="v">'+commits.length+'</span></div>'+
      '<div class="ss"><span class="l">Features added</span><span class="v">'+(tc.feat||0)+'</span></div>'+
      '<div class="ss"><span class="l">Bugs fixed</span><span class="v">'+(tc.fix||0)+'</span></div>'+
      '<div class="ss"><span class="l">Milestones</span><span class="v">'+milestones.length+'</span></div>'+
      '<div class="ss"><span class="l">Active days</span><span class="v">'+allDates.length+'</span></div>'+
      '<div class="ss"><span class="l">Avg commits/day</span><span class="v">'+(commits.length/allDates.length).toFixed(1)+'</span></div>'+

      '<h2 style="margin-top:18px">Commit Types</h2><div class="sc">'+
      sorted.map(([tp,n])=>{const c=TC[tp]||TC.other;return '<div class="br"><span class="bl">'+tp+'</span><div class="bt"><div class="bf" style="width:'+(n/mx*100)+'%;background:'+c.bg+'">'+n+'</div></div></div>';}).join('')+
      '</div>'+

      '<h2 style="margin-top:18px">Top Scopes</h2><div class="sc">'+
      topSc.map(([s,n])=>'<div class="br"><span class="bl">'+s+'</span><div class="bt"><div class="bf" style="width:'+(n/topSc[0][1]*100)+'%;background:var(--accent)">'+n+'</div></div></div>').join('')+
      '</div>'+

      '<h2 style="margin-top:18px">Busiest Days</h2>'+
      busiest.map(([d,n])=>'<div class="ss"><span class="l">'+fmtFull(d)+'</span><span class="v">'+n+' commits</span></div>').join('');
  }
}
</script>
</body>
</html>`;

createServer((req, res) => {
  if (req.url === '/api/data') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(apiData);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }
}).listen(PORT);
