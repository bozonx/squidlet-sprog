import { splitDeepPath, lastItem } from 'squidlet-lib';
export const SUPER_BASE_PROXY_PUBLIC_MEMBERS = [
    'isSuper',
];
export class SuperBase {
    isSuper = true;
    proxyfiedInstance;
    // parent super struct or array who owns me
    myParent;
    // Path to myself in upper tree. The last part is my name
    myPath;
    inited = false;
    get isInitialized() {
        return this.inited;
    }
    get parent() {
        return this.myParent;
    }
    get pathToMe() {
        return this.myPath;
    }
    get myKeyOfParent() {
        if (typeof this.pathToMe === 'undefined')
            return;
        const pathSplat = splitDeepPath(this.pathToMe);
        return lastItem(pathSplat);
    }
    init() {
        // means that item is completely initiated
        this.inited = true;
    }
    $$setParent(parent, myPath) {
        this.myParent = parent;
        this.myPath = myPath;
    }
    /**
     * Return proxy of my self and make it if it is the first time
     */
    getProxy() {
        if (!this.proxyfiedInstance) {
            this.proxyfiedInstance = this.proxyFn(this);
        }
        return this.proxyfiedInstance;
    }
}
