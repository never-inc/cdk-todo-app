import { PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { getDocumentClient } from './dynamo_db_provider'

const documentClient = getDocumentClient()
const tableName = 'Todo'

export const fetchTodos = async (
  userId: string,
  limit: number,
  todoId: string | undefined,
  createdAt: string | undefined,
) => {
  const command = new QueryCommand({
    TableName: tableName,
    IndexName: 'userIdCreatedAtIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    Limit: limit,
    ...(createdAt != null && todoId != null
      ? {
          ExclusiveStartKey: {
            userId: userId,
            todoId: todoId,
            createdAt: createdAt,
          },
        }
      : {}),
    ScanIndexForward: false, // 降順
  })
  const output = await documentClient.send(command)
  console.log(JSON.stringify(output))
  return output
}

export const setTodo = async (todoId: string, userId: string, todoText: string) => {
  const dateISOString = new Date().toISOString()
  const command = new PutCommand({
    TableName: tableName,
    Item: {
      todoId: todoId,
      userId: userId,
      todoText: todoText,
      createdAt: dateISOString,
      updatedAt: dateISOString,
    },
    ConditionExpression: 'attribute_not_exists(todoId)', // todoIdが重複しないようにする
  })
  const output = await documentClient.send(command)
  console.log(JSON.stringify(output))
  return output
}

export const fetchTodo = async (todoId: string) => {
  const command = new GetCommand({
    TableName: tableName,
    Key: {
      todoId: todoId,
    },
  })
  const output = await documentClient.send(command)
  console.log(JSON.stringify(output))
  return output
}

export const updateTodo = async (todoId: string, userId: string, todoText: string) => {
  const dateISOString = new Date().toISOString()
  const command = new UpdateCommand({
    TableName: tableName,
    Key: {
      todoId: todoId,
    },
    UpdateExpression: 'set todoText = :todoText, updatedAt = :updatedAt',
    ConditionExpression: 'attribute_exists(todoId) AND userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':todoText': todoText,
      ':updatedAt': dateISOString,
    },
    ReturnValues: 'ALL_NEW',
  })
  const output = await documentClient.send(command)
  console.log(JSON.stringify(output))
  return output
}

export const deleteTodo = async (todoId: string, userId: string) => {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: {
      todoId: todoId,
    },
    ConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ReturnValues: 'ALL_OLD',
  })
  const output = await documentClient.send(command)
  console.log(JSON.stringify(output))
  return output
}
