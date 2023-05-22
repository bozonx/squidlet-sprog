import {SuperScope} from '../scope.js';
import {proxyArray, SuperArray, SuperArrayItemDefinition} from '../types/SuperArray.js';


export function newSuperArray(scope: SuperScope) {
  return async (p: {item: SuperArrayItemDefinition}): Promise<any[]> => {
    const item = await scope.$resolve(p.item)
    const structInner = new SuperArray(scope, item)

    return proxyArray(structInner)
  }
}
