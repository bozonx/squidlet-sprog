import {SprogFn, SuperScope} from '../src/lib/scope';
import {execSuperExp, SuperExpParams} from '../../../../../../mnt/disk2/workspace/squidlet-sprog/_old/SuperExp';


export const superExp: SprogFn = (scope: SuperScope) => {
  return async (p: SuperExpParams, scopeReplace?: SuperScope): Promise<any | void> => {
    const type = await scope.$resolve(p.type)
    const args = await scope.$resolve(p.args)
    const resolvedArgs = await Promise.all(args.map((el: any) => scope.$resolve(el)))

    return execSuperExp(scopeReplace || scope, type, resolvedArgs)
  }
}
