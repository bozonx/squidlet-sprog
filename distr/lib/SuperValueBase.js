import { IndexedEventEmitter, deepGet, deepHas, deepSet, deepClone, splitDeepPath, joinDeepPath, } from 'squidlet-lib';
import { All_TYPES, SIMPLE_TYPES, SUPER_TYPES, SUPER_VALUES } from '../types/valueTypes.js';
import { DEFAULT_INIT_SUPER_DEFINITION } from '../types/SuperItemDefinition.js';
import { isCorrespondingType } from './isCorrespondingType.js';
import { resolveInitialSimpleValue } from './helpers.js';
import { SuperBase } from './SuperBase.js';
export const SUPER_PROXY_PUBLIC_MEMBERS = [
    'isSuperValue',
    'getValue',
    'setValue',
    'setNull',
    'toDefaultValue',
    'subscribe',
];
export var SUPER_VALUE_EVENTS;
(function (SUPER_VALUE_EVENTS) {
    SUPER_VALUE_EVENTS[SUPER_VALUE_EVENTS["initStart"] = 0] = "initStart";
    SUPER_VALUE_EVENTS[SUPER_VALUE_EVENTS["inited"] = 1] = "inited";
    SUPER_VALUE_EVENTS[SUPER_VALUE_EVENTS["destroy"] = 2] = "destroy";
    SUPER_VALUE_EVENTS[SUPER_VALUE_EVENTS["change"] = 3] = "change";
    // changes (define or forget) of definitions after initialization
    SUPER_VALUE_EVENTS[SUPER_VALUE_EVENTS["definition"] = 4] = "definition";
    SUPER_VALUE_EVENTS[SUPER_VALUE_EVENTS["newLink"] = 5] = "newLink";
    SUPER_VALUE_EVENTS[SUPER_VALUE_EVENTS["unlink"] = 6] = "unlink";
    SUPER_VALUE_EVENTS[SUPER_VALUE_EVENTS["changeParent"] = 7] = "changeParent";
})(SUPER_VALUE_EVENTS = SUPER_VALUE_EVENTS || (SUPER_VALUE_EVENTS = {}));
export const SUPER_VALUE_PROP = '$super';
export function isSuperValue(val) {
    return typeof val === 'object' && val.isSuperValue;
}
export function prepareDefinitionItem(definition, defaultRo = false) {
    return {
        ...DEFAULT_INIT_SUPER_DEFINITION,
        ...definition,
        readonly: (defaultRo)
            // if ro was set to false in definition then leave false. In other cases true
            ? definition.readonly !== false
            // or just use that value which is was set in definition
            : Boolean(definition.readonly),
    };
}
export function checkDefinition(definition) {
    const { type, required, nullable, readonly, default: defaultValue, } = definition;
    if (type && !Object.keys(All_TYPES).includes(type)) {
        throw new Error(`Wrong type : ${type}`);
    }
    else if (typeof required !== 'undefined' && typeof required !== 'boolean') {
        throw new Error(`required has to be boolean`);
    }
    else if (typeof nullable !== 'undefined' && typeof nullable !== 'boolean') {
        throw new Error(`nullable has to be boolean`);
    }
    else if (typeof readonly !== 'undefined' && typeof readonly !== 'boolean') {
        throw new Error(`readonly has to be boolean`);
    }
    else if (defaultValue && !isCorrespondingType(defaultValue, type, nullable)) {
        throw new Error(`Default value ${defaultValue} doesn't meet type: ${type}`);
    }
}
/**
 * Resolves value for simple type and
 * any, simple function, super function, classes and other.
 * It assumes that you validated value before
 */
function resolveNotSuperChild(definition, initialValue) {
    // use initial value or default if no initial value
    const value = (typeof initialValue === 'undefined')
        ? definition.default
        : initialValue;
    if (typeof value !== 'undefined')
        return value;
    else if (Object.keys(SIMPLE_TYPES).includes(definition.type)) {
        // if no value then make it from simple type
        // return null if nullable or initial value for each type
        // e.g string='', number=0, boolean=false etc
        return resolveInitialSimpleValue(definition.type, definition.nullable);
    }
    else if (Object.keys(All_TYPES).includes(definition.type)) {
        // if no value or default value then return undefined for
        // any, simple function, super function, classes and other.
        return undefined;
    }
    throw new Error(`Unsupported definition type of ${definition.type}`);
}
// TODO: почему только в struct а не в data??
export function validateChildValue(definition, childKeyOrIndex, value) {
    if (!definition)
        throw new Error(`no definition`);
    else if (definition.type === 'any') {
        return;
    }
    else if (Object.keys(SUPER_VALUES).includes(definition.type)) {
        // TODO: validate super value
    }
    else if (definition.type === SUPER_TYPES.SuperFunc) {
        // TODO: validate super func
    }
    else if (Object.keys(SIMPLE_TYPES).includes(definition.type)) {
        if (typeof value === 'undefined' && definition.required) {
            throw new Error(`The value of ${childKeyOrIndex} is required, but hasn't defined`);
        }
        else if (typeof value === 'undefined' && !definition.required) {
            return;
        }
        else if (!isCorrespondingType(value, definition.type, definition.nullable)) {
            throw new Error(`The value of ${childKeyOrIndex} has type ${typeof value}, `
                + `but not ${definition.type}`);
        }
        // // Value is defined in this case don't check required.
        // // Check type
        // else if (!isCorrespondingType(value, definition.type, definition.nullable)) {
        //   throw new Error(
        //     `The value of ${childKeyOrIndex} has type ${typeof value}, `
        //     + `but not ${definition.type}`
        //   )
        // }
    }
    // TODO: check other types
}
export class SuperValueBase extends SuperBase {
    isSuperValue = true;
    events = new IndexedEventEmitter();
    links = [];
    get isDestroyed() {
        return this.events.isDestroyed;
    }
    init() {
        super.init();
        // rise an event any way if any values was set or not
        this.events.emit(SUPER_VALUE_EVENTS.change, this, this.pathToMe);
        // TODO: это должно произойти вглубь на всех потомков, все должны друг друга слушать
        // TODO: хотя наверное это уже произошло при установке значений
        // listen to children to bubble their events
        //this.startListenChildren()
        this.events.emit(SUPER_VALUE_EVENTS.inited);
        // return setter for read only props
        return this.myRoSetter;
    }
    destroy() {
        this.events.emit(SUPER_VALUE_EVENTS.destroy);
        for (const linkId in this.links) {
            // actually empty is also undefined
            if (typeof linkId === 'undefined')
                continue;
            this.unlink(Number(linkId));
        }
        this.events.destroy();
    }
    /**
     * It is called only when parent set this item as its child
     * @parent - parent super struct, super array or super data
     * @myPath - full path to me in tree where im am
     */
    $$setParent(parent, myPath) {
        super.$$setParent(parent, myPath);
        // reregister path of all the super children
        for (const childId of this.ownKeys) {
            const item = this.values[childId];
            if (item.$$setParent)
                item.$$setParent(this, this.makeChildPath(childId));
        }
        this.events.emit(SUPER_VALUE_EVENTS.changeParent);
    }
    subscribe = (handler) => {
        return this.events.addListener(SUPER_VALUE_EVENTS.change, handler);
    };
    unsubscribe = (handlerIndex) => {
        this.events.removeListener(handlerIndex, SUPER_VALUE_EVENTS.change);
    };
    /**
     * It checks does the last parent or myself has key
     * @param pathTo
     */
    hasKey = (pathTo) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        else if (typeof pathTo !== 'string')
            throw new Error(`path has to be a string`);
        return deepHas(this.values, pathTo);
    };
    /**
     * You cat deeply get some primitive or other struct or super array.
     * If it is a primitive you can't change its value.
     * To change its value get its parent and set value via parent like: parent.value = 5
     */
    getValue = (pathTo, defaultValue) => {
        // TODO: remove defaultValue
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        else if (typeof pathTo !== 'string')
            throw new Error(`path has to be a string`);
        return deepGet(this.values, pathTo, defaultValue);
    };
    /**
     * Set value deeply.
     * You can set own value or value of some deep object.
     * Even you can set value to the deepest primitive like: struct.struct.num = 5
     * @returns {boolean} if true then value was found and set. If false value hasn't been set
     */
    setValue = (pathTo, newValue) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        else if (typeof pathTo !== 'string')
            throw new Error(`path has to be a string`);
        const splat = splitDeepPath(pathTo);
        if (splat.length === 1) {
            // own value - there splat[0] is number or string
            return this.setOwnValue(splat[0], newValue);
        }
        else {
            // deep value
            return deepSet(this.values, pathTo, newValue);
        }
    };
    /**
     * The same as setValue but it sets null
     */
    setNull = (pathTo) => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        this.setValue(pathTo, null);
    };
    /**
     * Set all the values to default ones
     */
    toDefaults() {
        for (const key of this.ownKeys) {
            this.toDefaultValue(key);
        }
    }
    // TODO: review - нужно учитывать что тот элемент может задестроиться
    // TODO: если задестроится external элемент то у нас ещё link останется - это плохо
    //       тогда либо надо проверять в событии живой ли элемент
    //       либо слушать событие дестроя
    /**
     * Link key of some struct or array to key of this.
     * Both values of these keys will change at the same time and rise change events both
     */
    link = (externalSuperValue, externalKey, myKey) => {
        // TODO: если личного значения нет то направить на слой ниже
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
        this.events.emit(SUPER_VALUE_EVENTS.newLink, linkId);
        return linkId;
    };
    unlink(linkId) {
        // TODO: если личного значения нет то направить на слой ниже
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
        this.events.emit(SUPER_VALUE_EVENTS.unlink, linkId);
    }
    /**
     * It makes full deep clone.
     * You can change the clone but changes will not affect the struct.
     */
    clone = () => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        return deepClone(this.values);
    };
    makeChildPath(childKeyOrIndex) {
        return joinDeepPath([this.pathToMe, childKeyOrIndex]);
    }
    emitChildChangeEvent(childKeyOrIndex) {
        const fullPath = this.makeChildPath(childKeyOrIndex);
        this.events.emit(SUPER_VALUE_EVENTS.change, this, fullPath);
    }
    /**
     * Rise an event of whole my instance
     * @protected
     */
    emitMyEvent() {
        this.events.emit(SUPER_VALUE_EVENTS.change, this, this.pathToMe);
    }
    /**
     * Resolve onw child value according the definition and init it.
     * If the child is simple type then it checks its type and returns
     * default or initial value for type.
     * If the child is Super type then it init it if need
     */
    resolveChildValue(definition, childKeyOrIndex, value) {
        validateChildValue(definition, childKeyOrIndex, value);
        if (Object.keys(SUPER_VALUES).includes(definition.type)) {
            return this.resolveSuperChild(definition, childKeyOrIndex, value);
        }
        // resolve other types
        return resolveNotSuperChild(definition, value);
    }
    // TODO: review
    resolveSuperChild(definition, childKeyOrIndex, initialValue) {
        // work with super type
        // TODO: убрать лишние валидации
        // TODO: check undefined initialValue
        // TODO: startListenChildren()
        // TODO: если передан super value
        //    надо подменить у него parent, path и слушать buble событий от него
        //    все его потомки должны обновить родительский path
        // TODO: check isSuper instead
        if (initialValue && isSuperValue(initialValue)) {
            // this means the super struct or array has already initialized,
            // so now we are linking it as my child
            // TODO: проверить соответствие в default's definition
            // TODO: установить ro если он у родителя
            // TODO: потомок должен установить ro у детей
            initialValue.$super.$$setParent(this, this.makeChildPath(childKeyOrIndex));
            return initialValue;
        }
        else if (!definition.default) {
            throw new Error(`There aren't initial value and default value for super value`);
        }
        else if (typeof definition.default !== 'object') {
            throw new Error(`Wrong type of definition.default`);
        }
        else {
            // if initial value not defined then create an instance using default's definition
            // TODO: read only должно наследоваться потомками если оно стоит у родителя
            // TODO: если потомок super value то надо делать его через proxy
            //       потому что иначе не сработает deepGet, deepSet etc
            //       хотя можно для deep manipulate сделать поддержку методов setValue(), getValue()
            let def;
            if (definition.type === SUPER_VALUES.SuperStruct) {
                def = {
                    $exp: 'newSuperStruct',
                    definition: definition.default,
                    defaultRo: definition.readonly,
                };
            }
            else if (definition.type === SUPER_VALUES.SuperArray) {
                def = {
                    $exp: 'newSuperArray',
                    item: {
                        ...definition.default.item,
                        //readonly: definition.readonly
                    },
                    default: definition.default.default,
                };
            }
            //this.myScope.$resolve()
        }
        throw new Error(`Can't setup a super value of ${childKeyOrIndex}`);
    }
    /**
     * listen to children to bubble their events
     * @protected
     */
    startListenChildren() {
        // TODO: use it in value setup
        // TODO: поидее должно пойти в глубину.
        //    Но при этом если объект был переназначен другому родителю
        //    то надо отписаться от старых событий - зайти в старого родителя и отписаться
        for (const key of this.ownKeys) {
            // TODO: тут должны быть ownValues или layered???
            const value = this.values[key];
            if (typeof value !== 'object' || !value.isSuperValue)
                continue;
            value.subscribe((target, path) => {
                // if not path then it's some wierd
                if (!path)
                    console.warn(`Bubble event without path. But root is "${this.pathToMe}", child is "${key}"`);
                // just bubble children's event
                this.events.emit(SUPER_VALUE_EVENTS.change, target, path);
            });
        }
    }
}
