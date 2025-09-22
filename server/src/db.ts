import { join } from 'node:path'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { Tag, Document } from './types'

type DbData = {
  tags: Tag[],
  documents: Document[]
}

// Using a class to manage the singleton instance
class Database {
  private static instance: Low<DbData>;

  public static async getInstance(): Promise<Low<DbData>> {
    if (!Database.instance) {
      const file = join(process.cwd(), 'db.json')
      const adapter = new JSONFile<DbData>(file)
      const defaultData: DbData = { tags: [], documents: [] }
      const db = new Low<DbData>(adapter, defaultData)
      await db.read()
      Database.instance = db
    }
    return Database.instance
  }
}

export const getDb = async () => {
    return await Database.getInstance();
}
