export const DEVICE_TYPES=['pc','laptop','router','switch','server','accessPoint','printer','smartphone'] as const;
export type DeviceType=typeof DEVICE_TYPES[number];
export interface NetworkNode {id:string;type:DeviceType;ip:string;mask:string;gateway:string;dns:string;x:number;y:number;}
export interface NetworkLink {a:string;b:string;}
export type NetworkTask='lan'|'router'|'address'|'repair';
export const NETWORK_TASKS:readonly NetworkTask[]=['lan','router','address','repair'];
export function ipv4(text:string):number|null {
  const parts=text.trim().split('.');
  if(parts.length!==4||parts.some(p=>!/^\d{1,3}$/.test(p)||Number(p)>255))return null;
  return parts.reduce((n,p)=>(n*256+Number(p))>>>0,0);
}
export function validMask(text:string) {
  const mask=ipv4(text);if(mask===null||mask===0||mask===0xffffffff)return false;
  const inverse=(~mask)>>>0;return (inverse&(inverse+1))===0;
}
export function validHost(node:NetworkNode) {
  const ip=ipv4(node.ip),mask=ipv4(node.mask);
  if(ip===null||mask===null||!validMask(node.mask))return false;
  const host=(ip&~mask)>>>0;
  return host!==0&&host!==((~mask)>>>0)&&ip>>>24!==0&&ip>>>24!==127&&ip>>>24<224;
}
const transit=(n:NetworkNode)=>n.type==='switch'||n.type==='router'||n.type==='accessPoint';
export function networkPath(nodes:readonly NetworkNode[],links:readonly NetworkLink[],source:string,target:string):string[]|null {
  const ids=new Set(nodes.map(n=>n.id));if(!ids.has(source)||!ids.has(target))return null;
  const queue=[[source]],seen=new Set([source]);
  while(queue.length){const path=queue.shift()!,last=path.at(-1)!;if(last===target)return path;
    if(last!==source&&!transit(nodes.find(n=>n.id===last)!))continue;
    for(const e of links){const next=e.a===last?e.b:e.b===last?e.a:null;if(next&&ids.has(next)&&!seen.has(next)){seen.add(next);queue.push([...path,next]);}}
  }
  return null;
}
export type PingReason='ok'|'noPath'|'invalidIP'|'duplicateIP'|'subnet'|'gateway';
export function ping(nodes:readonly NetworkNode[],links:readonly NetworkLink[],source:string,target:string):{reason:PingReason;path:string[]} {
  const from=nodes.find(n=>n.id===source),to=nodes.find(n=>n.id===target);
  if(!from||!to)return {reason:'noPath',path:[]};
  const path=networkPath(nodes,links,source,target);
  if(!path)return {reason:'noPath',path:[source]};
  if(!validHost(from)||!validHost(to))return {reason:'invalidIP',path:[source]};
  const addresses=nodes.filter(n=>n.type!=='switch'&&n.type!=='accessPoint').map(n=>ipv4(n.ip));
  if(addresses.some((ip,i)=>ip!==null&&addresses.indexOf(ip)!==i))return {reason:'duplicateIP',path:[source]};
  const a=ipv4(from.ip)!,b=ipv4(to.ip)!,mask=ipv4(from.mask)!;
  if(from.mask!==to.mask||(a&mask)!==(b&mask))return {reason:'subnet',path:[source]};
  return {reason:'ok',path};
}
export function gradeNetwork(task:NetworkTask,nodes:readonly NetworkNode[],links:readonly NetworkLink[]) {
  const pcs=nodes.filter(n=>n.type==='pc');
  if(pcs.length<3)return 0;
  const pairs=[[pcs[0],pcs[1]],[pcs[0],pcs[2]],[pcs[1],pcs[2]]];
  const successful=pairs.filter(([a,b])=>ping(nodes,links,a.id,b.id).reason==='ok').length;
  const viaSwitch=pairs.every(([a,b])=>networkPath(nodes,links,a.id,b.id)?.some(id=>nodes.find(n=>n.id===id)?.type==='switch'));
  if(task==='router'){
    const router=nodes.find(n=>n.type==='router');
    const valid=router&&validHost(router)&&pcs.slice(0,3).every(n=>n.gateway===router.ip&&networkPath(nodes,links,n.id,router.id)&&ping(nodes,links,n.id,router.id).reason==='ok');
    return valid&&viaSwitch?successful/3:0;
  }
  return viaSwitch?successful/3:0;
}
export function networkStart(task:NetworkTask):{nodes:NetworkNode[];links:NetworkLink[]} {
  const nodes:NetworkNode[]=[0,1,2].map(i=>({id:`PC${i+1}`,type:'pc',ip:`192.168.1.${i+10}`,mask:'255.255.255.0',gateway:'192.168.1.1',dns:'1.1.1.1',x:130,y:90+i*135}));
  nodes.push({id:'SW1',type:'switch',ip:'',mask:'255.255.255.0',gateway:'',dns:'',x:450,y:230});
  if(task==='router')nodes.push({id:'R1',type:'router',ip:'192.168.1.1',mask:'255.255.255.0',gateway:'',dns:'1.1.1.1',x:750,y:230});
  if(task==='address')nodes.forEach(n=>{if(n.type==='pc')n.ip='';});
  const links:NetworkLink[]=task==='lan'||task==='router'?[]:[{a:'PC1',b:'SW1'},{a:'PC2',b:'SW1'},{a:'PC3',b:'SW1'}];
  if(task==='repair'){nodes[2].ip=nodes[0].ip;links.pop();}
  return {nodes,links};
}
