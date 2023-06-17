import { isEqual } from '../lang/booleanLogic.js';
export const SUPER_EXP_TYPE = {
    isEqual: 'isEqual',
    getValue: 'getValue',
    hasValue: 'hasValue',
    math: 'math',
    // TODO: logic methods
    // TODO: здес должны быть разные выражения без определения ф-и,
    //       определения переменных и super props
};
export async function execSuperExp(scope, type, args) {
    if (type === SUPER_EXP_TYPE.isEqual) {
        return isEqual(scope)({ items: args || [] });
    }
    // else if (type === SUPER_EXP_TYPE.getValue) {
    //   return getValue(scope)()
    // }
    // TODO: add other methods
}
