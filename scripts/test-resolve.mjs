/** Native Node TS tests use the same @/ paths as Vite; no browser or build state is involved. */
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const source = fileURLToPath(new URL('../src/',import.meta.url));
registerHooks({resolve(specifier,context,next){
  if(specifier.startsWith('@/') || (specifier.startsWith('.') && context.parentURL?.endsWith('.ts'))){
    const candidate=specifier.startsWith('@/')?path.join(source,specifier.slice(2)):fileURLToPath(new URL(specifier,context.parentURL));
    for(const name of [candidate,`${candidate}.ts`,path.join(candidate,'index.ts')]) if(existsSync(name)&&path.extname(name)==='.ts') return next(pathToFileURL(name).href,context);
  }
  return next(specifier,context);
}});
