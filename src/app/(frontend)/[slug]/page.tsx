import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Container } from '@/components/layout/Container'
import { getPublishedPageBySlug } from '@/lib/pages'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getPublishedPageBySlug(slug)
  return { title: page?.title ?? 'صفحه' }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const page = await getPublishedPageBySlug(slug)

  if (!page) notFound()

  return (
    <Container className="py-10 md:py-14">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{page.title}</h1>
      <div className="border-border mt-6 border-t pt-6">
        <article className="rich-text">
          <RichText data={page.content} />
        </article>
      </div>
    </Container>
  )
}
