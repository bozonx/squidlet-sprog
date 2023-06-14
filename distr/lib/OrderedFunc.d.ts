import { SprogDefinition } from '../types/types.js';
import { SuperItemInitDefinition } from '../types/SuperItemDefinition.js';
export interface OrderedFuncArgument extends SuperItemInitDefinition {
    name: string;
}
export interface OrderedFuncDefinition {
    args: (string | OrderedFuncArgument)[];
    lines: SprogDefinition[];
}
export declare const DEFAULT_ORDERED_FUNC_ARGUMENT: {
    type: string;
    required: boolean;
    readonly: boolean;
    nullable: boolean;
};
