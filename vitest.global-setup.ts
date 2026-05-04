import { pushTestDatabaseSchema, removeTestDatabaseFiles } from "./test/test-db"

export async function setup() {
  removeTestDatabaseFiles()
  pushTestDatabaseSchema()

  return async () => {
    removeTestDatabaseFiles()
  }
}
