export const ALGORITHMS=['linear','binary','bubble','selection','insertion'] as const;
export type Algorithm=typeof ALGORITHMS[number];
export interface AlgoStep { values:number[]; active:number[]; done:number[]; line:number; vars:Record<string,number>; event:'start'|'compare'|'swap'|'found'|'missing'|'finish'|'insert'; }
export const CODE:Record<Algorithm,readonly string[]>={
  linear:['for i = 0 … n − 1','  if a[i] == target: return i','return −1'],
  binary:['lo = 0; hi = n − 1','while lo ≤ hi','  mid = floor((lo + hi) / 2)','  if a[mid] == target: return mid','  if a[mid] < target: lo = mid + 1','  else: hi = mid − 1','return −1'],
  bubble:['for end = n − 1 … 1','  for j = 0 … end − 1','    if a[j] > a[j+1]','      swap(a[j], a[j+1])','return a'],
  selection:['for i = 0 … n − 2','  min = i','  for j = i + 1 … n − 1','    if a[j] < a[min]: min = j','  swap(a[i], a[min])','return a'],
  insertion:['for i = 1 … n − 1','  key = a[i]; j = i − 1','  while j ≥ 0 and a[j] > key','    a[j+1] = a[j]; j = j − 1','  a[j+1] = key','return a'],
};
export function parseArray(value:string):number[]|null {
  const tokens=value.trim().split(/[\s,;]+/);
  if(tokens.length<2||tokens.length>16||tokens.some(x=>!/^[-+]?\d+$/.test(x)))return null;
  const a=tokens.map(Number);return a.every(n=>Number.isSafeInteger(n)&&Math.abs(n)<=100)?a:null;
}
export function algorithmSteps(kind:Algorithm,input:readonly number[],target:number):AlgoStep[] {
  const a=[...input],steps:AlgoStep[]=[];
  const add=(line:number,event:AlgoStep['event'],active:number[]=[],vars:Record<string,number>={},done:number[]=[])=>steps.push({values:[...a],line,event,active:[...active],vars:{...vars},done:[...done]});
  add(0,'start');
  if(kind==='linear'){
    for(let i=0;i<a.length;i++){add(1,'compare',[i],{i,target});if(a[i]===target){add(1,'found',[i],{index:i});return steps;}}
    add(2,'missing',[],{index:-1});return steps;
  }
  if(kind==='binary'){
    // The UI explicitly shows that binary search requires sorted input.
    a.sort((x,y)=>x-y);add(0,'start');let lo=0,hi=a.length-1;
    while(lo<=hi){const mid=Math.floor((lo+hi)/2);add(2,'compare',[mid],{lo,hi,mid,target});if(a[mid]===target){add(3,'found',[mid],{index:mid});return steps;}if(a[mid]<target){lo=mid+1;add(4,'compare',[mid],{lo,hi,mid});}else{hi=mid-1;add(5,'compare',[mid],{lo,hi,mid});}}
    add(6,'missing',[],{index:-1});return steps;
  }
  if(kind==='bubble'){
    const done:number[]=[];
    for(let end=a.length-1;end>0;end--){for(let j=0;j<end;j++){add(2,'compare',[j,j+1],{j,end},done);if(a[j]>a[j+1]){[a[j],a[j+1]]=[a[j+1],a[j]];add(3,'swap',[j,j+1],{j,end},done);}}done.push(end);}
  } else if(kind==='selection'){
    for(let i=0;i<a.length-1;i++){let min=i;for(let j=i+1;j<a.length;j++){add(3,'compare',[min,j],{i,j,min},Array.from({length:i},(_,k)=>k));if(a[j]<a[min])min=j;}
      [a[i],a[min]]=[a[min],a[i]];add(4,'swap',[i,min],{i,min});}
  } else {
    for(let i=1;i<a.length;i++){const key=a[i];let j=i-1;add(1,'compare',[i],{i,j,key});while(j>=0&&a[j]>key){add(2,'compare',[j,j+1],{i,j,key});a[j+1]=a[j];j--;add(3,'insert',[j+1,j+2],{i,j,key});}a[j+1]=key;add(4,'insert',[j+1],{i,j,key});}
  }
  add(CODE[kind].length-1,'finish',[],{},a.map((_,i)=>i));return steps;
}
export function algorithmAnswer(kind:Algorithm,input:readonly number[],target:number) {
  const final=algorithmSteps(kind,input,target).at(-1)!;
  return kind==='linear'||kind==='binary'?String(final.vars.index):final.values.join(', ');
}
