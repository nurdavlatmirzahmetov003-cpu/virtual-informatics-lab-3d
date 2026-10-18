/** Native Node TS tests use the same @/ paths as Vite; no browser or build state is involved. */
import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const source = fileURLToPath(new URL('../src/',import.meta.url));
registerHooks({resolve(specifier,context,next){
  if(specifier.startsWith('@/') || (specifier.startsWith('.') && context.parentURL?.endsWith('.ts'))){
    const candidate=specifier.startsWith('@/')?path.join(source,specifier.slice(2)):fileURLToPath(new URL(specifier,context.parentURL));
    for(const name of [candidate,`${candidate}.ts`,path.join(candidate,'index.ts')]) if(existsSync(name)&&path.extname(name)==='.ts') return next(pathToFileURL(name).href,context);
    // locale dictionaries: Vite imports JSON without an import attribute; serve them as modules
    if(path.extname(candidate)==='.json'&&existsSync(candidate)) return {url:pathToFileURL(candidate).href+'?as-module',shortCircuit:true};
  }
  return next(specifier,context);
},load(url,context,next){
  if(url.endsWith('.json?as-module')) return {format:'module',source:`export default ${readFileSync(fileURLToPath(url.slice(0,-'?as-module'.length)),'utf8')};`,shortCircuit:true};
  return next(url,context);
}});
