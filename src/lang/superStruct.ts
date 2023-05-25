import {SuperScope} from '../scope.js';
import {SuperStruct, proxyStruct, SuperStructPublic} from '../lib/SuperStruct.js';
import {SuperItemDefinition} from '../types/SuperItemDefinition.js';


export function newSuperStruct<T = any>(scope: SuperScope) {
  return async (p: {
    definition: SuperItemDefinition,
    defaultRo?: boolean
  }): Promise<T & SuperStructPublic> => {
    const definition = await scope.$resolve(p.definition)
    const defaultRo = await scope.$resolve(p.defaultRo)
    const inner = new SuperStruct(scope, definition, defaultRo)

    return proxyStruct(inner)
  }
}
