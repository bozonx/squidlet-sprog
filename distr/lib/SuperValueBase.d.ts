import { IndexedEventEmitter } from 'squidlet-lib';
import { AllTypes } from '../types/valueTypes.js';
import { SuperItemDefinition, SuperItemInitDefinition } from '../types/SuperItemDefinition.js';
import { SuperBase } from './SuperBase.js';
export interface SuperValuePublic {
    isSuperValue: boolean;
    getValue(pathTo: string): AllTypes | undefined;
    setValue(pathTo: string, newValue: AllTypes): void;
    setNull(pathTo: string): void;
    toDefaultValue(key: string | number): void;
}
export interface SuperLinkItem {
    externalSuperValue: SuperValueBase;
    externalKey: string | number;
    myKey: string | number;
    externalHandlerIndex: number;
    myHandlerIndex: number;
}
export declare const SUPER_PROXY_PUBLIC_MEMBERS: string[];
export declare enum SUPER_VALUE_EVENTS {
    initStart = 0,
    inited = 1,
    destroy = 2,
    change = 3,
    definition = 4,
    newLink = 5,
    unlink = 6,
    changeParent = 7
}
export type SuperChangeHandler = (target: SuperValueBase, path?: string) => void;
export declare const SUPER_VALUE_PROP = "$super";
export declare function isSuperValue(val: any): boolean;
export declare function prepareDefinitionItem(definition: SuperItemInitDefinition, defaultRo?: boolean): SuperItemDefinition;
export declare function checkDefinition(definition: SuperItemInitDefinition): void;
export declare function validateChildValue(definition: SuperItemDefinition, childKeyOrIndex: string | number, value?: any): void;
export declare abstract class SuperValueBase<T = any | any[]> extends SuperBase implements SuperValuePublic {
    readonly isSuperValue = true;
    readonly abstract values: T;
    events: IndexedEventEmitter<import("squidlet-lib").DefaultHandler>;
    protected links: SuperLinkItem[];
    get isDestroyed(): boolean;
    /**
     * Get own keys or indexes
     */
    abstract ownKeys: (string | number)[];
    init(): any;
    destroy(): void;
    /**
     * It is called only when parent set this item as its child
     * @parent - parent super struct, super array or super data
     * @myPath - full path to me in tree where im am
     */
    $$setParent(parent: SuperValueBase, myPath: string): void;
    abstract isKeyReadonly(key: string | number): boolean;
    /**
     * Get only own value not from bottom layer and not deep
     * @param key
     */
    abstract getOwnValue(key: string | number): AllTypes;
    /**
     * Set value to own child, not deeper and not to bottom layer.
     * And rise an event of it child
     * @param key
     * @param value
     * @param ignoreRo
     * @returns {boolean} if true then value was found and set. If false value hasn't been set
     */
    abstract setOwnValue(key: string | number, value: AllTypes, ignoreRo?: boolean): boolean;
    abstract toDefaultValue(key: string | number): void;
    abstract getDefinition(key: string | number): SuperItemDefinition | undefined;
    subscribe: (handler: SuperChangeHandler) => number;
    unsubscribe: (handlerIndex: number) => void;
    /**
     * It checks does the last parent or myself has key
     * @param pathTo
     */
    hasKey: (pathTo: string) => boolean;
    /**
     * You cat deeply get some primitive or other struct or super array.
     * If it is a primitive you can't change its value.
     * To change its value get its parent and set value via parent like: parent.value = 5
     */
    getValue: (pathTo: string, defaultValue?: any) => AllTypes | undefined;
    /**
     * Set value deeply.
     * You can set own value or value of some deep object.
     * Even you can set value to the deepest primitive like: struct.struct.num = 5
     * @returns {boolean} if true then value was found and set. If false value hasn't been set
     */
    setValue: (pathTo: string, newValue: AllTypes) => boolean;
    /**
     * The same as setValue but it sets null
     */
    setNull: (pathTo: string) => void;
    /**
     * Set all the values to default ones
     */
    toDefaults(): void;
    /**
     * Link key of some struct or array to key of this.
     * Both values of these keys will change at the same time and rise change events both
     */
    link: (externalSuperValue: SuperValueBase, externalKey: string | number, myKey: string | number) => number;
    unlink(linkId: number): void;
    /**
     * It makes full deep clone.
     * You can change the clone but changes will not affect the struct.
     */
    clone: () => T;
    makeChildPath(childKeyOrIndex: string | number): string;
    /**
     * This method will be returned after initializing to update readonly values
     * @protected
     */
    protected abstract myRoSetter: Function;
    protected emitChildChangeEvent(childKeyOrIndex: string | number): void;
    /**
     * Rise an event of whole my instance
     * @protected
     */
    protected emitMyEvent(): void;
    /**
     * Resolve onw child value according the definition and init it.
     * If the child is simple type then it checks its type and returns
     * default or initial value for type.
     * If the child is Super type then it init it if need
     */
    protected resolveChildValue(definition: SuperItemDefinition, childKeyOrIndex: string | number, value?: any): any;
    private resolveSuperChild;
    /**
     * listen to children to bubble their events
     * @protected
     */
    private startListenChildren;
}
