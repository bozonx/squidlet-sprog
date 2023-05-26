import { mergeDeepObjects, collectObjValues } from 'squidlet-lib';
import { newScope } from '../scope.js';
import { makeFuncProxy } from './functionProxy.js';
export class SuperFunc {
    scope;
    props;
    lines;
    appliedValues = {};
    get propsDefaults() {
        return collectObjValues(this.props, 'default');
    }
    constructor(scope, { props, lines }) {
        this.scope = scope;
        this.props = props;
        this.lines = lines;
    }
    replaceScope(newScope) {
        this.scope = newScope;
    }
    /**
     * Apply values of function's props to exec function later.
     * It replaces previously applied values
     */
    applyValues(values) {
        this.validateProps(values);
        this.appliedValues = values;
    }
    /**
     * Apply values of function's props to exec function later.
     * It merges new values with previously applied values
     */
    mergeValues(values) {
        this.validateProps(values);
        this.appliedValues = mergeDeepObjects(values, this.appliedValues);
    }
    async exec(values) {
        this.validateProps(values);
        const finalValues = mergeDeepObjects(values, mergeDeepObjects(this.appliedValues, this.propsDefaults));
        const execScope = newScope(finalValues, this.scope);
        //console.log(111, values, finalValues, this.lines, this.props)
        for (const line of this.lines) {
            await execScope.$run(line);
        }
        // TODO: как сделать reuturn ??? Он может быть в if, switch или цикле
        //       наверное им в scope передать ф-ю return
        //       но ещё должно остановиться
    }
    /**
     * Make clone of function include applied props
     * but with the same scope
     */
    clone(newScope, values) {
        const newSuperFunc = new SuperFunc(newScope || this.scope, { props: this.props, lines: this.lines });
        if (values)
            newSuperFunc.applyValues(values);
        return makeFuncProxy(newSuperFunc);
    }
    validateProps(values) {
        // TODO: validate props
    }
}
