import {SuperScope} from '../scope.js';
import {proxyArray, ProxyfiedArray, SuperArray} from '../lib/SuperArray.js';
import {SuperItemDefinition} from '../types/SuperItemDefinition.js';


export function newSuperArray(scope: SuperScope) {
  return async (p: {item?: SuperItemDefinition, default?: any[]}): Promise<ProxyfiedArray> => {
    const item = await scope.$resolve(p.item)
    const defaultArray = await scope.$resolve(p.default)
    const inner = new SuperArray(scope, item, defaultArray)

    return proxyArray(inner)
  }
}
