import {SuperScope} from './scope.js';
import {isEqual} from '../lang/booleanLogic.js';
import {getValue} from '../lang/deepValue.js';


export const SUPER_EXP_TYPE = {
  isEqual: 'isEqual',
  getValue: 'getValue',
  hasValue: 'hasValue',
  math: 'math',
  // TODO: logic methods
  // TODO: здес должны быть разные выражения без определения ф-и,
  //       определения переменных и super props
}

export type SuperExpType = keyof typeof SUPER_EXP_TYPE

export interface SuperExpParams {
  type: SuperExpType,
  // arguments of expression function
  args?: any[],
}


export async function execSuperExp(
  scope: SuperScope,
  type: SuperExpType,
  args?: any[]
): Promise<any | undefined> {
  if (type === SUPER_EXP_TYPE.isEqual) {
    return isEqual(scope)({items: args || []})
  }
  // else if (type === SUPER_EXP_TYPE.getValue) {
  //   return getValue(scope)()
  // }

  // TODO: add other methods
}
