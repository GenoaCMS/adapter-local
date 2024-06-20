import { JSONFilePreset } from 'lowdb/node'
import { config } from '@genoacms/cloudabstraction'
import type { CollectionReference, Document, DocumentSnapshot } from '@genoacms/cloudabstraction/database'

interface Collections {
  [name: string]: any
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
    // @ts-ignore
    const collection = collectionResolvedPromises[i]
    collections[name] = collection
  }
  return collections
}

const collections = await createCollections()

async function createDocument <C extends CollectionReference> (collectionReference: C, document: Document<C>): Promise<DocumentSnapshot<C>> {
// @ts-ignore
  const collection = collections[collectionReference.name]
  await collection.update((data: Array<Document<C>>) => {
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
