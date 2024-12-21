import { JSONFilePreset } from 'lowdb/node'
import type { Low } from 'lowdb'
import { config } from '@genoacms/cloudabstraction'
import type {
  Adapter,
  DatabaseProvider,
  CollectionSnapshot,
  Document,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  UpdateSnapshot
} from '@genoacms/cloudabstraction/database'

const PROVIDER_NAME = '@genoacms/adapter-gcp/database'
const databaseConfig = config.database.providers.find((provider: DatabaseProvider) => provider.name === PROVIDER_NAME)
if (!databaseConfig) throw new Error('local-database-provider-not-found')

interface Collections {
  [name: string]: Low<any>
}
function getCollectionNames (): Array<string> {
  const collections = config.collections as Array<CollectionReference>
  return collections.map(collection => collection.name)
}
async function createCollections (): Promise<Collections> {
  const collections: Collections = {}
  const collectionNames = getCollectionNames()
  const collectionPromises = []
  let collectionResolvedPromises
  for (const name of collectionNames) {
    collectionPromises.push(JSONFilePreset(`${name}.json`, []))
  }
  collectionResolvedPromises = await Promise.all(collectionPromises)
  for (let i = 0; i < collectionNames.length; i++) {
    const name = collectionNames[i]
    const collection = collectionResolvedPromises[i]
    collections[name] = collection
  }
  return collections
}

const collections = await createCollections()

const createDocument: Adapter['createDocument'] = async (collectionReference, document) => {
  const collection = collections[collectionReference.name]
  await collection.update((data: Array<Document>) => {
    data.push(document)
  });
  const snapshot = {
    reference: {
      collection: collectionReference,
      id: document[collectionReference.primaryKey.key]
    },
    data: document
  }
 
  return snapshot
}

const getCollections: Adapter['getCollection'] = async (collectionReference) => {
  const collection = collections[collectionReference.name]
  const data: CollectionSnapshot<typeof collectionReference> = await collection.data
  return data
}

const getDocument: Adapter['getDocument'] = async (documentReference) => {
  const collection = collections[documentReference.collection.name] as Low<Array<Document<typeof documentReference.collection>>>
  const document = collection.data.find((doc) => doc[documentReference.collection.primaryKey.key] === documentReference.id)
  if (!document) throw new Error('document-not-found')
  const snapshot: DocumentSnapshot<typeof documentReference.collection> = {
    reference: documentReference,
    data: document
  }
  return snapshot
}

const updateDocument: Adapter['updateDocument'] = async (documentReference, update) => {
  const collection = collections[documentReference.collection.name] as Low<Array<Document<typeof documentReference.collection>>>
  const document = collection.data.find((doc) => doc[documentReference.collection.primaryKey.key] === documentReference.id)
  if (!document) throw new Error('document-not-found')
  const updatedDocument = { ...document, ...update }
  await collection.update((data: Array<Document>) => {
    const index = data.findIndex((doc: Document) => doc[documentReference.collection.primaryKey.key] === documentReference.id)
    data[index] = updatedDocument
  });
  const snapshot: UpdateSnapshot<typeof documentReference.collection> = {
    reference: documentReference,
    data: updatedDocument
  }
  return snapshot
}

const deleteDocument: Adapter['deleteDocument'] = async (documentReference) => {
  const collection = collections[documentReference.collection.name]
  collection.update((data: Array<Document>) => {
    data = data.filter((doc: Document) => doc[documentReference.collection.primaryKey.key] !== documentReference.id)
  })
}

// async function test () {
//   const testCollectionRef = config.collections[0]
//   // @ts-ignore
//   await createDocument(testCollectionRef, { field: `data 122 ${Date.now()}` })
//
//   const testCollection = collections['test']
//   console.log('test col: ', testCollection)
//   await testCollection.read()
//   console.log(testCollection)
// }

export {
  createDocument,
  getCollections,
  getDocument,
  updateDocument,
  deleteDocument
}
