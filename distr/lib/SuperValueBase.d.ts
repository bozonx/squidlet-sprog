import { IndexedEventEmitter } from 'squidlet-lib';
import { AllTypes, ProxifiedSuperValue, SimpleType } from '../types/valueTypes.js';
import { SuperItemDefinition } from '../types/SuperItemDefinition.js';
import { ProxyfiedSuperBase, SuperBase, SuperBasePublic } from './SuperBase.js';
export interface SuperValuePublic extends SuperBasePublic {
    isSuperValue: boolean;
    getValue(pathTo: string): AllTypes | undefined;
    setValue(pathTo: string, newValue: AllTypes): void;
    setNull(pathTo: string): void;
    subscribe(handler: SuperChangeHandler): number;
}
export interface SuperLinkItem {
    externalSuperValue: SuperValueBase;
    externalKey: string | number;
    myKey: string | number;
    externalHandlerIndex: number;
    myHandlerIndex: number;
}
export declare const SUPER_VALUE_PROXY_PUBLIC_MEMBERS: string[];
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
export type SuperChangeHandler = (target: ProxifiedSuperValue, path?: string) => void;
export declare abstract class SuperValueBase<T = any | any[]> extends SuperBase implements SuperValuePublic {
    readonly isSuperValue = true;
    readonly abstract values: T;
    readonly events: IndexedEventEmitter<import("squidlet-lib").DefaultHandler>;
    protected links: SuperLinkItem[];
    private childEventHandlers;
    get isDestroyed(): boolean;
    /**
     * Get all the keys or indexes
     */
    abstract allKeys: (string | number)[];
    init(): any;
    destroy(): void;
    /**
     * It is called only when parent set this item as its child
     * @parent - parent super struct, super array or super data
     * @myPath - full path to me in tree where im am
     */
    $$setParent(parent: ProxyfiedSuperBase, myPath: string): void;
    $$detachChild(childKey: string | number, force?: boolean): void;
    /**
     * Get only own value not from bottom layer and not deep
     * @param key
     */
    abstract getDefinition(key: string | number): SuperItemDefinition | undefined;
    subscribe: (handler: SuperChangeHandler) => number;
    unsubscribe: (handlerIndex: number) => void;
    isKeyReadonly(key: string | number): boolean;
    /**
     * It checks does the last parent or myself has key
     * @param pathTo
     */
    hasKey: (pathTo: string) => boolean;
    getOwnValue(key: number | string): AllTypes;
    /**
     * Set value to own child, not deeper and not to bottom layer.
     * And rise an event of it child
     * @param key
     * @param value
     * @param ignoreRo
     * @returns {boolean} if true then value was found and set. If false value hasn't been set
     */
    setOwnValue(key: string | number, value: AllTypes, ignoreRo?: boolean): boolean;
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
     * Set default value or null if the key doesn't have a default value
     * @param key
     */
    toDefaultValue(key: string | number): void;
    batchSet(values?: T): void;
    /**
     * Link key of some struct or array to key of this.
     * Both values of these keys will change at the same time and rise change events both
     */
    link: (externalSuperValue: SuperValueBase, externalKey: string | number, myKey: string | number) => number;
    unlink(linkId: number): void;
    unlinkByChildKey(childKeyOrIndex: string | number): void;
    /**
     * It makes full deep clone.
     * You can change the clone but changes will not affect the struct.
     */
    clone: () => T;
    makeChildPath(childKeyOrIndex: string | number): string;
    validateItem(key: string | number, value?: AllTypes, ignoreRo?: boolean): void;
    /**
     * Remove all the listeners of child
     * @param childKeyOrIndex - it can be a stringified number like '0'
     * @private
     */
    removeChildListeners(childKeyOrIndex: string | number): void;
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
     * Set to deep child.
     * * if parent of this child is Super value then call setValue which emits an event
     * * if parent of child is simple array or object - just set value and emit an event
     * @param pathTo - has to be a deep value
     * @param newValue
     * @protected
     */
    protected setDeepChild(pathTo: string, newValue: AllTypes): boolean;
    /**
     * Resolve onw child value according the definition and init it.
     * It is called in init(), setOwnValue() and define()
     * @param definition
     * @param childKeyOrIndex
     * @param value - if value not set then it will try to get default value
     *   or make an initial value according to definition.type
     */
    protected resolveChildValue(definition: SuperItemDefinition, childKeyOrIndex: string | number, value?: any): SimpleType | ProxifiedSuperValue | undefined;
    /**
     * It resolves a super value:
     * * if initialValue set then it returns it
     * * if no initialValue then make a new instance an init it with default value
     * * if no initialValue and default value then just init a new instance
     * @param definition
     * @param childKeyOrIndex
     * @param initialValue
     * @private
     */
    private resolveSuperChild;
    /**
     * it:
     * * replace parent
     * * start listen to children to bubble their events
     * * listen to child destroy
     * @protected
     */
    private setupSuperChild;
    private listenChildEvents;
    private handleSuperChildDestroy;
}
