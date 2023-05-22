import {omitObj, mergeDeepObjects, cloneDeepObject} from 'squidlet-lib';
import {sprogFuncs} from './allFuncs.js';
import {EXP_MARKER} from './constants.js';


// TODO: всегда ли должно ли быть async???
export type SprogScopedFn = (p: any) => Promise<any | void>
export type SprogFn = (scope: SuperScope) => SprogScopedFn

export interface SuperScope {
  /**
   * Clone only self scope props excluding run() and $cloneSelf()
   */
  $cloneSelf(): any

  /**
   * Get scoped function to run it later
   */
  $getScopedFn(fnName: keyof typeof sprogFuncs): SprogScopedFn

  /**
   * Run sprog function in this scope
   * It accepts sprog definition
   */
  $run(definition: SprogItemDefinition): Promise<any | void>

  /**
   * If is is an expression then run it.
   * If not then return a value
   * @param defOrValue
   */
  $resolve(defOrValue: any): Promise<any>

  // /**
  //  * Run sprog function in this scope
  //  */
  // run(funcName: string, params: Record<any, any>): Promise<any | void>

  [index: string]: any
}

export interface SprogItemDefinition {
  $exp: keyof typeof sprogFuncs,
  // TODO: better to extend interfaces
  [index: string]: any
}


export const SCOPE_FUNCTIONS = ['$resolve', '$run', '$cloneSelf', '$getScopedFn']


export function newScope<T = any>(initialScope: T = {} as T, previousScope?: SuperScope): T & SuperScope {
  const fullScope: T = mergeDeepObjects(
    initialScope as any,
    omitObj(previousScope, ...SCOPE_FUNCTIONS)
  )

  return {
    ...fullScope,
    $cloneSelf(): T {
      return cloneDeepObject(omitObj(fullScope as any, ...SCOPE_FUNCTIONS))
    },
    $getScopedFn(fnName: string): SprogScopedFn {
      const sprogFn = sprogFuncs[fnName as keyof typeof sprogFuncs]
      const thisScope = this as SuperScope

      if (!sprogFn) throw new Error(`Sprog doesn't have function ${fnName}`)

      return sprogFn(thisScope)
    },
    $run(definition: SprogItemDefinition): Promise<any | void> {
      const sprogFn = sprogFuncs[definition.$exp]
      const params: any = omitObj(definition, '$exp')
      const thisScope = this as SuperScope

      if (!sprogFn) throw new Error(`Sprog doesn't have function ${definition.$exp}`)

      return sprogFn(thisScope)(params)
    },
    async $resolve(defOrValue: any): Promise<any> {
      if (typeof defOrValue === 'object' && defOrValue[EXP_MARKER]) {
        return this.$run(defOrValue)
      }
      // simple value
      return defOrValue
    }
  }
}
