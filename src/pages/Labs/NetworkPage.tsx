import { useRef, useState, type PointerEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import { useEducationText, type EducationKey } from '@/hooks/useEducationText';
import { DEVICE_TYPES,NETWORK_TASKS,gradeNetwork,networkStart,ping,type DeviceType,type NetworkTask,type PingReason } from '@/lib/labs/network';
import { assess,type Assessment } from '@/lib/labs/assessment';
import { useProgressStore } from '@/store/progressStore';
import { ExerciseResult } from './ExerciseResult';
import styles from './Learning.module.css';

function NetworkWorkspace({task}:{task:NetworkTask}){
  const l=useEducationText();
  const [nodes,setNodes]=useState(()=>networkStart(task).nodes),[links,setLinks]=useState(()=>networkStart(task).links);
  const [selected,setSelected]=useState('PC1'),[from,setFrom]=useState('PC1'),[to,setTo]=useState('SW1'),[port,setPort]=useState<string|null>(null);
  const [message,setMessage]=useState<PingReason|null>(null),[packet,setPacket]=useState<{path:string[];ok:boolean;id:number}|null>(null),[result,setResult]=useState<Assessment|null>(null),[started,setStarted]=useState(Date.now);
  const drag=useRef<{id:string;dx:number;dy:number}|null>(null),svg=useRef<SVGSVGElement>(null);
  const position=(e:PointerEvent)=>{const r=svg.current!.getBoundingClientRect();return{x:(e.clientX-r.left)*1000/r.width,y:(e.clientY-r.top)*500/r.height};};
  const invalidate=()=>{setResult(null);setPacket(null);setMessage(null);};
  const connect=(a:string,b:string)=>{if(a===b||!nodes.some(n=>n.id===a)||!nodes.some(n=>n.id===b))return;if(!links.some(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a))){setLinks(es=>[...es,{a,b}]);invalidate();}setPort(null);};
  const add=(type:DeviceType)=>{if(nodes.length>=16)return;const n=nodes.length+1;setNodes(ns=>[...ns,{id:`${type.toUpperCase()}${n}`,type,ip:type==='switch'||type==='accessPoint'?'':`192.168.1.${20+n}`,mask:'255.255.255.0',gateway:'192.168.1.1',dns:'1.1.1.1',x:600+(n%3)*130,y:80+(n%3)*140}]);invalidate();};
  const runPing=()=>{const p=ping(nodes,links,from,to);setMessage(p.reason);setPacket({path:p.path,ok:p.reason==='ok',id:Date.now()});};
  const grade=()=>{const fraction=gradeNetwork(task,nodes,links);const a={...assess(`network:${task}`,fraction,(Date.now()-started)/1000),errors:Math.ceil(3*(1-fraction))};setResult(a);useProgressStore.getState().record(a);};
  const reset=()=>{const data=networkStart(task);setNodes(data.nodes);setLinks(data.links);setSelected('PC1');setFrom('PC1');setTo('SW1');setPort(null);setStarted(Date.now());invalidate();};
  const node=nodes.find(n=>n.id===selected);
  const packetPath=packet?.path.map((id,i)=>{const n=nodes.find(n=>n.id===id);return n?`${i?'L':'M'} ${n.x} ${n.y}`:'';}).join(' ');
  return <div className={styles.grid}><section className={styles.surface}><div className={styles.palette}>{DEVICE_TYPES.map(type=><button key={type} disabled={nodes.length>=16} onClick={()=>add(type)}>{l(type)} +</button>)}</div><p>{l('portHint')}</p>
    <div className={styles.board}><svg ref={svg} viewBox="0 0 1000 500" aria-label={l('devices')} onPointerMove={e=>{if(drag.current){const p=position(e),d=drag.current;setNodes(ns=>ns.map(n=>n.id===d.id?{...n,x:Math.max(60,Math.min(940,p.x-d.dx)),y:Math.max(40,Math.min(460,p.y-d.dy))}:n));}}} onPointerUp={e=>{if(port){const p=position(e);const end=nodes.find(n=>Math.hypot(n.x+58-p.x,n.y-p.y)<40);if(end&&end.id!==port)connect(port,end.id);}drag.current=null;}} onPointerCancel={()=>{drag.current=null;setPort(null);}}>
      {links.map((edge,i)=>{const a=nodes.find(n=>n.id===edge.a),b=nodes.find(n=>n.id===edge.b);return a&&b?<path key={`${edge.a}${edge.b}`} className={styles.wire} d={`M ${a.x+58} ${a.y} C ${(a.x+b.x)/2} ${a.y}, ${(a.x+b.x)/2} ${b.y}, ${b.x+58} ${b.y}`} onClick={()=>{setLinks(es=>es.filter((_,j)=>i!==j));invalidate();}}><title>{edge.a} ↔ {edge.b} · ×</title></path>:null;})}
      {nodes.map(n=><g key={n.id} transform={`translate(${n.x},${n.y})`} className={styles.node} data-selected={selected===n.id} onPointerDown={e=>{if(e.button!==0)return;setSelected(n.id);const p=position(e);drag.current={id:n.id,dx:p.x-n.x,dy:p.y-n.y};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerUp={e=>{drag.current=null;e.currentTarget.releasePointerCapture(e.pointerId);}}>
        <rect x={-58} y={-30} width={116} height={60} rx={10}/><text x={-44} y={-8}>{n.id}</text><text className={styles.caption} x={-44} y={10}>{l(n.type)}</text><text className={styles.caption} x={-44} y={25}>{n.ip||'—'}</text>
        <circle className={styles.port} cx={58} cy={0} r={9} onPointerDown={e=>{e.stopPropagation();if(port&&port!==n.id)connect(port,n.id);else setPort(n.id);}}><title>{n.id} PORT</title></circle>
      </g>)}
      {packetPath&&<circle key={packet!.id} r={7} fill={packet!.ok?'#92f1b9':'#ee8c82'}><animateMotion path={packetPath} dur="2s" repeatCount="1" fill="freeze"/></circle>}
    </svg></div><div className={styles.controls}><label className={styles.field}>{l('from')}<select value={from} onChange={e=>setFrom(e.target.value)}>{nodes.map(n=><option key={n.id}>{n.id}</option>)}</select></label><label className={styles.field}>{l('to')}<select value={to} onChange={e=>setTo(e.target.value)}>{nodes.map(n=><option key={n.id}>{n.id}</option>)}</select></label><button onClick={()=>connect(from,to)}>{l('connect')}</button><button onClick={runPing}>PING</button></div>{message&&<p role="status">{l(message)}</p>}<p>{l('networkNote')}</p></section>
    <aside className={styles.surface}><h2>{l('assignment')}</h2><p>{l(task==='router'?'routerTask':task)}</p><div className={styles.controls}><button className={styles.primary} disabled={Boolean(result)} onClick={grade}>{l('check')}</button><button onClick={reset}>{l('retry')}</button></div>{result&&<><p role="status">{l(result.score===100?'correct':'tryAgain')}{result.score!==100&&` ${l(task==='router'?'gateway':'noPath')}`}</p><ExerciseResult result={result}/></>}
      <h3>{l('settings')}</h3><label className={styles.field}>{l('devices')}<select value={selected} onChange={e=>setSelected(e.target.value)}>{nodes.map(n=><option key={n.id}>{n.id}</option>)}</select></label>
      {node&&(['ip','mask','gateway','dns'] as const).map(field=><label className={styles.field} key={field}>{field==='mask'?l('mask'):field.toUpperCase()}<input disabled={node.type==='switch'||node.type==='accessPoint'} value={node[field]} onChange={e=>{setNodes(ns=>ns.map(n=>n.id===selected?{...n,[field]:e.target.value}:n));invalidate();}}/></label>)}
      <button className={styles.button} disabled={!selected} onClick={()=>{setNodes(ns=>ns.filter(n=>n.id!==selected));setLinks(es=>es.filter(e=>e.a!==selected&&e.b!==selected));const remaining=nodes.filter(n=>n.id!==selected);setSelected(remaining[0]?.id??'');setFrom(remaining[0]?.id??'');setTo(remaining[1]?.id??'');invalidate();}}>{l('remove')}</button>
    </aside></div>;
}
export default function NetworkPage(){const t=useT(),l=useEducationText(),[params,setParams]=useSearchParams();const value=params.get('task');const task=NETWORK_TASKS.includes(value as NetworkTask)?value as NetworkTask:'lan';return <PageLayout title={t('labs.modules.network.title')} subtitle={l('networkIntro')}><div className={styles.controls}>{NETWORK_TASKS.map(id=><button key={id} aria-pressed={id===task} onClick={()=>setParams({task:id})}>{l(id==='router'?'routerTask':id as EducationKey)}</button>)}</div><NetworkWorkspace key={task} task={task}/></PageLayout>;}
