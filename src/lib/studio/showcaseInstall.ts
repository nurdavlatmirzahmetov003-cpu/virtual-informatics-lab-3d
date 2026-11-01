import { caseMountsFor, installBuild, type Installed } from '@/scenes/DeskScene/pc/mounts';
import { showcaseBuild } from './showcase';

let cached: Installed | null = null;

/** The showcase build installed in its case by the mounting system (home, PC Assembly Lab, Connect Lab). */
export function showcaseInstalled(): Installed {
  const build = showcaseBuild();
  return (cached ??= installBuild(caseMountsFor(build.case?.id), build));
}
