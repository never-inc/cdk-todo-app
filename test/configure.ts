import * as env from 'dotenv'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

env.config({ path: '.env.local' })

// DynamoDBClientConfigを設定
jest.mock('../lambda/repositories/dynamo_db_provider', () => {
  const originalModule = jest.requireActual('../lambda/repositories/dynamo_db_provider')
  return {
    ...originalModule,
    getDocumentClient: jest.fn().mockImplementation(() => {
      return new DynamoDBClient({
        endpoint: process.env.DYNAMODB_ENDPOINT,
        region: process.env.DYNAMODB_REGION,
        credentials: {
          accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY ?? '',
        },
      })
    }),
  }
})
