import {SCOPE_FUNCTIONS, SuperScope} from '../scope.js';


/**
 * Register new var in the top of scope only if it doesn't exist.
 * If you don't have to check it then better to use setJsValue
 * params:
 *   $exp: newVar
 *   name: someName
 *   value: 5
 */
export function newVar(scope: SuperScope) {
  return async (p: {name: string, value: any}) => {
    const name: string = await scope.$resolve(p.name)
    const value: any = await scope.$resolve(p.value)

    if (!name) throw new Error(`You need to set name`)
    else if (typeof name !== 'string') throw new Error(`Name has to be a string`)
    else if (SCOPE_FUNCTIONS.includes(name)) {
      throw new Error(`Can't create reserved function ${name}`)
    }

    if (Object.keys(scope).indexOf(p.name) >= 0) {
      throw new Error(`Can't reinitialize existent var ${p.name}`)
    }

    scope[name] = value
  }
}

/**
 * Delete var from top level of scope
 * params:
 *   $exp: deleteVar
 *   name: nameOfVarToDelete
 */
export function deleteVar(scope: SuperScope) {
  return async (p: {name: string}) => {
    const name: string = await scope.$resolve(p.name)

    if (!name) throw new Error(`You need to set name`)
    else if (typeof name !== 'string') throw new Error(`Name has to be a string`)
    else if (SCOPE_FUNCTIONS.includes(name)) {
      throw new Error(`Can't delete reserved function ${name}`)
    }

    delete scope[name]
  }
}
