import { sprogFuncs } from './sprogFuncs.js';
import { SprogDefinition } from './types/types.js';
export type SprogScopedFn = (p: any) => Promise<any | void>;
export type SprogFn = (scope: SuperScope) => SprogScopedFn;
export interface SuperScope {
    /**
     * Clone only self scope props excluding run() and $cloneSelf()
     */
    $cloneSelf(): any;
    /**
     * Get scoped function to run it later
     */
    $getScopedFn(fnName: keyof typeof sprogFuncs): SprogScopedFn;
    /**
     * Run sprog function in this scope
     * It accepts sprog definition
     */
    $run(definition: SprogDefinition): Promise<any | void>;
    /**
     * If is is an expression then run it.
     * If not then return a value
     * @param defOrValue
     */
    $resolve(defOrValue: any): Promise<any>;
    [index: string]: any;
}
export declare const SCOPE_FUNCTIONS: string[];
export declare function newScope<T = any>(initialScope?: T, previousScope?: SuperScope): T & SuperScope;
