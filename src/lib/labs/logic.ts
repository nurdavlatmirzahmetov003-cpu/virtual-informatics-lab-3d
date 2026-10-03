export const GATES=['AND','OR','NOT','XOR','NAND','NOR'] as const;
export type GateType=typeof GATES[number];
export interface LogicGate {id:string;type:GateType;x:number;y:number;}
export interface LogicWire {from:string;to:string;port:0|1;}
export type LogicTask='and'|'notOr'|'xor'|'nand';
export const LOGIC_TASKS:readonly LogicTask[]=['and','notOr','xor','nand'];
export const expressions:Record<LogicTask,string>={and:'Y = A AND B',notOr:'Y = NOT(A) OR B',xor:'Y = A XOR B',nand:'Y = NOT(A AND B)'};
const apply=(t:GateType,a:boolean,b:boolean)=>({AND:a&&b,OR:a||b,NOT:!a,XOR:a!==b,NAND:!(a&&b),NOR:!(a||b)})[t];
export function logicValue(gates:readonly LogicGate[],wires:readonly LogicWire[],A:boolean,B:boolean):boolean|null {
  const visiting=new Set<string>(),cache=new Map<string,boolean|null>();
  const evalNode=(id:string):boolean|null=>{
    if(id==='A')return A;if(id==='B')return B;
    if(cache.has(id))return cache.get(id)!;
    if(visiting.has(id))return null;visiting.add(id);
    const gate=gates.find(g=>g.id===id);
    if(!gate&&id!=='Y')return null;
    const sources=(port:0|1)=>wires.filter(w=>w.to===id&&w.port===port);
    const first=sources(0),second=sources(1);
    let value:boolean|null=null;
    if(first.length===1){const a=evalNode(first[0].from);
      if(id==='Y')value=a;
      else if(a!==null&&gate){if(gate.type==='NOT')value=!a;else if(second.length===1){const b=evalNode(second[0].from);if(b!==null)value=apply(gate.type,a,b);}}
    }
    visiting.delete(id);cache.set(id,value);return value;
  };
  return evalNode('Y');
}
export function truthTable(gates:readonly LogicGate[],wires:readonly LogicWire[]) {
  return [false,true].flatMap(A=>[false,true].map(B=>({A,B,Y:logicValue(gates,wires,A,B)})));
}
export function expectedLogic(task:LogicTask,A:boolean,B:boolean) {
  return task==='and'?A&&B:task==='notOr'?!A||B:task==='xor'?A!==B:!(A&&B);
}
export function gradeLogic(task:LogicTask,gates:readonly LogicGate[],wires:readonly LogicWire[]) {
  const rows=truthTable(gates,wires);
  if(rows.some(r=>r.Y===null))return 0;
  return rows.filter(r=>r.Y===expectedLogic(task,r.A,r.B)).length/4;
}
