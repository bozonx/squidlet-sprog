import {SuperScope} from '../scope.js';
import {SuperStruct, SuperItemDefinition, proxyStruct} from '../lib/SuperStruct.js';


export function newSuperStruct(scope: SuperScope) {
  return async (p: {
    definition: SuperItemDefinition,
    defaultRo?: boolean
  }): Promise<SuperStruct> => {
    const definition = await scope.$resolve(p.definition)
    const defaultRo = await scope.$resolve(p.defaultRo)
    const inner = new SuperStruct(scope, definition, defaultRo)

    return proxyStruct(inner)
  }
}
