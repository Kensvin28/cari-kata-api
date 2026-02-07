import { testClient } from 'hono/testing'
import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('Search Endpoint', () => {
  const client = testClient(app)

  it('should return search results', async () => {
    const res = await client.search.$get({
      query: { q: 'membanggakan' },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      results: ['membanggakan']
    })
  })

  it('should return search results for spaced entry', async () => {
    const res = await client.search.$get({
      query: { q: 'bertanggung jawab' },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      results: ['bertanggung jawab']
    })
  })

  it('should return search results for regex query', async () => {
    const res = await client.search.$get({
      query: { q: 'membanggak.*' },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      results: ['membanggakan']
    })
  })
})