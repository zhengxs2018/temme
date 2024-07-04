import LZString from 'lz-string'
import { EXAMPLE_MODE } from './constants'

export function encodeContent(html: string, selectorString: string) {
  return LZString.compressToEncodedURIComponent(JSON.stringify({ html, selectorString }))
}

export function saveContentToUri(html: string, selectorString: string) {
  if (!EXAMPLE_MODE) {
    location.replace('#' + encodeContent(html, selectorString))
  }
}

export function loadContentFromUri() {
  try {
    const codeLZ = location.hash.slice(1) // 去掉 hash 的 # 字符
    return JSON.parse(LZString.decompressFromEncodedURIComponent(codeLZ))
  } catch (e) {
    return null
  }
}
