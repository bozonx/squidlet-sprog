import {SuperScope} from '../scope.js';
import {proxyArray, SuperArray} from '../types/SuperArray.js';
import {AllTypes} from '../types/valueTypes.js';


export function newSuperArray(scope: SuperScope) {
  return async (p: {itemType?: AllTypes, readOnly?: boolean}): Promise<any[]> => {
    const itemType = await scope.$resolve(p.itemType)
    const readOnly = await scope.$resolve(p.readOnly)
    const inner = new SuperArray(scope, itemType, readOnly)

    return proxyArray(inner)
  }
}
