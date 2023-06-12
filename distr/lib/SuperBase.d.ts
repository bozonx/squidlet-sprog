export interface SuperBasePublic {
    isSuper: boolean;
}
export type ProxyfiedSuperBase<T = any> = SuperBasePublic & {
    $super: SuperBase;
} & T;
export declare const SUPER_BASE_PROXY_PUBLIC_MEMBERS: string[];
export declare abstract class SuperBase {
    readonly isSuper: boolean;
    protected proxyfiedInstance?: any;
    protected myParent?: ProxyfiedSuperBase;
    protected myPath?: string;
    protected inited: boolean;
    protected abstract proxyFn: (instance: any) => any;
    get isInitialized(): boolean;
    get parent(): ProxyfiedSuperBase | undefined;
    get pathToMe(): string | undefined;
    get myKeyOfParent(): string | number | undefined;
    init(): any;
    $$setParent(parent: ProxyfiedSuperBase, myPath: string): void;
    /**
     * Return proxy of my self and make it if it is the first time
     */
    getProxy(): any | any[];
}
