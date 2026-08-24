import type { Endpoint as PayloadEndpoint } from 'payload'

/** Must match the server-side first page size used by the barber profile. */
export const COMMENTS_PAGE_SIZE = 5

/**
 * GET /api/comments?barber=...&page=1&limit=5
 * Paginated active comments for a barber, mapped to safe client fields.
 * Author usernames (phone numbers) are never exposed.
 */
export const commentsListEndpoint: PayloadEndpoint = {
  path: '/comments',
  method: 'get',
  handler: async (req) => {
    const url = new URL(req.url || '')
    const barberId = url.searchParams.get('barber')
    if (!barberId) {
      return Response.json({ error: 'پارامتر barber الزامی است.' }, { status: 400 })
    }

    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const limit = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get('limit')) || COMMENTS_PAGE_SIZE),
    )

    const res = await req.payload.find({
      collection: 'comments',
      depth: 1,
      where: {
        and: [
          { barber: { equals: barberId } },
          { status: { equals: 'active' } },
        ],
      },
      sort: '-createdAt',
      page,
      limit,
      overrideAccess: false,
    })

    const comments = res.docs.map((c) => {
      const author = typeof c.author === 'object' ? c.author : null
      return {
        id: String(c.id),
        authorName: author?.name?.trim() || 'کاربر',
        rating: typeof c.rating === 'number' ? c.rating : undefined,
        text: c.content,
        date: c.createdAt,
      }
    })

    return Response.json({
      comments,
      total: res.totalDocs,
      page: res.page ?? page,
      totalPages: res.totalPages,
    })
  },
}
