import { newScope } from './scope.js';
import { SuperBase } from './SuperBase.js';
import { SuperStruct } from './SuperStruct.js';
import { EXP_MARKER } from '../constants.js';
import { SUPER_VALUE_PROP } from './superValueHelpers.js';
export const SUPER_RETURN = 'superReturn';
export function proxifySuperFunc(obj) {
    const funcProxyHandler = {
        apply(target, thisArg, argArray) {
            return obj.exec(...argArray);
        },
        get(target, prop) {
            // $super
            if (prop === SUPER_VALUE_PROP)
                return obj;
            return obj[prop];
        },
        has(target, prop) {
            if (prop === SUPER_VALUE_PROP)
                return true;
            return Boolean(obj[prop]);
        }
    };
    function fakeFunction() { }
    return new Proxy(fakeFunction, funcProxyHandler);
}
export class SuperFunc extends SuperBase {
    isSuperFunc = true;
    lines;
    appliedValues = {};
    proxyFn = proxifySuperFunc;
    paramsSetter;
    scope;
    get params() {
        return this.scope['params'];
    }
    constructor(scope, params, lines, redefine) {
        super();
        this.scope = newScope(undefined, scope);
        const paramsStruct = (new SuperStruct(params, true)).getProxy();
        this.paramsSetter = paramsStruct.$super.init();
        // TODO: в scope уже есть params в abstract UI
        //  лучше перименовать в params
        // set prop to scope
        this.scope.$super.define('params', { type: 'SuperStruct', readonly: true }, paramsStruct);
        this.lines = lines;
    }
    /**
     * Apply values of function's params to exec function later.
     * It replaces previously applied values
     */
    applyValues = (values) => {
        this.validateParams(values);
        this.appliedValues = values;
    };
    exec = async (values) => {
        this.validateParams(values);
        const finalValues = {
            ...this.appliedValues,
            ...values,
        };
        for (const key of Object.keys(finalValues)) {
            this.paramsSetter(key, finalValues[key]);
        }
        for (const line of this.lines) {
            if (line[EXP_MARKER] === SUPER_RETURN) {
                return this.scope.$run(line);
            }
            await this.scope.$run(line);
        }
    };
    validateParams(values) {
        if (!values)
            return;
        for (const key of Object.keys(values)) {
            this.params.$super.validateItem(key, values[key], true);
        }
    }
}
// /**
//  * Apply values of function's props to exec function later.
//  * It merges new values with previously applied values
//  */
// mergeValues(values: Record<string, any>) {
//   this.validateProps(values)
//
//   // TODO: а если будет передано super value ???
//   //       тогда получается возмется только значение а не сам инстанс
//
//   this.appliedValues = mergeDeepObjects(values, this.appliedValues)
// }
// /**
//  * Make clone of function include applied props
//  * but with the same scope
//  */
// clone(newScope?: SuperScope, values?: Record<string, any>) {
//   const newSuperFunc = new SuperFunc(
//     newScope || this.scope,
//     this.props,
//     this.lines
//   )
//
//   if (values) newSuperFunc.applyValues(values)
//
//   return proxifySuperFunc(newSuperFunc)
// }
