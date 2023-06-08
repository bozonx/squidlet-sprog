export declare abstract class SuperBase {
    readonly isSuper: boolean;
    protected proxyfiedInstance?: any;
    protected myParent?: SuperBase;
    protected myPath?: string;
    protected inited: boolean;
    protected abstract proxyFn: (instance: any) => any;
    get isInitialized(): boolean;
    get parent(): SuperBase | undefined;
    get pathToMe(): string | undefined;
    init(): any;
    $$setParent(parent: SuperBase, myPath: string): void;
    /**
     * Return proxy of my self and make it if it is the first time
     */
    getProxy(): any | any[];
}
