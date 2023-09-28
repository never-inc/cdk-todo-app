import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb'

export const getDocumentClient = (config: DynamoDBClientConfig = {}) =>
  DynamoDBDocumentClient.from(new DynamoDBClient(config))
