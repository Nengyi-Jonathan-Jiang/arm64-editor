import {DependencyList, RefObject, useEffect, useState} from "react";


function createRefList<T>(amount: number): RefObject<T>[] {
    return new Array<null>(amount).fill(null).map(() => ({current: null}))
}

export function useRefs<T>(amount: number): RefObject<T>[] {
    const [refList, setRefList] = useState(() => createRefList<T>(amount));
    if (amount !== refList.length) {
        setRefList(createRefList(amount));
    }
    return refList;
}


/**
 * A custom react hook. Returns a function `rerender()` which forces the component to update
 */
export function useManualRerender(): () => void {
    const [dummy, setDummy] = useState(0);
    return () => setDummy(dummy + 1);
}

/**
 * A custom react hook. Equivalent to
 * <pre>
 * useEffect(() => {
 *     window.addEventListener(listenerType, listener);
 *
 *     return () => {
 *         window.removeEventListener(listenerType, listener);
 *     }
 * }, dependencies ?? []);
 * </pre>
 */
export function useListenerOnWindow<K extends keyof WindowEventMap>(
    listenerType: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    dependencies?: DependencyList
): void {
    useEffect(() => {
        window.addEventListener(listenerType, listener);

        return () => {
            (window as Window).removeEventListener(listenerType, listener);
        }
    }, dependencies ?? []);
}

/**
 * A custom react hook. Equivalent to
 * <pre>
 * useEffect(() => {
 *     element.addEventListener(listenerType, listener);
 *
 *     return () => {
 *         element.removeEventListener(listenerType, listener);
 *     }
 * }, dependencies ?? []);
 * </pre>
 */
export function useListenerOnHTMLElement<E extends HTMLElement, K extends keyof HTMLElementEventMap>(
    element: RefObject<E> | E,
    listenerType: K,
    listener: (this: E, ev: HTMLElementEventMap[K]) => any,
    dependencies ?: DependencyList
): void {
    if (!("current" in element)) {
        element = {current: element};
    }

    type listener_t = (this: HTMLElement, ev: HTMLElementEventMap[K]) => any;

    useEffect(() => {
        element.current?.addEventListener(listenerType, listener as listener_t);

        return () => {
            element.current?.removeEventListener(listenerType, listener as listener_t);
        }
    }, dependencies ?? []);
}

let isCurrentlyAnimating = false;
let animations = new Set<(t: DOMHighResTimeStamp) => any>;

function startAnimatingIfNotAnimating() {
    if (isCurrentlyAnimating) return;
    isCurrentlyAnimating = true;

    requestAnimationFrame(function f(t) {
        if (animations.size > 0) {
            animations.forEach(callback => callback.call(null, t));
            requestAnimationFrame(f)
        } else {
            isCurrentlyAnimating = false;
        }
    })
}

export function useAnimation(callback: (currTime: number, deltaTime: number) => any) {
    useEffect(() => {
        let lastFrameTime: number | undefined = undefined;

        const f = (time: DOMHighResTimeStamp) => {
            const currTime = time / 1000;
            const deltaTime = currTime - (lastFrameTime ?? currTime);
            lastFrameTime = currTime;

            callback.call(null, currTime, deltaTime);
        }

        animations.add(f);
        startAnimatingIfNotAnimating();

        return () => {
            animations.delete(f);
        };
    }, []);
}