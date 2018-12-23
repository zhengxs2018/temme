import { EditorPageState } from './interfaces'

export function folder(state: EditorPageState, folderId:number) {
  return state.project.folders.get(folderId)
}

export function selector(state: EditorPageState, selectorId: number) {
  return state.selectors.get(selectorId)
}

export function html(state: EditorPageState, htmlId: number) {
  return state.htmls.get(htmlId)
}

export function nextHtmlTabPlaceOrder(state: EditorPageState) {
  if (state.htmlTabs.isEmpty()) {
    return 1
  } else {
    return state.htmlTabs.map(t => t.placeOrder).max() + 1
  }
}

export function nextSelectorTabPlaceOrder(state: EditorPageState) {
  if (state.selectorTabs.isEmpty()) {
    return 1
  } else {
    return state.selectorTabs.map(t => t.placeOrder).max() + 1
  }
}

export function nextSelectorToOpen(state: EditorPageState) {
  return state.selectorTabs.maxBy(tab => tab.openOrder)
}

export function nextHtmlToOpen(state: EditorPageState) {
  return state.htmlTabs.maxBy(tab => tab.openOrder)
}

export function projectId(state: EditorPageState) {
  return state.project.projectId
}
