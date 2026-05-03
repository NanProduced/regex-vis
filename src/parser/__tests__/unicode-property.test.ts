import { expect, it, describe } from 'vitest'
import type * as AST from '../ast'
import parse from '../parse'
import gen from '../gen'

describe('Unicode Property Escape', () => {
  describe('Parsing', () => {
    it('should parse \\p{Lu} (uppercase letter)', () => {
      const result = parse('/\\p{Lu}/u')
      expect(result.type).toBe('regex')
      const regex = result as AST.Regex
      expect(regex.flags).toContain('u')
      expect(regex.body).toHaveLength(1)
      const node = regex.body[0] as AST.UnicodePropertyCharacterNode
      expect(node.type).toBe('character')
      expect(node.kind).toBe('unicodeProperty')
      expect(node.property).toBe('Lu')
      expect(node.value).toBeNull()
      expect(node.negate).toBe(false)
    })

    it('should parse \\P{Ll} (non-lowercase letter)', () => {
      const result = parse('/\\P{Ll}/u')
      expect(result.type).toBe('regex')
      const regex = result as AST.Regex
      expect(regex.flags).toContain('u')
      expect(regex.body).toHaveLength(1)
      const node = regex.body[0] as AST.UnicodePropertyCharacterNode
      expect(node.type).toBe('character')
      expect(node.kind).toBe('unicodeProperty')
      expect(node.property).toBe('Ll')
      expect(node.value).toBeNull()
      expect(node.negate).toBe(true)
    })

    it('should parse \\p{Script=Latin} (with =)', () => {
      const result = parse('/\\p{Script=Latin}/u')
      expect(result.type).toBe('regex')
      const regex = result as AST.Regex
      expect(regex.flags).toContain('u')
      expect(regex.body).toHaveLength(1)
      const node = regex.body[0] as AST.UnicodePropertyCharacterNode
      expect(node.type).toBe('character')
      expect(node.kind).toBe('unicodeProperty')
      expect(node.property).toBe('Script')
      expect(node.value).toBe('Latin')
      expect(node.negate).toBe(false)
    })

    it('should parse \\p{Emoji_Presentation}', () => {
      const result = parse('/\\p{Emoji_Presentation}/u')
      expect(result.type).toBe('regex')
      const regex = result as AST.Regex
      expect(regex.flags).toContain('u')
      expect(regex.body).toHaveLength(1)
      const node = regex.body[0] as AST.UnicodePropertyCharacterNode
      expect(node.type).toBe('character')
      expect(node.kind).toBe('unicodeProperty')
      expect(node.property).toBe('Emoji_Presentation')
      expect(node.value).toBeNull()
      expect(node.negate).toBe(false)
    })

    it('should parse with quantifier', () => {
      const result = parse('/\\p{Lu}+/u')
      expect(result.type).toBe('regex')
      const regex = result as AST.Regex
      expect(regex.body).toHaveLength(1)
      const node = regex.body[0] as AST.UnicodePropertyCharacterNode
      expect(node.quantifier).not.toBeNull()
      expect(node.quantifier!.kind).toBe('+')
    })

    it('should error without u flag', () => {
      const result = parse('/\\p{Lu}/')
      expect(result.type).toBe('error')
    })
  })

  describe('Generation', () => {
    it('should generate \\p{Lu} correctly', () => {
      const ast: AST.Regex = {
        id: '',
        type: 'regex',
        body: [
          {
            id: '',
            type: 'character',
            kind: 'unicodeProperty',
            property: 'Lu',
            value: null,
            negate: false,
            quantifier: null,
          },
        ],
        flags: ['u'],
        literal: true,
        escapeBackslash: false,
      }
      const result = gen(ast)
      expect(result).toBe('/\\p{Lu}/u')
    })

    it('should generate \\P{Ll} correctly', () => {
      const ast: AST.Regex = {
        id: '',
        type: 'regex',
        body: [
          {
            id: '',
            type: 'character',
            kind: 'unicodeProperty',
            property: 'Ll',
            value: null,
            negate: true,
            quantifier: null,
          },
        ],
        flags: ['u'],
        literal: true,
        escapeBackslash: false,
      }
      const result = gen(ast)
      expect(result).toBe('/\\P{Ll}/u')
    })

    it('should generate \\p{Script=Latin} correctly', () => {
      const ast: AST.Regex = {
        id: '',
        type: 'regex',
        body: [
          {
            id: '',
            type: 'character',
            kind: 'unicodeProperty',
            property: 'Script',
            value: 'Latin',
            negate: false,
            quantifier: null,
          },
        ],
        flags: ['u'],
        literal: true,
        escapeBackslash: false,
      }
      const result = gen(ast)
      expect(result).toBe('/\\p{Script=Latin}/u')
    })

    it('should round-trip parse and gen correctly for \\p{Lu}', () => {
      const input = '/\\p{Lu}/u'
      const parsed = parse(input)
      expect(parsed.type).toBe('regex')
      const result = gen(parsed as AST.Regex)
      expect(result).toBe(input)
    })

    it('should round-trip parse and gen correctly for \\P{Ll}', () => {
      const input = '/\\P{Ll}/u'
      const parsed = parse(input)
      expect(parsed.type).toBe('regex')
      const result = gen(parsed as AST.Regex)
      expect(result).toBe(input)
    })

    it('should round-trip parse and gen correctly for \\p{Script=Latin}', () => {
      const input = '/\\p{Script=Latin}/u'
      const parsed = parse(input)
      expect(parsed.type).toBe('regex')
      const result = gen(parsed as AST.Regex)
      expect(result).toBe(input)
    })

    it('should round-trip parse and gen correctly for \\p{Emoji_Presentation}', () => {
      const input = '/\\p{Emoji_Presentation}/u'
      const parsed = parse(input)
      expect(parsed.type).toBe('regex')
      const result = gen(parsed as AST.Regex)
      expect(result).toBe(input)
    })
  })
})
