import { IndexedEvents, deepGet, deepHas, deepSet, deepClone, omitObj, splitDeepPath, joinDeepPath } from 'squidlet-lib';
import { isCorrespondingType } from './isCorrespondingType.js';
export const SUPER_PROXY_PUBLIC_MEMBERS = [
    'isSuperValue',
    'getValue',
    'setValue',
    'setNull',
    'toDefaultValue',
    'subscribe',
];
export const SUPER_VALUE_PROP = '$super';
export function isSuperValue(val) {
    return typeof val === 'object' && val.isSuperValue;
}
export class SuperValueBase {
    isSuperValue = true;
    changeEvent = new IndexedEvents();
    proxyfiedInstance;
    // parent super struct or array who owns me
    myParent;
    // Path to myself in upper tree. The last part is my name
    myPath;
    inited = false;
    links = [];
    myScope;
    get scope() {
        return this.myScope;
    }
    get isInitialized() {
        return this.inited;
    }
    get parent() {
        return this.myParent;
    }
    get pathToMe() {
        return this.myPath;
    }
    // TODO: может добавить noInit - чтобы не забыть потом проинициализировать
    // TODO: или на get и set проверять чтобы был проинициализирован
    constructor(scope) {
        this.myScope = scope;
    }
    init() {
        // means that array is completely initiated
        this.inited = true;
        // rise an event any way if any values was set or not
        this.changeEvent.emit(this, this.pathToMe);
        // listen to children to bubble their events
        this.startListenChildren();
        // return setter for read only props
        return this.myRoSetter;
    }
    destroy() {
        // TODO: если задестроится external элемент то у нас ещё link останется - это плохо
        //       тогда либо надо проверять в событии живой ли элемент
        //       либо слушать событие дестроя
        for (const linkId of this.links) {
            // actually empty is also undefined
            if (typeof linkId === 'undefined')
                continue;
            this.unlink(Number(linkId));
        }
        this.changeEvent.destroy();
    }
    /**
     * It is called only when parent set this item as its child
     * @parent - parent super struct or super array
     * @myPath - full path to me in tree where im is
     */
    $$setParent(parent, myPath) {
        this.myParent = parent;
        this.myPath = myPath;
    }
    /**
     * Do it only if you are totally sure what you do.
     * @param scope
     */
    $$replaceScope(scope) {
        this.myScope = scope;
    }
    /**
     * Make proxy of my self.
     * Please run it only once just after creating of instance.
     */
    getProxy() {
        if (!this.proxyfiedInstance) {
            this.proxyfiedInstance = this.proxyFn(this);
        }
        return this.proxyfiedInstance;
    }
    subscribe(handler) {
        return this.changeEvent.addListener(handler);
    }
    unsubscribe(handlerIndex) {
        this.changeEvent.removeListener(handlerIndex);
    }
    /**
     * It checks does the last parent or myself has key
     * @param pathTo
     */
    hasKey = (pathTo) => {
        return deepHas(this.values, pathTo);
    };
    /**
     * You cat deeply get some primitive or other struct or super array.
     * If it is a primitive you can't change its value.
     * To change its value get its parent and set value via parent like: parent.value = 5
     */
    getValue = (pathTo) => {
        if (typeof pathTo !== 'string')
            throw new Error(`path has to be a string`);
        return deepGet(this.values, pathTo);
    };
    /**
     * Set value deeply.
     * You can set own value or value of some deep object.
     * Even you can set value to the deepest primitive like: struct.struct.num = 5
     */
    setValue = (pathTo, newValue) => {
        if (typeof pathTo !== 'string')
            throw new Error(`path has to be a string`);
        const splat = splitDeepPath(pathTo);
        if (splat.length === 1) {
            // own value - there splat[0] is number or string
            this.setOwnValue(splat[0], newValue);
        }
        else {
            // deep value
            deepSet(this.values, pathTo, newValue);
        }
    };
    /**
     * The same as setValue but it sets null
     */
    setNull = (pathTo) => {
        this.setValue(pathTo, null);
    };
    /**
     * Link key of some struct or array to key of this.
     * Both values of these keys will change at the same time and rise change events both
     */
    link = (externalSuperValue, externalKey, myKey) => {
        const linkId = this.links.length;
        const externalKeyPath = externalSuperValue.makeChildPath(externalKey);
        const myKeyPath = this.makeChildPath(myKey);
        const link = {
            externalSuperValue,
            externalKey,
            myKey,
            externalHandlerIndex: -1,
            myHandlerIndex: -1,
        };
        const externalVal = externalSuperValue.getOwnValue(externalKey);
        // synchronize values wright now before subscribing to events
        if (this.getOwnValue(myKey) !== externalVal)
            this.setOwnValue(myKey, externalVal);
        // subscribe to external change event to set the same value to my
        if (!this.isKeyReadonly(myKey)) {
            link.externalHandlerIndex = externalSuperValue.subscribe((target, path = '') => {
                if (externalKeyPath !== path)
                    return;
                this.setOwnValue(myKey, externalSuperValue.getOwnValue(externalKey));
            });
        }
        // subscribe to my change event to set the same value to external struct or array
        if (!externalSuperValue.isKeyReadonly(externalKey)) {
            link.myHandlerIndex = this.subscribe((target, path = '') => {
                if (myKeyPath !== path)
                    return;
                this.setOwnValue(externalKey, this.getOwnValue(myKey));
            });
        }
        if (link.externalHandlerIndex === -1 && link.myHandlerIndex === -1) {
            console.warn(`Both linked keys are readonly: ${myKey}, ${externalKey}`);
        }
        this.links.push(link);
        return linkId;
    };
    unlink(linkId) {
        const link = this.links[linkId];
        if (!link)
            return;
        if (link.externalHandlerIndex >= 0) {
            link.externalSuperValue.unsubscribe(link.externalHandlerIndex);
        }
        if (link.myHandlerIndex >= 0) {
            this.unsubscribe(link.myHandlerIndex);
        }
        delete this.links[linkId];
    }
    /**
     * It makes full deep clone.
     * You can change the clone but changes will not affect the struct.
     */
    clone = () => {
        return deepClone(omitObj(this.values, SUPER_VALUE_PROP));
    };
    detachedCopy() {
        // TODO: копирование себя, но без родителя и его пути
        //  и со сброшенными обработчиками событий
        //  поидее потомков надо тоже отсоединить от дерева и присоединить к себе
        // TODO: add to proxy
    }
    makeChildPath(childKeyOrIndex) {
        return joinDeepPath([this.pathToMe, childKeyOrIndex]);
    }
    riseChildrenChangeEvent(childKeyOrIndex) {
        const fullPath = this.makeChildPath(childKeyOrIndex);
        this.changeEvent.emit(this, fullPath);
    }
    /**
     * Rise an event of whole my instance
     * @protected
     */
    riseMyEvent() {
        this.changeEvent.emit(this, this.pathToMe);
    }
    // TODO: review
    initChild(definition, childKeyOrIndex, initialValue) {
        // TODO: создавать проксированный инстанс
        // TODO: read only должно наследоваться потомками если оно стоит у родителя
        // TODO: если потомок super value то надо делать его через proxy
        //       потому что иначе не сработает deepGet, deepSet etc
        //       хотя можно для deep manipulate сделать поддержку методов setValue(), getValue()
        let result;
        if (typeof initialValue === 'undefined') {
            // if no new value then set default value if exist
            result = definition.default;
            // TODO: тут тоже проверить тип, он может быть не верный
            // TODO: if definition of child is super struct or array
            //       and not initial value - then make a new super instance
        }
        else {
            // set a new value. It doesn't mean is it readonly or not
            if (isCorrespondingType(initialValue, definition.type)) {
                result = initialValue;
            }
            else {
                throw new Error(`The initial value ${initialValue} with key ${childKeyOrIndex} ` +
                    `is not corresponding type ${definition.type}`);
            }
            if (isSuperValue(result)) {
                // this means the super struct or array has already initialized,
                // so now we are linking it as my child
                const superVal = result;
                superVal.$$setParent(this, this.makeChildPath(childKeyOrIndex));
            }
        }
        return result;
    }
    /**
     * listen to children to bubble their events
     * @protected
     */
    startListenChildren() {
        for (const key of this.myKeys()) {
            const value = this.values[key];
            if (typeof value !== 'object' || !value.isSuperValue)
                continue;
            value.subscribe((target, path) => {
                // if not path then it's some wierd
                if (!path)
                    console.warn(`Bubble event without path. Root is "${this.pathToMe}", child is "${key}"`);
                // just bubble children's event
                this.changeEvent.emit(target, path);
            });
        }
    }
}
