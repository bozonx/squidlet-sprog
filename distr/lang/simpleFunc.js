import { evalInSandBox } from '../lib/sandBox.js';
/**
 * Define simple func in the top of scope
 * params:
 *   $exp: simpleFunc
 *   name: nameOfFunction
 *   argsNames: ['arg1', ...]
 *   lines: [{$exp: getValue, path: somePath}]
 */
export function setSimpleFunc(scope) {
    return async (p) => {
        const name = await scope.$resolve(p.name);
        const argsNames = await scope.$resolve(p.argsNames);
        // TODO: add lines
        scope[name] = await makeSimpleFunc(scope)({ argsNames });
    };
}
/**
 * Create simple func and return it
 * params:
 *   $exp: simpleFunc
 *   argsNames: ['arg1', ...]
 *   lines: [{$exp: getValue, path: somePath}]
 */
export function makeSimpleFunc(scope) {
    return async (p) => {
        const argsNames = await scope.$resolve(p.argsNames);
        // TODO: добавить значения по умолчанию
        // TODO: добавить ? необязательный аргумент
        // TODO: add lines
        const func = evalInSandBox(scope, `function() {}`);
    };
}
