import { SuperData } from '../lib/SuperData.js';
/**
 * Create a new proxified super data
 * Example in yaml:
 *   $exp: newSuperData
 *   definition:
 *     param1:
 *       type: number
 *       default: 5
 *     # ... other params
 *   defaultRo: true
 *
 * Call it like this: `scope.$run(parsedYaml)`
 */
export function newSuperData(scope) {
    return async (p) => {
        const definition = await scope.$resolve(p.definition);
        const defaultRo = await scope.$resolve(p.defaultRo);
        return (new SuperData(definition, defaultRo)).getProxy();
    };
}
