/**
 * SuperDoc Bridge
 * Centralized, fail-safe communication layer for SuperDoc 2
 */

let superdocInstance: any = null
let editorInstance: any = null

export function setSuperDoc(eventOrInstance: any) {
  if (!eventOrInstance) return
  // Handle onReady({ superdoc }) payload vs direct instance
  superdocInstance = eventOrInstance.superdoc || eventOrInstance
  if (typeof window !== 'undefined') {
    ;(window as any).__superdoc = superdocInstance
    ;(window as any).__superdocInstance = superdocInstance
  }
}

export function setSuperDocEditor(eventOrEditor: any) {
  if (!eventOrEditor) return
  // Handle onEditorCreate({ editor }) payload vs direct editor
  editorInstance = eventOrEditor.editor || eventOrEditor
  if (typeof window !== 'undefined') {
    ;(window as any).__superdocEditor = editorInstance
  }
}

export function getSuperDoc() {
  if (!superdocInstance && typeof window !== 'undefined') {
    superdocInstance =
      (window as any).__superdoc ||
      (window as any).__superdocInstance?.superdoc ||
      (window as any).__superdocInstance
  }
  return superdocInstance
}

export function getEditor() {
  if (!editorInstance && typeof window !== 'undefined') {
    editorInstance = (window as any).__superdocEditor || getSuperDoc()?.activeEditor
  }
  return editorInstance
}

export function insertContentIntoDocument(
  text: string,
  options: { type?: 'markdown' | 'text' | 'html' } = {}
): boolean {
  if (!text || !text.trim()) return false

  const superdoc = getSuperDoc()
  const editor = getEditor() || superdoc?.activeEditor
  const docApi = editor?.doc || superdoc?.getDocumentApi?.() || superdoc?.doc

  console.log('[SuperDoc Bridge] insertContentIntoDocument:', {
    textLength: text.length,
    hasSuperdoc: !!superdoc,
    hasEditor: !!editor,
    hasDocApi: !!docApi,
  })

  // Strategy 1: SuperDoc 2 Document API (Native OOXML document insertion)
  if (docApi && typeof docApi.insert === 'function') {
    try {
      const contentType = options.type || (text.includes('\n') || text.startsWith('#') ? 'markdown' : 'text')
      const receipt = docApi.insert({
        value: text,
        type: contentType,
      })
      console.log('[SuperDoc Bridge] Strategy 1 (docApi.insert) receipt:', receipt)
      return true
    } catch (err) {
      console.warn('[SuperDoc Bridge] docApi.insert error, falling back:', err)
    }
  }

  // Strategy 2: ProseMirror Editor Commands
  if (editor) {
    try {
      if (typeof editor.commands?.insertContent === 'function') {
        editor.commands.insertContent(text)
        console.log('[SuperDoc Bridge] Strategy 2 (commands.insertContent) executed')
        return true
      }
      if (typeof editor.commands?.insertText === 'function') {
        editor.commands.insertText(text)
        console.log('[SuperDoc Bridge] Strategy 2 (commands.insertText) executed')
        return true
      }
      if (typeof editor.insertText === 'function') {
        editor.insertText(text)
        console.log('[SuperDoc Bridge] Strategy 2 (editor.insertText) executed')
        return true
      }
      if (editor.view?.dispatch && editor.state?.tr) {
        const tr = editor.state.tr.insertText(text)
        editor.view.dispatch(tr)
        console.log('[SuperDoc Bridge] Strategy 2 (view.dispatch) executed')
        return true
      }
    } catch (err) {
      console.warn('[SuperDoc Bridge] Editor commands error, falling back:', err)
    }
  }

  // Strategy 3: Direct contenteditable insertion for immediate visual display
  if (typeof document !== 'undefined') {
    try {
      const editorEl =
        document.querySelector('.superdoc-container [contenteditable="true"]') ||
        document.querySelector('[contenteditable="true"]')
      if (editorEl) {
        const p = document.createElement('p')
        p.className = 'my-2 leading-relaxed'
        p.innerText = text
        editorEl.appendChild(p)
        console.log('[SuperDoc Bridge] Strategy 3 (DOM append) executed')
        return true
      }
    } catch (err) {
      console.warn('[SuperDoc Bridge] DOM fallback error:', err)
    }
  }

  console.warn('[SuperDoc Bridge] All insertion strategies failed')
  return false
}

export async function exportDocument(filename: string = 'Drafter_Document.docx'): Promise<boolean> {
  const superdoc = getSuperDoc()
  if (!superdoc) return false

  try {
    if (typeof superdoc.export === 'function') {
      await superdoc.export({
        exportType: 'docx',
        triggerDownload: true,
        exportedName: filename,
      })
      return true
    }
    if (typeof superdoc.exportEditorsToDOCX === 'function') {
      const blobs = await superdoc.exportEditorsToDOCX()
      if (blobs && blobs.length > 0) {
        const url = URL.createObjectURL(blobs[0])
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
        return true
      }
    }
  } catch (err) {
    console.error('[SuperDoc Bridge] Export error:', err)
  }
  return false
}

export function executeCommand(command: string, param?: any): boolean {
  const superdoc = getSuperDoc()
  const editor = getEditor() || superdoc?.activeEditor
  const docApi = editor?.doc || superdoc?.getDocumentApi?.() || superdoc?.doc

  // Strategy 1: SuperDoc 2 Document API
  if (docApi) {
    try {
      if (command === 'undo' && docApi.history?.undo) {
        docApi.history.undo()
        return true
      }
      if (command === 'redo' && docApi.history?.redo) {
        docApi.history.redo()
        return true
      }
      if (command === 'bold' && docApi.format?.bold) {
        docApi.format.bold({})
        return true
      }
      if (command === 'italic' && docApi.format?.italic) {
        docApi.format.italic({})
        return true
      }
      if (command === 'underline' && docApi.format?.underline) {
        docApi.format.underline({})
        return true
      }
      if (command === 'strikethrough' && docApi.format?.strikethrough) {
        docApi.format.strikethrough({})
        return true
      }
      if (command === 'fontSize' && docApi.format?.apply) {
        docApi.format.apply({ inline: { fontSize: `${param}pt` } })
        return true
      }
      if (command === 'fontFamily' && docApi.format?.apply) {
        docApi.format.apply({ inline: { fontFamily: param } })
        return true
      }
      if (command === 'align' && docApi.paragraphs?.setAlignment) {
        docApi.paragraphs.setAlignment({ alignment: param })
        return true
      }
    } catch (err) {
      console.warn('[SuperDoc Bridge] docApi executeCommand error:', err)
    }
  }

  // Strategy 2: superdoc.ui.commands
  if (superdoc?.ui?.commands) {
    try {
      const cmd = superdoc.ui.commands.get(command)
      if (cmd && typeof cmd.execute === 'function') {
        cmd.execute(param)
        return true
      }
    } catch (err) {}
  }

  // Strategy 3: editor.commands
  if (editor?.commands) {
    try {
      if (typeof editor.commands[command] === 'function') {
        editor.commands[command](param)
        return true
      }
      if (typeof editor.commands.toggleMark === 'function') {
        editor.commands.toggleMark(command, param)
        return true
      }
    } catch (err) {}
  }

  return false
}
