import {SuperScope} from '../lib/scope.js';


export const LINE_EXPR_SIGNS = {
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
  '%': '%',
  '&&': '&&',
  '||': '||',
  '===': '===',
  // TODO: add bit operators
  // TODO: !
}


export function lineExp(scope: SuperScope) {
  return async (p: {items: any[]}): Promise<any> => {
    // execute value if need wright now
    return executeLineExpr(p.items, scope)
  }
}


export async function executeLineExpr(items: any[], scope: SuperScope): Promise<any> {
  // was previous item is value or sign
  let prevItemWasValue: boolean | undefined

  for (let i = 0; i < items.length; i++) {

  }

}
