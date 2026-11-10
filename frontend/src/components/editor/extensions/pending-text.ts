import { Mark, mergeAttributes } from '@tiptap/core'

export const PendingText = Mark.create({
  name: 'pendingText',

  addAttributes() {
    return {
      status: {
        default: 'pending',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-status="pending"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-status': 'pending', class: 'ai-pending' }), 0]
  },
})
