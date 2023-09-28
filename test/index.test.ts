import request from 'supertest'
import './configure'
import { app } from '../lambda/index'
import * as auth_repository from '../lambda/repositories/auth_repository'

describe('index', (): void => {
  const spyVerifyAccessToken = jest.spyOn(auth_repository, 'verifyAccessToken')
  const userId = 'test_user_id'

  beforeEach(() => {
    // verifyAccessTokenのモックにテスト用のuserIdを返すよう設定
    spyVerifyAccessToken.mockResolvedValue(userId)
  })

  afterEach(() => {
    // Mockをクリア
    spyVerifyAccessToken.mockClear()
  })

  test('TODOデータの作成と削除が成功すること', async () => {
    const todoId = 'testTodoId'

    // 作成
    {
      const res = await request(app)
        .post(`/todos/${todoId}`)
        .send({ todoText: 'todoText' })
        .set('Authorization', 'Bearer XXX')
      console.log(res.body)
      expect(res.status).toBe(200)
      expect(res.body).not.toBeNull()
    }

    // 削除
    {
      const res = await request(app).delete(`/todos/${todoId}`).set('Authorization', 'Bearer XXX')
      console.log(res.body)
      expect(res.status).toBe(200)
      expect(res.body).not.toBeNull()
    }
  })
})
