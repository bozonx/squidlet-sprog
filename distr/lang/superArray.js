import { proxyArray, SuperArray } from '../lib/SuperArray.js';
export function newSuperArray(scope) {
    return async (p) => {
        const item = await scope.$resolve(p.item);
        const defaultArray = await scope.$resolve(p.default);
        const inner = new SuperArray(scope, item, defaultArray);
        return proxyArray(inner);
    };
}
