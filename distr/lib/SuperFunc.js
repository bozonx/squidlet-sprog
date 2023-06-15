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
    propsSetter;
    scope;
    get props() {
        return this.scope['props'];
    }
    constructor(scope, props, lines) {
        super();
        this.scope = newScope(undefined, scope);
        const propsStruct = (new SuperStruct(props, true)).getProxy();
        this.propsSetter = propsStruct.$super.init();
        // set prop to scope
        scope.$super.define('props', { type: 'SuperStruct', readonly: true }, propsStruct);
        this.lines = lines;
    }
    /**
     * Apply values of function's props to exec function later.
     * It replaces previously applied values
     */
    applyValues = (values) => {
        this.validateProps(values);
        this.appliedValues = values;
    };
    exec = async (values) => {
        this.validateProps(values);
        const finalValues = {
            ...this.appliedValues,
            ...values,
        };
        for (const key of Object.keys(finalValues)) {
            this.propsSetter(key, finalValues[key]);
        }
        for (const line of this.lines) {
            if (line[EXP_MARKER] === SUPER_RETURN) {
                return this.scope.$run(line);
            }
            await this.scope.$run(line);
        }
    };
    validateProps(values) {
        if (!values)
            return;
        for (const key of Object.keys(values)) {
            this.props.$super.validateItem(key, values[key], true);
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
