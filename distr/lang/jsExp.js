import { evalInSandBox } from '../lib/sandBox.js';
/**
 * Execute JS expression and return result.
 * Params:
 *   $exp: jsExp
 *   exp: 'console.log(varFromScope)'
 * Param "exp" and be an expression
 */
export const jsExp = (scope) => {
    return async (p) => {
        if (typeof p.exp === 'undefined')
            return;
        const exp = await scope.$resolve(p.exp);
        return evalInSandBox(scope, exp);
    };
};
