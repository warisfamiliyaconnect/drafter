import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from './use-editor-store'

describe('useEditorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      documentTitle: 'Executive Agreement.docx',
      mode: 'editing',
      zoomLevel: 100,
      activeDocumentId: null,
      isDrafting: false,
      statusMessage: 'Ready',
      showApprovalGate: false,
      activeStep: 1,
      reasoningLogs: [],
      isAiConsoleOpen: false,
      consoleHeight: 'compact',
      selection: null,
    })
  })

  it('initializes with default values', () => {
    const state = useEditorStore.getState()
    expect(state.documentTitle).toBe('Executive Agreement.docx')
    expect(state.mode).toBe('editing')
    expect(state.isAiConsoleOpen).toBe(false)
    expect(state.consoleHeight).toBe('compact')
  })

  it('updates document title', () => {
    useEditorStore.getState().setDocumentTitle('Consulting Agreement v1.docx')
    expect(useEditorStore.getState().documentTitle).toBe('Consulting Agreement v1.docx')
  })

  it('toggles AI Colab console open and closed', () => {
    useEditorStore.getState().toggleAiConsole()
    expect(useEditorStore.getState().isAiConsoleOpen).toBe(true)

    useEditorStore.getState().toggleAiConsole()
    expect(useEditorStore.getState().isAiConsoleOpen).toBe(false)
  })

  it('updates console height between compact and expanded', () => {
    useEditorStore.getState().setConsoleHeight('expanded')
    expect(useEditorStore.getState().consoleHeight).toBe('expanded')

    useEditorStore.getState().setConsoleHeight('compact')
    expect(useEditorStore.getState().consoleHeight).toBe('compact')
  })

  it('appends reasoning logs properly', () => {
    useEditorStore.getState().addReasoningLog('Planner Node started')
    expect(useEditorStore.getState().reasoningLogs).toContain('Planner Node started')
  })

  it('updates active step in agent pipeline', () => {
    useEditorStore.getState().setActiveStep(2)
    expect(useEditorStore.getState().activeStep).toBe(2)

    useEditorStore.getState().setActiveStep(3)
    expect(useEditorStore.getState().activeStep).toBe(3)
  })
})
