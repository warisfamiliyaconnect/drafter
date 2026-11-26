import { create } from 'zustand'

export type DocumentMode = 'editing' | 'suggesting' | 'viewing'
export type ConsoleHeight = 'compact' | 'expanded'
export type GenerationMode = 'automatic' | 'manual'

export interface TextSelection {
  from: number
  to: number
  text: string
}

export interface StagedParagraph {
  title: string
  content: string
  critique?: string
  threadId: string
}

interface EditorUIState {
  // Document State
  documentTitle: string
  mode: DocumentMode
  zoomLevel: number
  activeDocumentId: string | null

  // Agent & Drafting State
  isDrafting: boolean
  statusMessage: string
  showApprovalGate: boolean
  activeStep: 1 | 2 | 3 // 1: Blueprint Plan, 2: Live Drafting, 3: Critic Audit
  reasoningLogs: string[]

  // Dual-mode drafting
  generationMode: GenerationMode
  stagedParagraph: StagedParagraph | null
  currentThreadId: string | null

  // Colab Console UI State
  isAiConsoleOpen: boolean
  consoleHeight: ConsoleHeight

  // Selection
  selection: TextSelection | null

  // Actions
  setDocumentTitle: (title: string) => void
  setMode: (mode: DocumentMode) => void
  setZoomLevel: (zoom: number) => void
  setActiveDocumentId: (id: string | null) => void

  setIsDrafting: (isDrafting: boolean) => void
  setStatusMessage: (msg: string) => void
  setShowApprovalGate: (show: boolean) => void
  setActiveStep: (step: 1 | 2 | 3) => void
  addReasoningLog: (log: string) => void
  clearReasoningLogs: () => void

  setGenerationMode: (mode: GenerationMode) => void
  setStagedParagraph: (p: StagedParagraph | null) => void
  clearStagedParagraph: () => void
  setCurrentThreadId: (id: string | null) => void

  setIsAiConsoleOpen: (open: boolean) => void
  toggleAiConsole: () => void
  setConsoleHeight: (height: ConsoleHeight) => void

  setSelection: (selection: TextSelection | null) => void
}

export const useEditorStore = create<EditorUIState>((set) => ({
  documentTitle: 'Executive Agreement.docx',
  mode: 'editing',
  zoomLevel: 100,
  activeDocumentId: null,

  isDrafting: false,
  statusMessage: 'Ready',
  showApprovalGate: false,
  activeStep: 1,
  reasoningLogs: [
    'System initialized. DOCX engine online.',
    'Ready to draft or edit with Colab AI Copilot.',
  ],

  generationMode: 'automatic',
  stagedParagraph: null,
  currentThreadId: null,

  isAiConsoleOpen: false,
  consoleHeight: 'compact',
  selection: null,

  setDocumentTitle: (documentTitle) => set({ documentTitle }),
  setMode: (mode) => set({ mode }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
  setActiveDocumentId: (activeDocumentId) => set({ activeDocumentId }),

  setIsDrafting: (isDrafting) => set({ isDrafting }),
  setStatusMessage: (statusMessage) => set({ statusMessage }),
  setShowApprovalGate: (showApprovalGate) => set({ showApprovalGate }),
  setActiveStep: (activeStep) => set({ activeStep }),
  addReasoningLog: (log) =>
    set((state) => ({ reasoningLogs: [...state.reasoningLogs.slice(-49), log] })),
  clearReasoningLogs: () => set({ reasoningLogs: [] }),

  setGenerationMode: (generationMode) => set({ generationMode }),
  setStagedParagraph: (stagedParagraph) => set({ stagedParagraph }),
  clearStagedParagraph: () => set({ stagedParagraph: null }),
  setCurrentThreadId: (currentThreadId) => set({ currentThreadId }),

  setIsAiConsoleOpen: (isAiConsoleOpen) => set({ isAiConsoleOpen }),
  toggleAiConsole: () =>
    set((state) => ({ isAiConsoleOpen: !state.isAiConsoleOpen })),
  setConsoleHeight: (consoleHeight) => set({ consoleHeight }),

  setSelection: (selection) => set({ selection }),
}))
