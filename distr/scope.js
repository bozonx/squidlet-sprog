import { omitObj, mergeDeepObjects, cloneDeepObject } from 'squidlet-lib';
import { sprogFuncs } from './sprogFuncs.js';
import { EXP_MARKER } from './constants.js';
export const SCOPE_FUNCTIONS = ['$resolve', '$run', '$cloneSelf', '$getScopedFn'];
export function newScope(initialScope = {}, previousScope) {
    const fullScope = mergeDeepObjects(initialScope, omitObj(previousScope, ...SCOPE_FUNCTIONS));
    return {
        ...fullScope,
        $cloneSelf() {
            return cloneDeepObject(omitObj(fullScope, ...SCOPE_FUNCTIONS));
        },
        $getScopedFn(fnName) {
            const sprogFn = sprogFuncs[fnName];
            const thisScope = this;
            if (!sprogFn)
                throw new Error(`Sprog doesn't have function ${fnName}`);
            return sprogFn(thisScope);
        },
        $run(definition) {
            const sprogFn = sprogFuncs[definition.$exp];
            const params = omitObj(definition, '$exp');
            const thisScope = this;
            if (!sprogFn)
                throw new Error(`Sprog doesn't have function ${definition.$exp}`);
            return sprogFn(thisScope)(params);
        },
        async $resolve(defOrValue) {
            if (typeof defOrValue === 'object' && defOrValue[EXP_MARKER]) {
                return this.$run(defOrValue);
            }
            // simple value
            return defOrValue;
        }
    };
}
