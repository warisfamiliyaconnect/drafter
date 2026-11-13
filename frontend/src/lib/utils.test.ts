import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('combines truthy class names', () => {
    expect(cn('class-a', 'class-b')).toBe('class-a class-b')
  })

  it('filters out falsy and undefined values', () => {
    expect(cn('class-a', false && 'hidden', null, undefined, 'class-c')).toBe('class-a class-c')
  })

  it('handles empty input cleanly', () => {
    expect(cn()).toBe('')
  })
})
