import {SCOPE_FUNCTIONS, SuperScope} from '../lib/scope.js';
import {SuperItemDefinition} from '../types/SuperItemDefinition.js';


/**
 * Register new var in the top of scope only if it doesn't exist.
 * If you don't have to check it then better to use setJsValue
 * params:
 *   $exp: newVar
 *   name: someName
 *   # use it without definition,
 *   # if definition is set then this value will be default value of definition
 *   value: 5
 *   definition: { ... definition of super item, see in SuperData }
 */
export function newVar(scope: SuperScope) {
  return async (p: {name: string, value: any, definition: SuperItemDefinition}) => {
    const name: string = await scope.$resolve(p.name)
    const value: any = await scope.$resolve(p.value)
    const definition: SuperItemDefinition = await scope.$resolve(p.definition)
    // if value nad definition are set then put value as default value
    //if (typeof value !== 'undefined' && definition) definition.default = value

    if (!name) throw new Error(`You need to set name`)
    else if (typeof name !== 'string') throw new Error(`Name has to be a string`)
    else if (SCOPE_FUNCTIONS.includes(name)) {
      throw new Error(`Can't create reserved function ${name}`)
    }
    // TODO: проверить $super и методы SuperData
    // TODO: правильно ли проверится наличие defintion в define ?

    scope.$super.define(name, definition, value)
  }
}

// /**
//  * Delete var from top level of scope
//  * params:
//  *   $exp: deleteVar
//  *   name: nameOfVarToDelete
//  */
// export function deleteVar(scope: SuperScope) {
//   return async (p: {name: string}) => {
//     const name: string = await scope.$resolve(p.name)
//
//     if (!name) throw new Error(`You need to set name`)
//     else if (typeof name !== 'string') throw new Error(`Name has to be a string`)
//     else if (SCOPE_FUNCTIONS.includes(name)) {
//       throw new Error(`Can't delete reserved function ${name}`)
//     }
//
//     scope.$super.forget(name)
//   }
// }
