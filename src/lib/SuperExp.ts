import {SuperScope} from './scope.js';


export const SUPER_EXP_TYPE = {
  isEqual: 'isEqual',
  getValue: 'getValue',
  hasValue: 'hasValue',
  math: 'math',
  // TODO: logic methods
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

}
