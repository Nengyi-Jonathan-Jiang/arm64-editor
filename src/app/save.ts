import {
    type Dispatch, type SetStateAction, useEffect, useMemo, useState,
} from "react";
import { type Action, cast, type Supplier } from "../util/util.ts";

type primitive = boolean | null | string | number;

function isPrimitive (x: unknown): x is primitive {
    return x === null || [ 'boolean', 'string', 'number' ].includes(typeof x);
}

type Initial<S extends primitive = string> = S | (() => S);

export class Save {
    private readonly items: Record<string, primitive>;
    private readonly itemAccess: Map<string, { save: Action, load: Action }>;
    private readonly key: string;
    private _hasUnsavedChanges: boolean = false;

    // noinspection JSUnusedLocalSymbols
    private constructor (key: string) {
        this.items = Object.create(null);
        this.itemAccess = new Map();
        this.key = key;

        this.loadFromStorage();
    }

    public get hasUnsavedChanges (): boolean {
        return this._hasUnsavedChanges;
    }

    /**
     * Creates a savable item under this save. Note that all parameters will be
     * memoized
     *
     * @param key A unique key to save under
     * @param initial The initial value of the item. If this is a function, it
     *                will be called to obtain the initial value
     */
    useSaved<S extends primitive = string> (
        key: string,
        initial: Initial<S>,
    ): [ S, Dispatch<SetStateAction<S>> ];
    /**
     * Creates a savable item under this save. Note that all parameters will be
     * memoized
     *
     * @param key A unique key to save under
     *
     * @param encode A function that encodes the current value. This should
     *               NEVER throw an exception
     *
     * @param decode A function that decodes the current value. This is allowed
     *               to throw an exception, in which case `initial` is used as a
     *               fallback
     *
     * @param initial The initial value of the item. If this is a function, it
     *                will be called to obtain the initial value
     */
    useSaved<S, P extends primitive = string> (
        key: string,
        encode: (val: S) => P,
        decode: (str: P) => S,
        initial: S | Supplier<S>,
    ): [ S, Dispatch<SetStateAction<S>> ];
    // Implementation (forwards to _useSaved for better type inference)
    useSaved<S> (...args: any): [ S, Dispatch<SetStateAction<S>> ] {
        return this._useSaved(...args);
    }

    _useSaved<S, P extends primitive> (
        ...[ key, encode, decode, initial ]:
            [ string, (val: S) => P, (str: P) => S, S | Supplier<S>, ] |
            [ string, S | Supplier<S>, undefined, undefined ]
    ): [ S, Dispatch<SetStateAction<S>> ] {
        if (!decode) {
            return this._useSaved<S, P>(key, cast, cast, encode!);
        }

        const [ s, set ] = useState(() => this.load(key, decode, initial));
        const curr = useMemo(() => ({ s }), []);
        curr.s = s;

        useEffect(() => {
            this.itemAccess.set(key, {
                save: () => this.items[key] = encode(curr.s),
                load: () => set(() => this.load(key, decode, initial)),
            });

            return () => void this.itemAccess.delete(key);
        }, []);

        return [
            s, x => {
                this._hasUnsavedChanges = true;
                set(x);
            },
        ];
    }

    private load<S, P extends primitive> (
        key: string, decode: (p: P) => S, initial: S | Supplier<S>,
    ): S {
        console.log(`Loading ${ this.key }.${ key } from save`);
        if (key in this.items) {
            try {
                return decode(this.items[key] as P);
            }
            catch (e) {
                console.warn(new Error('Save decoding error', { cause: e }));
            }
        }
        if (initial instanceof Function) {
            initial = initial();
        }
        return initial;
    }

    /**
     * Reloads all values from storage. Active useSaved hooks are called to
     * update their values
     */
    loadFromStorage () {
        const items = JSON.parse(window.localStorage.getItem(this.key) ?? '{}');
        if (typeof items !== 'object') {
            console.warn(new Error(
                `Invalid save for key ${ this.key }`,
                { cause: window.localStorage.getItem(this.key) },
            ));
            return;
        }


        for (const [ key, value ] of Object.entries(items)) {
            if (isPrimitive(value)) {
                this.items[key] = value;
                this.itemAccess.get(key)?.load?.();
            }
            else {
                console.warn(
                    `Invalid save entry for key ${ this.key }.${ key }`,
                    { cause: value },
                );
            }
        }
    }

    /**
     * Clears all entries in this save
     */
    clearAll () {
        for (const key in this.items) {
            delete this.items[key];
        }
        for (const [ , { load } ] of this.itemAccess) {
            load();
        }
    }

    /**
     * Clears the given entries in this save
     */
    clearKeys (...keys: string[]) {
        for (const key of keys) {
            delete this.items[key];
            this.itemAccess.get(key)?.load?.();
        }
    }

    /**
     * Writes all values to storage.
     */
    saveToStorage () {
        for (const [ , { save } ] of this.itemAccess) {
            save();
        }
        window.localStorage.setItem(this.key, JSON.stringify(this.items));

        this._hasUnsavedChanges = false;
    }
}

const SaveConstructor = Save as { new (key: string): Save };

export function useSave (key: string, loadImmediately: boolean = true): Save {
    return useMemo(() => {
        const save = new SaveConstructor(key);
        if (loadImmediately) save.loadFromStorage();
        return save;
    }, [ key ]);
}
