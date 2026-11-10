'use client'

import dynamic from 'next/dynamic'

const DrafterEditor = dynamic(() => import('@/components/editor/Editor'), {
  ssr: false,
})

export default function Home() {
  return (
    <main>
      <DrafterEditor />
    </main>
  )
}
