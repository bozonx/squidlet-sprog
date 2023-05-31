import {All_TYPES} from './valueTypes.js';


interface SuperItemDefinitionBase {
  type: keyof typeof All_TYPES
  default?: any
}

interface SuperItemDefinitionExtra {
  required: boolean
  readonly: boolean
  nullable: boolean
}

export type SuperItemInitDefinition = SuperItemDefinitionBase & Partial<SuperItemDefinitionExtra>
export type SuperItemDefinition = SuperItemDefinitionBase & SuperItemDefinitionExtra


export const DEFAULT_INIT_SUPER_DEFINITION: SuperItemDefinition = {
  type: 'any',
  required: false,
  readonly: false,
  nullable: false,
}
