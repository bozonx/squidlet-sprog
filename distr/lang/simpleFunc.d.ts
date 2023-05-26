import { SuperScope } from '../scope.js';
/**
 * Define simple func in the top of scope
 * params:
 *   $exp: simpleFunc
 *   name: nameOfFunction
 *   argsNames: ['arg1', ...]
 *   lines: [{$exp: getValue, path: somePath}]
 */
export declare function setSimpleFunc(scope: SuperScope): (p: {
    name: string;
    argsNames?: string[];
}) => Promise<void>;
/**
 * Create simple func and return it
 * params:
 *   $exp: simpleFunc
 *   argsNames: ['arg1', ...]
 *   lines: [{$exp: getValue, path: somePath}]
 */
export declare function makeSimpleFunc(scope: SuperScope): (p: {
    argsNames?: string[];
}) => Promise<void>;
