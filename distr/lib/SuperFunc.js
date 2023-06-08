import { newScope } from './scope.js';
import { makeFuncProxy } from './functionProxy.js';
import { SuperBase } from './SuperBase.js';
import { SuperStruct } from './SuperStruct.js';
import { EXP_MARKER } from '../constants.js';
export const SUPER_RETURN = 'superReturn';
// TODO: можно по каждому prop добавить combined в scope как алиас
// TODO: если в prop есть супер значение то им должно быть проставлено readonly
// TODO: может добавить событие вызова ф-и или лучше middleware???
export class SuperFunc extends SuperBase {
    lines;
    appliedValues = {};
    proxyFn = makeFuncProxy;
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
        // TODO: отловить return в if, switch, цикл через scope
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
//   return makeFuncProxy(newSuperFunc)
// }
