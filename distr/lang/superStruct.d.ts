import { SuperScope } from '../scope.js';
import { SuperStructPublic } from '../lib/SuperStruct.js';
import { SuperItemDefinition } from '../types/SuperItemDefinition.js';
export declare function newSuperStruct<T = any>(scope: SuperScope): (p: {
    definition: SuperItemDefinition;
    defaultRo?: boolean;
}) => Promise<T & SuperStructPublic>;
