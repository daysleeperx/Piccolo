 export class UnreachableCode {
    public static never(value: never): never {
        throw new Error(`Unhandled switch case: ${value}`)
    }
}