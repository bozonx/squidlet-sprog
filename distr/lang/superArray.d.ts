import { SuperScope } from '../scope.js';
import { ProxyfiedArray } from '../lib/SuperArray.js';
import { SuperItemDefinition } from '../types/SuperItemDefinition.js';
export declare function newSuperArray(scope: SuperScope): (p: {
    item?: SuperItemDefinition;
    default?: any[];
}) => Promise<ProxyfiedArray>;
