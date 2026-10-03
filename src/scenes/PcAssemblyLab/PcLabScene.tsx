import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { Plane, Vector3, type Group, type PerspectiveCamera } from 'three';
import type { OrbitControls as Controls } from 'three-stdlib';
import { EnvironmentLighting } from '@/components/3d/EnvironmentLighting';
import { useLabText } from '@/hooks/useLabText';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { resolveBuild, type ResolvedBuild } from '@/lib/studio/build';
import { framingScale } from '@/lib/three/framing';
import { usePcLabStore } from '@/store/pcLabStore';
import { LAB_PARTS } from '@/lib/labs/pcAssembly';
import { Desk } from '@/scenes/DeskScene/models/Desk';
import { Room } from '@/scenes/DeskScene/models/Room';
import { PCCase } from '@/scenes/DeskScene/pc/PCCase';
import { HardwarePart } from '@/scenes/DeskScene/pc/HardwareParts';
import { PARTS, type PartId } from '@/scenes/DeskScene/pc/parts';
import { CASE_ORIGIN } from '@/scenes/DeskScene/pc/constants';
import { pcRig } from '@/scenes/DeskScene/pc/pcRig';
import { STUDIO_HDRI } from '@/scenes/SetupStudio/setupShared';

const SOURCE: Record<PartId, [number,number,number]> = {
  motherboard:[-.49,.93,-.16], cpu:[-.58,.87,.20], ram:[-.18,.9,-.18],
  ssd:[-.23,.85,.19], cooler:[.06,.96,-.16], psu:[-.65,.84,-.01], gpu:[-.15,.88,.05], fans:[.13,.9,.22],
};
const SCALES: Partial<Record<PartId,number>> = {cpu:2.2,ssd:1.8,fans:.55};
const targetFor=(id:PartId)=>{
  const d=PARTS.find(p=>p.id===id)!;
  return new Vector3(...CASE_ORIGIN).add(new Vector3(...d.anchor)).add(new Vector3(...d.center));
};

function FloatingPart({id,build}: {id:PartId;build:ResolvedBuild}) {
  const g=useRef<Group>(null);
  const installed=usePcLabStore(s=>s.installed.includes(id));
  const selected=usePcLabStore(s=>s.selected===id);
  const result=usePcLabStore(s=>s.result);
  const t=useT();
  const camera=useThree(s=>s.camera);
  const drag=useRef<{plane:Plane;target:Vector3;pointer:number;x:number;y:number;moved:boolean}|null>(null);
  const position=useMemo(()=>new Vector3(...SOURCE[id]),[id]);
  const hit=useMemo(()=>new Vector3(),[]);
  const def=PARTS.find(p=>p.id===id)!;
  const begin=(e:ThreeEvent<PointerEvent>)=>{
    if (installed||result) return;
    e.stopPropagation();
    usePcLabStore.getState().select(id);
    usePcLabStore.getState().setDragging(true);
    const target=targetFor(id);
    drag.current={plane:new Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new Vector3()),target),target,
      pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
    (e.target as unknown as {setPointerCapture:(id:number)=>void}).setPointerCapture(e.pointerId);
  };
  const move=(e:ThreeEvent<PointerEvent>)=>{
    const d=drag.current;
    if (!d) return;
    e.stopPropagation();
    d.moved ||= Math.hypot(e.clientX-d.x,e.clientY-d.y)>5;
    if (d.moved&&e.ray.intersectPlane(d.plane,hit)) position.copy(hit);
  };
  const end=(e:ThreeEvent<PointerEvent>)=>{
    const d=drag.current;
    if (!d) return;
    e.stopPropagation();
    (e.target as unknown as {releasePointerCapture:(id:number)=>void}).releasePointerCapture(d.pointer);
    if (d.moved) usePcLabStore.getState().install(id,position.distanceTo(d.target)<.14);
    usePcLabStore.getState().setDragging(false);
    drag.current=null;
    position.set(...SOURCE[id]);
  };
  useEffect(()=>{position.set(...SOURCE[id]);drag.current=null;},[id,position,installed]);
  useEffect(()=>()=>usePcLabStore.getState().setDragging(false),[]);
  useFrame((_,dt)=>{if(g.current)g.current.position.lerp(position,1-Math.exp(-Math.min(dt,.05)*14));});
  if (installed) return null;
  return <group ref={g} position={SOURCE[id]} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{drag.current=null;position.set(...SOURCE[id]);usePcLabStore.getState().setDragging(false);}}>
    <group scale={SCALES[id]??1} position={[-def.center[0],-def.center[1],-def.center[2]]}>
      <HardwarePart id={id} fallback={null} product={build[id==='cooler'?'cooling':id==='fans'?'case':id]}/>
    </group>
    <Html position={[0,.055,0]} center style={{pointerEvents:'none'}} zIndexRange={[3,0]}>
      <span style={{fontSize:10,whiteSpace:'nowrap',color:selected?'#89efff':'#c0cad8',background:'#0a1422dc',padding:'4px 6px',borderRadius:5}}>{t(`pc.parts.${id}.name` as TranslationKey)}</span>
    </Html>
  </group>;
}

function GhostTarget() {
  const selected=usePcLabStore(s=>s.selected);
  const l=useLabText();
  if (!selected || selected==='cables') return null;
  const target=targetFor(selected);
  const size: [number,number,number]=selected==='motherboard'?[.025,.305,.244]:selected==='gpu'?[.15,.07,.31]:selected==='psu'?[.15,.086,.16]:selected==='fans'?[.13,.35,.03]:[.07,.09,.07];
  return <group position={target}>
    <mesh onClick={e=>{e.stopPropagation();usePcLabStore.getState().install(selected);}}>
      <boxGeometry args={size}/><meshBasicMaterial color="#55e4ce" transparent opacity={.25} depthWrite={false}/>
    </mesh><mesh><boxGeometry args={size}/><meshBasicMaterial color="#7cf4da" wireframe transparent opacity={.8}/></mesh>
    <Html center position={[0,size[1]/2+.025,0]} style={{pointerEvents:'none'}} zIndexRange={[3,0]}><span style={{fontSize:10,color:'#7cf4da',whiteSpace:'nowrap'}}>{l('install')} ↓</span></Html>
  </group>;
}

function LabRig() {
  const animations=useRef<Partial<Record<PartId,number>>>({});
  const started=usePcLabStore(s=>s.started);
  const gl=useThree(s=>s.gl);
  useEffect(()=>{animations.current={};return()=>{pcRig.parts=null;pcRig.hidden=new Set();pcRig.cables=pcRig.fanSpeed=pcRig.rgbPower=1;};},[started]);
  useFrame((_,dt)=>{
    const s=usePcLabStore.getState();
    const hidden=new Set<PartId>();
    for(const id of LAB_PARTS){
      if(!s.installed.includes(id)) hidden.add(id);
      const v=animations.current[id]??1;
      animations.current[id]=s.installed.includes(id)?v*Math.exp(-Math.min(dt,.05)*6):1;
    }
    pcRig.hidden=hidden;pcRig.parts=animations.current;pcRig.glassOpen=1;pcRig.explode=0;
    pcRig.cables=s.installed.includes('cables')?1:0;
    pcRig.interior=.9;pcRig.glow=s.result?1:0;pcRig.fanSpeed=pcRig.rgbPower=s.result?1:0;
    gl.shadowMap.autoUpdate=false;
    if(s.dragging||Object.values(animations.current).some(v=>v!>.001&&v!<.999))gl.shadowMap.needsUpdate=true;
  });
  return null;
}

function LabCamera() {
  const {camera,size}=useThree();
  const controls=useRef<Controls>(null);
  const dragging=usePcLabStore(s=>s.dragging);
  useEffect(()=>{
    const target=new Vector3(.15,1.0,-.02), pos=new Vector3(-1.25,1.65,1.75);
    const aspect=size.width/size.height;
    const scale=framingScale(aspect)*(aspect<.7?1.12:1);
    camera.position.copy(pos.sub(target).multiplyScalar(scale).add(target));
    camera.lookAt(target);controls.current?.target.copy(target);
    const c=camera as PerspectiveCamera;
    if(size.width>850)c.setViewOffset(size.width,size.height,170,0,size.width,size.height);else c.clearViewOffset();
    return()=>c.clearViewOffset();
  },[camera,size.width,size.height]);
  return <OrbitControls ref={controls} makeDefault enabled={!dragging} enablePan={false} minDistance={.45} maxDistance={8} maxPolarAngle={Math.PI*.48} enableDamping/>;
}

export default function PcLabScene() {
  const ids=usePcLabStore(s=>s.build);
  const build=useMemo(()=>resolveBuild(ids),[ids]);
  return <><EnvironmentLighting hdri={STUDIO_HDRI} environmentIntensity={.65} intensity={1} shadowExtent={1.5} fog={[5,14]}/>
    <LabRig/><LabCamera/><Room orbit/><Desk/><PCCase rig="external" interactive={false} build={build}/>
    {LAB_PARTS.map(id=><FloatingPart key={id} id={id} build={build}/>)}<GhostTarget/>
  </>;
}
