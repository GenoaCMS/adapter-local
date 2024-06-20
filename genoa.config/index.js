const testCollection = {
  name: 'test',
  primaryKey: {
    key: 'id',
    schema: {
      type: 'string'
    }
  },
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      isA: {
        type: 'boolean'
      }
    }
  }
}

/**
 * @type {import('./src/genoa.config.d.ts').default}
 */
const config = {
  authentication: {
    // adapter: import('../dist/services/authentication/index.js')
  },
  database: {
    adapter: import('../dist/services/database/index.js')
  },
  storage: {
    adapter: import('../dist/services/storage/index.js'),
    buckets: [
      'genoacms.test'
    ],
    testingBucket: 'genoacms.test'
  },
  collections: [
    testCollection
  ],
  testDocuments: [
    { name: 'createDocument', isA: true },
    { name: 'updateDocument', isA: false }
  ]
}

export default config
