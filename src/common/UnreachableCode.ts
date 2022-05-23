export default class UnreachableCode {
  /**
     * Gives compilation error if new enum value added.
     * @param value
     */
  public static never(value: never): never {
    throw new Error(`Unhandled switch case: ${value}`);
  }
}
