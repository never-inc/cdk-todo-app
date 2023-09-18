import 'source-map-support/register'
import serverlessExpress from '@vendia/serverless-express'
import { NextFunction } from 'connect'
import express from 'express'
import { verifyAccessToken } from './repositories/auth_repository'
import * as todo_repository from './repositories/todo_repository'

const app = express()
app.use(express.json())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})

const verifyToken = async (req: express.Request, res: express.Response, next: NextFunction) => {
  const authorization = req.headers.authorization
  const accessToken = authorization?.split(' ')[1]
  try {
    if (accessToken != null) {
      const userId = await verifyAccessToken(accessToken)
      res.locals.userId = userId
      next()
    } else {
      return res.status(401).json({ message: 'Unauthorized' })
    }
  } catch (e) {
    console.error(e)
    return res.status(401).json({ message: e instanceof Error ? e.message : 'Unauthorized' })
  }
  return
}

app.get('/todos', verifyToken, async (req, res) => {
  try {
    const userId = String(res.locals.userId)
    const createdAt: string | undefined = req.query.created_at as string | undefined
    const result = await todo_repository.fetchTodos(userId, 20, createdAt)
    res.status(200).json(result)
  } catch (e) {
    console.error(e)
    res.status(400).json({ message: e instanceof Error ? e.message : 'error' })
  }
})

app.get('/todos/:todoId', verifyToken, async (req, res) => {
  try {
    const todoId = req.params.todoId
    const result = await todo_repository.fetchTodo(todoId)
    res.status(200).json(result)
  } catch (e) {
    console.error(e)
    res.status(400).json({ message: e instanceof Error ? e.message : 'error' })
  }
})

app.post('/todos/:todoId', verifyToken, async (req, res) => {
  try {
    const todoText: string | undefined = req.body.todoText as string | undefined
    if (!todoText) {
      throw Error('todoText is empty')
    }
    const userId = String(res.locals.userId)
    const todoId = req.params.todoId
    const result = await todo_repository.setTodo(todoId, userId, todoText)
    res.status(200).json(result)
  } catch (e) {
    console.error(e)
    res.status(400).json({ message: e instanceof Error ? e.message : 'error' })
  }
})

app.put('/todos/:todoId', verifyToken, async (req, res) => {
  try {
    const todoText: string | undefined = req.body.todoText as string | undefined
    if (!todoText) {
      throw Error('todoText is empty')
    }
    const userId = String(res.locals.userId)
    const todoId = req.params.todoId
    const result = await todo_repository.updateTodo(todoId, userId, todoText)
    res.status(200).json(result)
  } catch (e) {
    console.error(e)
    res.status(400).json({ message: e instanceof Error ? e.message : 'error' })
  }
})

app.delete('/todos/:todoId', verifyToken, async (req, res) => {
  try {
    const userId = String(res.locals.userId)
    const todoId = req.params.todoId
    const result = await todo_repository.deleteTodo(todoId, userId)
    res.status(200).json(result)
  } catch (e) {
    console.error(e)
    res.status(400).json({ message: e instanceof Error ? e.message : 'error' })
  }
})

export const handler = serverlessExpress({ app })
