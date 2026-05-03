export const characterClassTextMap = {
  '.': 'Any character',
  '\\d': 'Any digit',
  '\\D': 'Non-digit',
  '\\w': 'Any alphanumeric',
  '\\W': 'Non-alphanumeric',
  '\\s': 'White space',
  '\\S': 'Non-white space',
  '\\t': 'Horizontal tab',
  '\\r': 'Carriage return',
  '\\n': 'Linefeed',
  '\\v': 'Vertical tab',
  '\\f': 'Form-feed',
  '[\\b]': 'Backspace',
  '\\0': 'NUL',
  '\\cH': '\\b Backspace',
  '\\cI': '\\t Horizontal Tab',
  '\\cJ': '\\n Line Feed',
  '\\cK': '\\v Vertical Tab',
  '\\cL': '\\f Form Feed',
  '\\cM': '\\r Carriage Return',
  '\\xhh': 'ASCII symbol',
  '\\uhhhh': 'Unicode symbol',
}
export type CharacterClassKey = keyof typeof characterClassTextMap

const controlCharNames: Record<number, string> = {
  0x00: 'NUL',
  0x01: 'SOH',
  0x02: 'STX',
  0x03: 'ETX',
  0x04: 'EOT',
  0x05: 'ENQ',
  0x06: 'ACK',
  0x07: 'BEL',
  0x08: 'BS',
  0x09: 'HT',
  0x0A: 'LF',
  0x0B: 'VT',
  0x0C: 'FF',
  0x0D: 'CR',
  0x0E: 'SO',
  0x0F: 'SI',
  0x10: 'DLE',
  0x11: 'DC1',
  0x12: 'DC2',
  0x13: 'DC3',
  0x14: 'DC4',
  0x15: 'NAK',
  0x16: 'SYN',
  0x17: 'ETB',
  0x18: 'CAN',
  0x19: 'EM',
  0x1A: 'SUB',
  0x1B: 'ESC',
  0x1C: 'FS',
  0x1D: 'GS',
  0x1E: 'RS',
  0x1F: 'US',
  0x20: 'Space',
  0x7F: 'DEL',
}

function parseHexValue(value: string): number | null {
  const xhhMatch = value.match(/^\\x([0-9a-fA-F]{2})$/)
  if (xhhMatch) {
    return parseInt(xhhMatch[1], 16)
  }
  const uhhhhMatch = value.match(/^\\u([0-9a-fA-F]{4})$/)
  if (uhhhhMatch) {
    return parseInt(uhhhhMatch[1], 16)
  }
  return null
}

function getCharName(charCode: number): string {
  if (charCode in controlCharNames) {
    return controlCharNames[charCode]
  }
  if (charCode >= 0x21 && charCode <= 0x7E) {
    return `Printable '${String.fromCharCode(charCode)}'`
  }
  if (charCode >= 0x80 && charCode <= 0xFF) {
    return 'Extended ASCII'
  }
  return 'Character'
}

export function getCharacterDescription(value: string): { hex: string; name: string } | null {
  const charCode = parseHexValue(value)
  if (charCode === null) {
    return null
  }
  const hex = value.toUpperCase()
  const name = getCharName(charCode)
  return { hex, name }
}
