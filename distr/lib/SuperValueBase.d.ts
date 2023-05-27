import { IndexedEvents } from 'squidlet-lib';
import { SuperScope } from '../scope.js';
import { AllTypes } from '../types/valueTypes.js';
import { SuperItemDefinition } from '../types/SuperItemDefinition.js';
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
export type SuperChangeHandler = (target: SuperValueBase, path?: string) => void;
export declare const SUPER_VALUE_PROP = "$super";
export declare function isSuperValue(val: any): boolean;
export declare abstract class SuperValueBase<T = any | any[]> implements SuperValuePublic {
    readonly isSuperValue = true;
    readonly abstract values: T;
    changeEvent: IndexedEvents<SuperChangeHandler>;
    protected proxyfiedInstance?: any;
    protected myParent?: SuperValueBase;
    protected myPath?: string;
    protected inited: boolean;
    protected links: SuperLinkItem[];
    protected abstract proxyFn: (instance: any) => any;
    private myScope;
    get scope(): SuperScope;
    get isInitialized(): boolean;
    get parent(): SuperValueBase | undefined;
    get pathToMe(): string | undefined;
    protected constructor(scope: SuperScope);
    init(): any;
    destroy(): void;
    /**
     * It is called only when parent set this item as its child
     * @parent - parent super struct or super array
     * @myPath - full path to me in tree where im is
     */
    $$setParent(parent: SuperValueBase, myPath: string): void;
    /**
     * Do it only if you are totally sure what you do.
     * @param scope
     */
    $$replaceScope(scope: SuperScope): void;
    abstract isKeyReadonly(key: string | number): boolean;
    /**
     * Get own keys or indexes
     */
    abstract myKeys(): string[] | number[];
    abstract getOwnValue(key: string | number): AllTypes;
    /**
     * Set value to own child, not deeper.
     * And rise an event of it child
     * @param key
     * @param value
     * @param ignoreRo
     */
    abstract setOwnValue(key: string | number, value: AllTypes, ignoreRo?: boolean): void;
    abstract toDefaultValue(key: string | number): void;
    /**
     * Make proxy of my self.
     * Please run it only once just after creating of instance.
     */
    getProxy(): any | any[];
    subscribe(handler: SuperChangeHandler): number;
    unsubscribe(handlerIndex: number): void;
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
    getValue: (pathTo: string) => AllTypes | undefined;
    /**
     * Set value deeply.
     * You can set own value or value of some deep object.
     * Even you can set value to the deepest primitive like: struct.struct.num = 5
     */
    setValue: (pathTo: string, newValue: AllTypes) => void;
    /**
     * The same as setValue but it sets null
     */
    setNull: (pathTo: string) => void;
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
    detachedCopy(): void;
    makeChildPath(childKeyOrIndex: string | number): string;
    /**
     * This method will be returned after initializing to update readonly values
     * @protected
     */
    protected abstract myRoSetter: Function;
    protected riseChildrenChangeEvent(childKeyOrIndex: string | number): void;
    /**
     * Rise an event of whole my instance
     * @protected
     */
    protected riseMyEvent(): void;
    protected initChild(definition: SuperItemDefinition, childKeyOrIndex: string | number, initialValue?: any): any;
    /**
     * listen to children to bubble their events
     * @protected
     */
    protected startListenChildren(): void;
}
