export function readFormString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== "string") return undefined

  const trimmed = value.trim()
  return trimmed || undefined
}

export function readRequiredFormString(formData: FormData, key: string) {
  return readFormString(formData, key) ?? ""
}

export function readOptionalNumber(formData: FormData, key: string) {
  const value = readFormString(formData, key)

  if (!value) return undefined

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) return undefined

  return numberValue
}

export function matchesSearch(values: Array<string | null | undefined>, search: string) {
  const query = search.trim().toLowerCase()

  if (!query) return true

  return values.some((value) => value?.toLowerCase().includes(query))
}
