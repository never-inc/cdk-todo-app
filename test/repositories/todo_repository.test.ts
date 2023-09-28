import '../configure'
import * as todo_repository from '../../lambda/repositories/todo_repository'
import { v4 } from 'uuid'

describe('todo_repository', (): void => {
  // テスト開始後に1度だけ呼ばれる
  afterAll(() => {
    jest.clearAllMocks()
  })

  test('CRUDテスト', async () => {
    const todoId = v4()
    const userId = 'test_user_id'

    // 作成
    {
      const todoText = 'todo'
      await todo_repository.setTodo(todoId, userId, todoText)
      const result = await todo_repository.fetchTodo(todoId)
      expect(result.Item?.todoId as string).toEqual(todoId)
      expect(result.Item?.todoText as string).toEqual(todoText)
    }

    // 更新
    {
      const todoText = 'todoUpdate'
      await todo_repository.updateTodo(todoId, userId, todoText)
      const result = await todo_repository.fetchTodo(todoId)
      expect(result.Item?.todoText as string).toEqual(todoText)
    }

    // 削除
    {
      await todo_repository.deleteTodo(todoId, userId)
      const result = await todo_repository.fetchTodo(todoId)
      expect(result.Item).toBeUndefined()
    }
  })
})
