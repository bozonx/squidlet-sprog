import { omitObj } from 'squidlet-lib';
import { sprogFuncs } from '../sprogFuncs.js';
import { EXP_MARKER } from '../constants.js';
import { SuperData } from './SuperData.js';
import { stdLib } from '../stdLib.js';
import { SUPER_VALUE_PROP } from './superValueHelpers.js';
export const SCOPE_FUNCTIONS = ['$cloneSelf', '$getScopedFn', '$run', '$resolve'];
const scopeFunctions = {
    $cloneSelf() {
        return this.$super.clone();
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
        if (defOrValue && typeof defOrValue === 'object' && defOrValue[EXP_MARKER]) {
            return this.$run(defOrValue);
        }
        // simple value
        return defOrValue;
    }
};
export function proxyScope(data) {
    const handler = {
        get(target, prop) {
            if (prop === SUPER_VALUE_PROP) {
                // $super = SuperData instance
                return data;
            }
            else if (SCOPE_FUNCTIONS.includes(prop)) {
                // scope function
                return scopeFunctions[prop].bind(proxyfied);
            }
            // else var of scope
            return data.values[prop];
        },
        has(target, prop) {
            if (prop === SUPER_VALUE_PROP || SCOPE_FUNCTIONS.includes(prop)) {
                return true;
            }
            return data.allKeys.includes(prop);
        },
        set(target, prop, newValue) {
            data.setValue(prop, newValue);
            return true;
        },
        deleteProperty(target, prop) {
            throw new Error(`It is forbidden to delete variables from scope`);
            //data.forget(prop)
            //return true
        },
        ownKeys() {
            return data.allKeys;
        },
    };
    const proxyfied = new Proxy(data.values, handler);
    return proxyfied;
}
/**
 * It creates a new scope with specified initial variables.
 * Or define these vars into previousScope and use it scope
 * @param initialVars
 * @param previousScope
 */
export function newScope(initialVars = {}, previousScope) {
    // TODO: test что нельзя удалять переменные из scope
    const data = new SuperData({
        std: {
            type: 'object',
            default: stdLib,
            readonly: true,
        }
    }, undefined, previousScope?.$super);
    const scope = proxyScope(data);
    data.init(initialVars);
    return scope;
}
// export function proxyScope(data: SuperData, previousScope?: SuperScope): SuperScope {
//   const handler: ProxyHandler<Record<any, any>> = {
//     get(target: any, prop: string) {
//
//       // TODO: Object.keys(data.values) поменять на data.ownKeys
//
//
//       if (prop === SUPER_VALUE_PROP) {
//         // $super = SuperData instance
//         return data
//       }
//       else if (SCOPE_FUNCTIONS.includes(prop)) {
//         // scope function
//         return scopeFunctions[prop].bind(proxyfied)
//       }
//       else if (Object.keys(data.values).includes(prop)) {
//         // var of current scope
//         return data.values[prop]
//       }
//       else if (previousScope) {
//         console.log(2222, prop)
//
//         // var of lower scope
//         return previousScope[prop]
//       }
//
//       return data.values[prop]
//     },
//
//     has(target: any, prop: string): boolean {
//       if (prop === SUPER_VALUE_PROP || SCOPE_FUNCTIONS.includes(prop)) {
//         return true
//       }
//
//       //return Object.keys(data.values).includes(prop)
//
//       if (Object.keys(data.values).includes(prop)) return true
//       else if (previousScope && previousScope.$super.values.includes(prop)) return true
//
//       return false
//     },
//
//     set(target: any, prop: string, newValue: any): boolean {
//       //data.setOwnValue(prop, newValue)
//
//       if (Object.keys(data.values).includes(prop)) {
//         data.setOwnValue(prop, newValue)
//       }
//       else if (previousScope) {
//         previousScope.$super.setOwnValue(prop, newValue)
//       }
//
//       return true
//     },
//
//     deleteProperty(target: any, prop: string): boolean {
//       data.forget(prop)
//
//       if (previousScope) previousScope.$super.forget(prop)
//
//       return true
//     },
//
//     ownKeys(): ArrayLike<string | symbol> {
//       return [
//         ...Object.keys(previousScope?.$super.values || []),
//         ...Object.keys(data.values),
//       ]
//     },
//   }
//
//   const proxyfied = new Proxy(data.values, handler) as SuperScope
//
//   return proxyfied
// }
