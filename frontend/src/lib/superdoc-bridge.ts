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

  // Strategy 1: SuperDoc 2 Document API (Native OOXML document insertion)
  try {
    const docApi = superdoc?.getDocumentApi?.() || superdoc?.doc
    if (docApi && typeof docApi.insert === 'function') {
      const contentType = options.type || (text.includes('\n') || text.startsWith('#') ? 'markdown' : 'text')
      docApi.insert({
        value: text,
        type: contentType,
      })
      return true
    }
  } catch (err) {
    console.warn('[SuperDoc Bridge] DocumentApi.insert error, falling back to editor commands:', err)
  }

  // Strategy 2: ProseMirror Editor Commands
  if (editor) {
    try {
      if (typeof editor.commands?.insertContent === 'function') {
        editor.commands.insertContent(text)
        return true
      }
      if (typeof editor.commands?.insertText === 'function') {
        editor.commands.insertText(text)
        return true
      }
      if (typeof editor.insertText === 'function') {
        editor.insertText(text)
        return true
      }
      if (editor.view?.dispatch && editor.state?.tr) {
        const tr = editor.state.tr.insertText(text)
        editor.view.dispatch(tr)
        return true
      }
    } catch (err) {
      console.warn('[SuperDoc Bridge] Editor command execution error:', err)
    }
  }

  // Strategy 3: Fallback DOM insertion for immediate visual display in the contenteditable canvas
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
        return true
      }
    } catch (err) {
      console.warn('[SuperDoc Bridge] DOM fallback insertion error:', err)
    }
  }

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

  // Strategy 1: superdoc.ui.commands
  if (superdoc?.ui?.commands) {
    try {
      const cmd = superdoc.ui.commands.get(command)
      if (cmd && typeof cmd.execute === 'function') {
        cmd.execute(param)
        return true
      }
    } catch (err) {}
  }

  // Strategy 2: editor.commands
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
