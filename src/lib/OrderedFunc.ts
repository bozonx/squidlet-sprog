import {SprogDefinition} from '../types/types.js';
import {SuperItemInitDefinition} from '../types/SuperItemDefinition.js';


export interface OrderedFuncArgument extends SuperItemInitDefinition {
  name: string
}

export interface OrderedFuncDefinition {
  args: (string | OrderedFuncArgument)[]
  lines: SprogDefinition[]
}

export const DEFAULT_ORDERED_FUNC_ARGUMENT = {
  type: 'any',
  required: true,
  readonly: true,
  nullable: false,
}
