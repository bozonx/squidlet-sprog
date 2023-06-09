import { SuperStruct } from '../lib/SuperStruct.js';
/**
 * Create a new proxified super struct
 * Example in yaml:
 *   $exp: newSuperStruct
 *   definition:
 *     param1:
 *       type: number
 *       default: 5
 *     # ... other params
 *   defaultRo: true
 *
 * Call it like this: `scope.$run(parsedYaml)`
 */
export function newSuperStruct(scope) {
    return async (p) => {
        const definition = await scope.$resolve(p.definition);
        const defaultRo = await scope.$resolve(p.defaultRo);
        return (new SuperStruct(definition, defaultRo)).getProxy();
    };
}
