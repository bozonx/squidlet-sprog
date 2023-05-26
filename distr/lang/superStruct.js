import { SuperStruct, proxyStruct } from '../lib/SuperStruct.js';
export function newSuperStruct(scope) {
    return async (p) => {
        const definition = await scope.$resolve(p.definition);
        const defaultRo = await scope.$resolve(p.defaultRo);
        const inner = new SuperStruct(scope, definition, defaultRo);
        return proxyStruct(inner);
    };
}
