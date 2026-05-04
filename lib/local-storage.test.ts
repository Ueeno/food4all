import { describe, expect, it } from "vitest"
import {
  clearLocalStorageValues,
  readLocalStorageValue,
  removeLocalStorageValue,
  writeLocalStorageValue,
} from "./local-storage"

function isStoredObject(value: unknown): value is { label: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "label" in value &&
    typeof value.label === "string"
  )
}

describe("local storage helpers", () => {
  it("reads and writes valid JSON data", () => {
    writeLocalStorageValue("food4all.test.valid", { label: "saved" })

    expect(readLocalStorageValue("food4all.test.valid", isStoredObject)).toEqual({
      label: "saved",
    })
  })

  it("returns null for missing keys, invalid JSON, and invalid shapes", () => {
    localStorage.setItem("food4all.test.invalid-json", "{not-json")
    localStorage.setItem("food4all.test.invalid-shape", JSON.stringify({ label: 42 }))

    expect(readLocalStorageValue("food4all.test.missing", isStoredObject)).toBeNull()
    expect(readLocalStorageValue("food4all.test.invalid-json", isStoredObject)).toBeNull()
    expect(readLocalStorageValue("food4all.test.invalid-shape", isStoredObject)).toBeNull()
  })

  it("removes one key or clears a provided key list", () => {
    writeLocalStorageValue("food4all.test.one", { label: "one" })
    writeLocalStorageValue("food4all.test.two", { label: "two" })
    writeLocalStorageValue("food4all.test.three", { label: "three" })

    removeLocalStorageValue("food4all.test.one")
    clearLocalStorageValues(["food4all.test.two", "food4all.test.three"])

    expect(localStorage.getItem("food4all.test.one")).toBeNull()
    expect(localStorage.getItem("food4all.test.two")).toBeNull()
    expect(localStorage.getItem("food4all.test.three")).toBeNull()
  })
})
