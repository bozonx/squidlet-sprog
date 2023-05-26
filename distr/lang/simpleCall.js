/**
 * Call js function
 * example yaml template:
 *   $ext: simpleCall
 *   path: myFunc
 *   args:
 *     - 1
 *     - 'some value'
 */
export const simpleCall = (scope) => {
    return async (p) => {
        const path = await scope.$resolve(p.path);
        const args = await scope.$resolve(p.args);
        const func = await scope.$getScopedFn('getValue')({ path });
        if (typeof func !== 'function') {
            throw new Error(`It isn't a function`);
        }
        return func(args);
    };
};
