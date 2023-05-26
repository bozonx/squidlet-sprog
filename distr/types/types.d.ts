import { sprogFuncs } from '../sprogFuncs.js';
export interface SprogDefinitionBase {
    $exp: keyof typeof sprogFuncs;
}
export interface SprogDefinition extends SprogDefinitionBase {
    [index: string]: any;
}
