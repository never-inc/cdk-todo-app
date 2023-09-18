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
      return res.status(401).json('Unauthorized')
    }
  } catch (e) {
    console.error(e)
    return res.status(401).json('Unauthorized')
  }
  return
}

app.get('/todos', verifyToken, async (req, res) => {
  try {
    const userId = String(res.locals.userId)
    const result = await todo_repository.fetchTodos(userId)
    res.status(200).json(result)
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: e })
  }
})

app.get('/todos/:todoId', verifyToken, async (req, res) => {
  try {
    const todoId = req.params.todoId
    const result = await todo_repository.fetchTodo(todoId)
    res.status(200).json(result)
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: e })
  }
})

app.post('/todos/:todoId', verifyToken, async (req, res) => {
  try {
    const todoText: string | undefined = String(req.body.todoText)
    if (!todoText) {
      throw Error('todoText is empty')
    }

    const userId = String(res.locals.userId)
    const todoId = req.params.todoId
    const result = await todo_repository.setTodo(todoId, userId, todoText)
    res.status(200).json(result)
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: e })
  }
})

app.put('/todos/:todoId', verifyToken, async (req, res) => {
  try {
    const todoText: string | undefined = String(req.body.todoText)
    if (!todoText) {
      throw Error('todoText is empty')
    }

    const userId = String(res.locals.userId)
    const todoId = req.params.todoId
    const result = await todo_repository.updateTodo(todoId, userId, todoText)
    res.status(200).json(result)
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: e })
  }
})

app.delete('/todos/:todoId', verifyToken, async (req, res) => {
  try {
    const userId = String(res.locals.userId)
    const todoId = req.params.todoId
    const result = await todo_repository.deleteTodo(todoId)
    res.status(200).json(result)
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: e })
  }
})

export const handler = serverlessExpress({ app })
