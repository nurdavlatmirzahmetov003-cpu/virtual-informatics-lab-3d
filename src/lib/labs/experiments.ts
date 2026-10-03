export const EXPERIMENTS=['cpuTemp','memory','storage','latency','binaryData','rgb','resolution','refresh'] as const;
export type Experiment=typeof EXPERIMENTS[number];
export interface Parameter {key:string;min:number;max:number;step:number;initial:number;unit:string;}
export const PARAMETERS:Record<Experiment,readonly Parameter[]>={
  cpuTemp:[{key:'load',min:0,max:100,step:5,initial:50,unit:'%'},{key:'ambient',min:10,max:35,step:1,initial:25,unit:'°C'}],
  memory:[{key:'capacity',min:4,max:64,step:4,initial:16,unit:'GB'},{key:'used',min:0,max:64,step:1,initial:8,unit:'GB'}],
  storage:[{key:'fileSize',min:100,max:10000,step:100,initial:1000,unit:'MB'},{key:'rate',min:50,max:7000,step:50,initial:500,unit:'MB/s'}],
  latency:[{key:'delay',min:1,max:150,step:1,initial:20,unit:'ms'}],
  binaryData:[{key:'value',min:0,max:255,step:1,initial:42,unit:''}],
  rgb:[{key:'R',min:0,max:255,step:1,initial:64,unit:''},{key:'G',min:0,max:255,step:1,initial:180,unit:''},{key:'B',min:0,max:255,step:1,initial:210,unit:''}],
  resolution:[{key:'width',min:640,max:3840,step:160,initial:1920,unit:'px'},{key:'height',min:480,max:2160,step:120,initial:1080,unit:'px'}],
  refresh:[{key:'frequency',min:30,max:300,step:30,initial:60,unit:'Hz'}],
};
export function experimentDefaults(kind:Experiment){return PARAMETERS[kind].map(p=>p.initial);}
export function experimentModel(kind:Experiment,values:readonly number[]):{value:number;unit:string;formula:string;fill:number} {
  const [a,b,c]=values;
  switch(kind){
    case 'cpuTemp':return {value:b+(15+80*a/100)*.35,unit:'°C',formula:`T = ${b} + (15 + 80 × ${a}/100) × 0.35`,fill:a/100};
    case 'memory':return {value:Math.max(0,a-b),unit:'GB free',formula:`free = ${a} − min(${a}, ${b})`,fill:Math.min(1,b/a)};
    case 'storage':return {value:a/b,unit:'s',formula:`t = ${a} MB ÷ ${b} MB/s`,fill:Math.min(1,b/7000)};
    case 'latency':return {value:a*2,unit:'ms RTT',formula:`RTT = 2 × ${a} ms`,fill:a/150};
    case 'binaryData':return {value:a.toString(2).split('1').length-1,unit:'bits = 1',formula:`${a} → ${a.toString(2).padStart(8,'0')} → count(1)`,fill:a/255};
    case 'rgb':return {value:(a+b+c)/3,unit:'channel mean',formula:`mean = (${a} + ${b} + ${c}) ÷ 3`,fill:(a+b+c)/765};
    case 'resolution':return {value:a*b/1_000_000,unit:'MP',formula:`pixels = ${a} × ${b} ÷ 1 000 000`,fill:a*b/(3840*2160)};
    case 'refresh':return {value:1000/a,unit:'ms/frame',formula:`frame time = 1000 ms ÷ ${a} Hz`,fill:a/300};
  }
}
export function gradeNumeric(answer:string,expected:number,integer=false) {
  if(!/^[-+]?\d+(?:[.,]\d+)?$/.test(answer.trim()))return 0;
  const n=Number(answer.trim().replace(',','.'));
  return Number.isFinite(n)&&(integer?n===expected:Math.abs(n-expected)<=.005)?1:0;
}
