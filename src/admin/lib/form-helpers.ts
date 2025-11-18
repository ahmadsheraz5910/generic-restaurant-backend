export function transformNullableFormValue<T>(
  value: T,
  nullify = true
): T | undefined | null {
  if (typeof value === "string" && value.trim() === "") {
    return nullify ? null : undefined
  }

  if (Array.isArray(value) && value.length === 0) {
    return nullify ? null : undefined
  }

  return value
}

type Nullable<T> = { [K in keyof T]: T[K] | null }
type Optional<T> = { [K in keyof T]: T[K] | undefined }


export function transformNullableFormData<
  T extends Record<string, unknown>,
  K extends boolean = true
>(data: T, nullify: K = true as K): K extends true ? Nullable<T> : Optional<T> {
  return Object.entries(data).reduce((acc, [key, value]) => {
    return {
      ...acc,
      [key]: transformNullableFormValue(value, nullify),
    }
  }, {} as K extends true ? Nullable<T> : Optional<T>)
}