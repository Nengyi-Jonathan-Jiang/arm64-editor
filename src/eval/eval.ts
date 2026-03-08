/**
 * Evaluates some code as a string, restricting the context to the given context object.
 * Warning: this function is not secure.
 */
export function evalStatementsInContext(src: string, ctx: any) {
    const restrictedContext = new Proxy(ctx, {
        has: () => true
    });
    (new Function("with(this) { " + src + "}")).call(restrictedContext);
}