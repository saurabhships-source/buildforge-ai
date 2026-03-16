import type { Metadata } from 'next'
import AppShowcaseClient from './showcase-client'
import { SEED_GALLERY_PROJECTS } from '@/lib/gallery-service'

export async function generateMetadata({ params }: { params: Promise<{ projectId: string }> }): Promise<Metadata> {
  const { projectId } = await params
  const project = SEED_GALLERY_PROJECTS.find(p => p.id === projectId || p.shareSlug === projectId)
  const name = project?.name ?? 'App Showcase'
  const description = project?.description ?? 'An AI-built app on BuildForge'
  const url = `https://buildforge.ai/apps/${projectId}`

  return {
    title: `${name} — BuildForge`,
    description,
    openGraph: {
      title: name,
      description,
      url,
      siteName: 'BuildForge',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      site: '@buildforgeai',
    },
    alternates: { canonical: url },
  }
}

export default async function AppShowcasePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  return <AppShowcaseClient projectId={projectId} />
}
