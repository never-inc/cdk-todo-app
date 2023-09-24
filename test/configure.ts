import * as env from 'dotenv'

env.config({ path: '.env.local' })

// DynamoDBClientConfigを設定
export const dynamoDbClientConfigure = () => {
  jest.mock('../lambda/repositories/todo_repository', () => {
    return {
      DynamoDBClientConfig: jest.fn().mockImplementation(() => {
        return {
          endpoint: process.env.DYNAMODB_ENDPOINT,
          region: process.env.DYNAMODB_REGION ?? 'ap-northeast-1',
          credentials: {
            accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID,
            secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY,
          },
        }
      }),
    }
  })
}
