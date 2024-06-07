const normalizeKey = (key: string) =>
  process.platform === 'win32' ? key.toUpperCase() : key

/**
 * On Windows this behaves as a case-insensitive, case-preserving map.
 * On other platforms this is analog to Map<string, string | undefined>
 */
export class EnvMap implements Map<string, string | undefined> {
  private readonly map = new Map<string, [string, string | undefined]>()

  public get size() {
    return this.map.size
  }

  public constructor(
    iterable?: Iterable<readonly [string, string | undefined]>
  ) {
    if (iterable) {
      for (const [k, v] of iterable) {
        this.map.set(normalizeKey(k), [k, v])
      }
    }
  }

  *[Symbol.iterator]() {
    return this.entries()
  }

  get [Symbol.toStringTag]() {
    return 'EnvMap'
  }

  public entries() {
    return this.map.values()
  }

  public *keys(): IterableIterator<string> {
    for (const [k] of this.map.values()) {
      yield k
    }
  }

  public *values(): IterableIterator<string | undefined> {
    for (const [, v] of this.map.values()) {
      yield v
    }
  }

  public get(key: string) {
    return this.map.get(normalizeKey(key))?.[1]
  }

  public set(key: string, value: string | undefined) {
    const existingKey = this.map.get(normalizeKey(key))?.[0]
    this.map.set(normalizeKey(key), [existingKey ?? key, value])
    return this
  }

  public has(key: string) {
    return this.map.has(normalizeKey(key))
  }

  public clear() {
    this.map.clear()
  }

  public forEach(
    callbackFn: (value: string | undefined, key: string, map: EnvMap) => void,
    thisArg?: any
  ) {
    this.map.forEach(([k, v]) => callbackFn.call(thisArg, v, k, this))
  }

  public delete(key: string) {
    return this.map.delete(normalizeKey(key))
  }
}
