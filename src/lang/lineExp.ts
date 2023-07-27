import {SuperScope} from '../lib/scope.js';
import {executeLineExpr} from '../lib/lineExpressions.js';


export function lineExp(scope: SuperScope) {
  return async (p: {items: any[]}): Promise<any> => {
    // execute value if need right now
    return executeLineExpr(p.items, scope)
  }
}

