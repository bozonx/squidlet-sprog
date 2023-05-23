import {SuperScope} from '../scope.js';
import {proxyArray, SuperArray} from '../lib/SuperArray.js';
import {All_TYPES} from '../types/valueTypes.js';
import {SuperItemDefinition} from '../types/SuperItemDefinition.js';


export function newSuperArray(scope: SuperScope) {
  return async (p: {item?: SuperItemDefinition}): Promise<any[]> => {
    const item = await scope.$resolve(p.item)
    const inner = new SuperArray(scope, item)

    return proxyArray(inner)
  }
}
