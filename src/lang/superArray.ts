import {SuperScope} from '../scope.js';
import {proxyArray, SuperArray} from '../types/SuperArray.js';
import {AllTypes} from '../types/valueTypes.js';


export function newSuperArray(scope: SuperScope) {
  return async (p: {itemType: AllTypes}): Promise<any[]> => {
    const itemType = await scope.$resolve(p.itemType)
    const inner = new SuperArray(scope, itemType)

    return proxyArray(inner)
  }
}
