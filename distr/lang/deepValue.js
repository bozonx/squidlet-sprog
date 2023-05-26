import { deepGet, deepSet, deepDelete } from 'squidlet-lib';
/**
 * Get simple or super value deeply from scope
 * params:
 *   $exp: getValue
 *   path: obj.param1
 * It supports arrays path like obj.arr[0].param.
 * Path can be an expression
 */
export function getValue(scope) {
    return async (p) => {
        const path = await scope.$resolve(p.path);
        const defaultValue = await scope.$resolve(p.defaultValue);
        return deepGet(scope, path, defaultValue);
    };
}
/**
 * Set to existent or not existent variable.
 * If some path parts doesn't exist then it will create them.
 * It supports arrays path like obj.arr[0].param.
 * params:
 *   $exp: setDeepValue
 *   path: obj.param1
 *   value: 1
 * or you can use expression
 *   $exp: setValue
 *     path: obj.param1
 *     value:
 *       $exp: getValue
 *       path: otherObj.param2
 */
export function setValue(scope) {
    return async (p) => {
        const path = await scope.$resolve(p.path);
        const value = await scope.$resolve(p.value);
        deepSet(scope, path, value);
    };
}
/**
 * Deeply delete a key
 * params:
 *   $exp: deleteValue
 *   path: pathToItemToDelete
 * Arrays are supported
 */
export function deleteValue(scope) {
    return async (p) => {
        const path = await scope.$resolve(p.path);
        deepDelete(scope, path);
    };
}
