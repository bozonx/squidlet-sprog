import {All_TYPES} from './valueTypes.js';


interface SuperItemDefinitionBase {
  type: keyof typeof All_TYPES
  default?: any
}

interface SuperItemDefinitionExtra {
  required: boolean
  readonly: boolean
}

export type SuperItemInitDefinition = SuperItemDefinitionBase & Partial<SuperItemDefinitionExtra>
export type SuperItemDefinition = SuperItemDefinitionBase & SuperItemDefinitionExtra


export const DEFAULT_INIT_SUPER_DEFINITION: SuperItemInitDefinition = {
  type: 'any',
}
