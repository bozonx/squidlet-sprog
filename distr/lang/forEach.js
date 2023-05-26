import { lastItem } from 'squidlet-lib';
import { newScope } from '../scope.js';
/**
 * Super for each cycle
 * It allows to iteract arrays and objects
 * params:
 *   $exp: forEach
 *   # default is false. If true then the cycle will start from the end
 *   reverse: false
 *   # src is a source array to iteract
 *   src:
 *     $exp: getValue
 *     path: somePath
 *   # do is an array of expressions which are called in local scope
 *   do:
 *     - $exp: setValue
 *       path: somePath
 *       value: 5
 */
export function forEach(scope) {
    return async (p) => {
        const src = await scope.$resolve(p.src);
        if (Array.isArray(src)) {
            const firstIndex = (p.reverse) ? src.length - 1 : 0;
            const laseIndex = (p.reverse) ? 0 : src.length - 1;
            // array iteration
            for (let i = (p.reverse) ? src.length - 1 : 0; (p.reverse) ? i >= src.length : i < src.length; (p.reverse) ? i-- : i++) {
                const localScopeInitial = {
                    i,
                    key: i,
                    value: src[i],
                    $isFirst: i === firstIndex,
                    $isLast: i === laseIndex,
                    // TODO: add skips
                    //$skipNext
                    //$skip
                    //$toStep
                };
                const localScope = newScope(localScopeInitial, scope);
                for (const oneDo of p.do) {
                    await localScope.$run(oneDo);
                }
                if (p.reverse)
                    i--;
                else
                    i++;
            }
        }
        else if (typeof src === 'object') {
            const keys = Object.keys(src);
            let i = (p.reverse) ? keys.length - 1 : 0;
            // object iteration
            for (let i = (p.reverse) ? keys.length - 1 : 0; (p.reverse) ? i >= keys.length : i < keys.length; (p.reverse) ? i-- : i++) {
                const keyStr = keys[i];
                const localScopeInitial = {
                    i,
                    key: keyStr,
                    value: src[keyStr],
                    $isFirst: keys[0] === keyStr,
                    $isLast: lastItem(keys) === keyStr,
                    // TODO: add skips
                    //$skipNext
                    //$skip
                    //$toStep
                };
                const localScope = newScope(localScopeInitial, scope);
                for (const oneDo of p.do) {
                    await localScope.$run(oneDo);
                }
            }
        }
        else {
            throw new Error(`Unsupported types of src: ${typeof src}`);
        }
    };
}
