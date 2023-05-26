import {sprogFuncs} from '../sprogFuncs.js';

export interface SprogDefinitionBase {
  $exp: keyof typeof sprogFuncs,
}

export interface SprogDefinition extends SprogDefinitionBase {
  // TODO: better to extend interfaces
  [index: string]: any
}
