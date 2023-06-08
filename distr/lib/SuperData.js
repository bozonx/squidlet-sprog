import { deepClone, spliceItem, omitObj, concatUniqStrArrays, deduplicate, splitDeepPath, joinDeepPath, deepSet } from 'squidlet-lib';
import { checkDefinition, prepareDefinitionItem, SUPER_PROXY_PUBLIC_MEMBERS, SUPER_VALUE_EVENTS, SUPER_VALUE_PROP, SuperValueBase, } from './SuperValueBase.js';
import { SIMPLE_TYPES } from '../types/valueTypes.js';
import { DEFAULT_INIT_SUPER_DEFINITION } from '../types/SuperItemDefinition.js';
import { checkValueBeforeSet } from './SuperStruct.js';
import { resolveInitialSimpleValue } from './helpers.js';
export const DATA_MEMBERS = [
    ...SUPER_PROXY_PUBLIC_MEMBERS,
    'isData',
];
export const DEFAULT_DEFINITION_KEY = '$DEFAULT';
export function proxifyData(data) {
    const handler = {
        get(target, prop) {
            if (prop === SUPER_VALUE_PROP) {
                return data;
            }
            else if (DATA_MEMBERS.includes(prop)) {
                // public super struct prop
                return data[prop];
            }
            // else prop or object itself or bottom layer
            return data.values[prop];
        },
        has(target, prop) {
            if (prop === SUPER_VALUE_PROP || DATA_MEMBERS.includes(prop))
                return true;
            return data.allKeys.includes(prop);
        },
        set(target, prop, newValue) {
            return data.setValue(prop, newValue);
        },
        deleteProperty(target, prop) {
            throw new Error(`Don't delete via value proxy! User forget() instead`);
        },
        ownKeys() {
            // to deep functions need that Reflect.ownKeys()
            // get all the keys including bottom layer
            return data.allKeys;
        },
    };
    return new Proxy(data.ownValues, handler);
}
export function proxifyLayeredValue(topOwnValues, bottomData) {
    const handler = {
        get(target, prop) {
            if (Object.keys(topOwnValues).includes(prop))
                return topOwnValues[prop];
            return bottomData?.getValue(prop);
        },
        has(target, prop) {
            return Object.keys(topOwnValues).includes(prop)
                || (bottomData?.allKeys || []).includes(prop);
        },
        set(target, prop, newValue) {
            if (!Object.keys(topOwnValues).includes(prop)
                && bottomData && bottomData.allKeys.includes(prop)) {
                // if var is defined only in bottom value and not in top level
                // set value to it or its lower levels
                return bottomData.setValue(prop, newValue);
            }
            // else if var is defined in top value - set to it
            // or just define a new var in top value
            topOwnValues[prop] = newValue;
            return true;
        },
        deleteProperty(target, prop) {
            throw new Error(`Don't delete via value proxy! User forget() instead`);
        },
        ownKeys() {
            // it has to return all the keys on Reflect.ownKeys()
            return deduplicate([
                ...(bottomData?.allKeys || []),
                ...Object.keys(topOwnValues),
            ]);
        },
    };
    return new Proxy(topOwnValues, handler);
}
export class SuperData extends SuperValueBase {
    isData = true;
    // values only of this layer. Do not use it, use setValue, getValue instead
    ownValues = {};
    // proxy which allows to manipulate with all layers. Do not use it at all.
    // it only for getValue and setValue and other inner methods.
    values;
    defaultRo;
    bottomLayer;
    proxyFn = proxifyData;
    ownOrderedKeys = [];
    // put definition via special method, not straight
    definition = {};
    get defaultDefinition() {
        return this.definition[DEFAULT_DEFINITION_KEY];
    }
    /**
     * Keys only of me, not low layer and not children's
     */
    get ownKeys() {
        return [...this.ownOrderedKeys];
    }
    get allKeys() {
        return deduplicate([
            ...(this.bottomLayer?.allKeys || []),
            ...this.ownKeys,
        ]);
    }
    constructor(definition = {}, defaultRo = false, bottomLayer) {
        if (bottomLayer && !bottomLayer.isData) {
            throw new Error(`Super data can inherit only other super data`);
        }
        else if (bottomLayer && bottomLayer.pathToMe) {
            throw new Error(`Layers can't have paths. It doesn't developed at the moment.`);
        }
        super();
        this.bottomLayer = bottomLayer;
        // save it to use later to define a new props
        this.defaultRo = defaultRo;
        this.values = proxifyLayeredValue(this.ownValues, bottomLayer);
        // setup definitions
        for (const keyStr of Object.keys(definition)) {
            // skip reset of default definition
            if (definition[keyStr] === null)
                continue;
            checkDefinition(definition[keyStr]);
            this.ownOrderedKeys.push(keyStr);
            this.definition[keyStr] = prepareDefinitionItem(definition[keyStr], defaultRo);
        }
        // if wasn't set default definition then set it to allow any type
        if (typeof definition[DEFAULT_DEFINITION_KEY] === 'undefined') {
            this.definition[DEFAULT_DEFINITION_KEY] = DEFAULT_INIT_SUPER_DEFINITION;
        }
        // else if null then do not register it at all
    }
    init = (initialValues) => {
        if (this.inited) {
            throw new Error(`The struct has been already initialized`);
        }
        this.events.emit(SUPER_VALUE_EVENTS.initStart);
        const keys = concatUniqStrArrays(Object.keys(omitObj(this.definition, DEFAULT_DEFINITION_KEY)), Object.keys(initialValues || {}));
        // set initial values of my layer
        for (const key of keys) {
            const def = this.definition[key] || this.defaultDefinition;
            if (!def)
                throw new Error(`Can't resolve definition of key "${key}"`);
            // add key
            if (!this.ownOrderedKeys.includes(key))
                this.ownOrderedKeys.push(key);
            // set value
            this.ownValues[key] = this.resolveChildValue(def, key, initialValues?.[key]);
        }
        // listen to bottom layer changes of which children which upper layer doesn't have
        if (this.bottomLayer) {
            this.bottomLayer.subscribe((target, path) => {
                if (!this.bottomLayer?.isInitialized)
                    return;
                // skip events of whole super data
                else if (!path || path === this.myPath)
                    return;
                const splatPath = splitDeepPath(path);
                const childKeyStr = String(splatPath[0]);
                // if it is another key not I have then rise an event of my level
                if (!this.ownKeys.includes(childKeyStr)) {
                    this.events.emit(SUPER_VALUE_EVENTS.change, target, path);
                }
            });
        }
        return super.init();
    };
    destroy = () => {
        super.destroy();
        for (const key of Object.keys(this.ownValues)) {
            if (typeof this.ownValues[key] === 'object' && this.ownValues[key].destroy) {
                // it will destroy itself and its children
                this.ownValues[key].destroy();
            }
        }
    };
    $$setParent(parent, myPath) {
        if (this.bottomLayer) {
            throw new Error(`It doesn't support to set parent to layered SuperData`);
        }
        super.$$setParent(parent, myPath);
    }
    isKeyReadonly(key) {
        const def = this.getDefinition(key);
        if (!def) {
            throw new Error(`Data doesn't have definition of key "${key}"`);
        }
        return def.readonly;
    }
    getOwnValue(key) {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        return this.ownValues[key];
    }
    setOwnValue(key, value, ignoreRo) {
        const definition = (this.definition[key])
            ? (this.definition[key])
            : this.defaultDefinition;
        checkValueBeforeSet(this.isInitialized, definition, key, value, ignoreRo);
        this.ownValues[key] = this.resolveChildValue(definition, key, value);
        if (!this.ownOrderedKeys.includes(key))
            this.ownOrderedKeys.push(key);
        this.emitChildChangeEvent(key);
        return true;
    }
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
        const keyStr = String(splat[0]);
        if (splat.length === 1) {
            if (!this.ownKeys.includes(keyStr)
                && this.bottomLayer && this.bottomLayer.allKeys.includes(splat[0])) {
                // if not own key but layered key
                const lowPath = joinDeepPath([splat[0]]);
                return this.bottomLayer.setValue(lowPath, newValue);
            }
            else {
                // own value - there splat[0] is number or string
                // if it is a new var then set it to top layer
                return this.setOwnValue(keyStr, newValue);
            }
        }
        else {
            // deep value
            return deepSet(this.values, pathTo, newValue);
        }
    };
    /**
     * Set default value or null if the key doesn't have a default value
     * @param key
     */
    toDefaultValue = (key) => {
        const definition = (this.definition[key])
            ? (this.definition[key])
            : this.defaultDefinition;
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        else if (!definition) {
            throw new Error(`Data doesn't have definition for key "${key}"`);
        }
        if (Object.keys(SIMPLE_TYPES).includes(definition.type)) {
            let defaultValue = definition.default;
            if (typeof defaultValue === 'undefined') {
                // if no default value then make it from type
                defaultValue = resolveInitialSimpleValue(definition.type, definition.nullable);
            }
            // set default value to simple child
            this.setOwnValue(key, defaultValue);
        }
        else {
            // TODO: а должна быть поддержка нижнего слоя ???
            // TODO: может toDefaults() должен учитывать нижний слой ??
            // some super types
            if (this.ownValues[key]?.toDefaults)
                this.ownValues[key].toDefaults();
            // if doesn't have toDefaults() then do nothing
        }
    };
    getProxy() {
        return super.getProxy();
    }
    clone = () => {
        if (!this.isInitialized)
            throw new Error(`Init it first`);
        return deepClone(this.makeOrderedObject());
    };
    /////// Data specific
    batchSet(values) {
        if (!values)
            return;
        for (const key of Object.keys(values)) {
            this.setOwnValue(key, values[key]);
        }
    }
    /**
     * Set a new definition for a specific key. You can't replace or change it.
     */
    define(key, definition, initialValue) {
        if (this.ownOrderedKeys.includes(key)) {
            throw new Error(`Can't redefine a new item. You have to call forget("${key}") first`);
        }
        if (definition) {
            checkDefinition(definition);
            this.definition[key] = prepareDefinitionItem(definition, this.defaultRo);
        }
        // do not set value if it is a default definition
        if (key === DEFAULT_DEFINITION_KEY) {
            // rise definition change event
            this.events.emit(SUPER_VALUE_EVENTS.definition, key);
            return;
        }
        // set the default value
        let finalDef = this.definition[key] || this.defaultDefinition;
        if (!finalDef)
            throw new Error(`Can't resolve definition`);
        if (!this.ownKeys.includes(key))
            this.ownOrderedKeys.push(key);
        // resolve default or initial value as value
        const defaultValue = this.resolveChildValue(finalDef, key, initialValue);
        if (typeof defaultValue !== 'undefined') {
            // set value and rise a child change event
            this.setOwnValue(key, defaultValue, true);
        }
        // rise definition change event
        this.events.emit(SUPER_VALUE_EVENTS.definition, key);
    }
    /**
     * Set default definition or remove it if null passed
     * @param definition
     */
    setDefaultDefinition(definition) {
        if (definition === null) {
            delete this.definition[DEFAULT_DEFINITION_KEY];
            this.events.emit(SUPER_VALUE_EVENTS.definition, DEFAULT_DEFINITION_KEY);
            return;
        }
        this.define(DEFAULT_DEFINITION_KEY, definition);
        this.events.emit(SUPER_VALUE_EVENTS.definition, DEFAULT_DEFINITION_KEY);
    }
    getDefinition(key) {
        if (this.definition[key]) {
            return this.definition[key] || this.defaultDefinition;
        }
        else if (this.bottomLayer) {
            return this.bottomLayer.getDefinition(key);
        }
    }
    /**
     * Remove value and definition in that way as they never exist.
     * It removes value and definition from bottom layer too.
     * @param key
     */
    forget(key) {
        if (key === DEFAULT_DEFINITION_KEY) {
            throw new Error(`Can't remove the default definition`);
        }
        // else remove definition for non array-like child
        delete this.definition[key];
        // remove own value
        delete this.ownValues[key];
        // remove key
        spliceItem(this.ownOrderedKeys, key);
        if (this.bottomLayer) {
            const bottomLayer = this.bottomLayer;
            // if bottom layer has forget() method - then do it
            if (bottomLayer.forget)
                bottomLayer.forget(key);
        }
        // rise definition change event
        this.events.emit(SUPER_VALUE_EVENTS.definition, key);
        // rise child change event
        this.emitChildChangeEvent(key);
    }
    /**
     * Set value of self readonly value and rise an event
     */
    myRoSetter = (name, newValue) => {
        this.setOwnValue(name, newValue, true);
    };
    makeOrderedObject() {
        const res = {};
        for (const key of this.allKeys)
            res[key] = this.values[key];
        return res;
    }
}
