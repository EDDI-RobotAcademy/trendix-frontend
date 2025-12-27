import { NextRequest, NextResponse } from 'next/server'

type SupportedPlatform = 'youtube'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const searchParams = url.searchParams

  const platform = (searchParams.get('platform') || 'youtube').toLowerCase() as SupportedPlatform
  const limit = Math.max(1, Math.min(Number(searchParams.get('limit') || '10'), 50))
  const days = Math.max(1, Math.min(Number(searchParams.get('days') || '3'), 30))
  const velocityDaysRaw = Number(searchParams.get('velocity_days') || '1')
  const velocityDays = velocityDaysRaw === 3 ? 3 : 1

  if (platform !== 'youtube') {
    return NextResponse.json(
      {
        items: [],
        meta: {
          platform,
          limit: 0,
          requested_limit: limit,
          days,
          velocity_days: velocityDays,
          message: '현재는 youtube 플랫폼만 지원합니다.',
        },
      },
      { status: 400 }
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  if (!baseUrl) {
    return NextResponse.json(
      {
        items: [],
        meta: {
          platform,
          limit: 0,
          requested_limit: limit,
          days,
          velocity_days: velocityDays,
          message: '백엔드 API BASE URL(NEXT_PUBLIC_API_BASE_URL)이 설정되지 않았습니다.',
        },
      },
      { status: 500 }
    )
  }

  try {
    const backendUrl = new URL('/trends/videos', baseUrl)
    backendUrl.searchParams.set('platform', platform)
    backendUrl.searchParams.set('limit', String(limit))
    backendUrl.searchParams.set('days', String(days))
    backendUrl.searchParams.set('velocity_days', String(velocityDays))

    const backendResponse = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!backendResponse.ok) {
      const text = await backendResponse.text().catch(() => '')

      return NextResponse.json(
        {
          items: [],
          meta: {
            platform,
            limit: 0,
            requested_limit: limit,
            days,
            velocity_days: velocityDays,
            message: `백엔드 요청 실패: ${backendResponse.status}`,
            backend_error: text,
          },
        },
        { status: 502 }
      )
    }

    const backendData: any = await backendResponse.json()
    const backendItems: any[] = Array.isArray(backendData?.items) ? backendData.items : []

    // surge_score 기준으로 다시 한 번 정렬 보장 (백엔드가 정렬해서 주더라도 안전하게)
    const sorted = backendItems
      .slice()
      .sort((a, b) => {
        const aScore = typeof a.surge_score === 'number' ? a.surge_score : -Infinity
        const bScore = typeof b.surge_score === 'number' ? b.surge_score : -Infinity
        if (aScore === bScore) return 0
        return bScore - aScore
      })

    // 불필요한 필드는 제거하고, 필요한 필드만 남겨서 응답 (내용 다 빼고 최소 필드만 유지)
    const ranked = sorted.slice(0, limit).map((item) => ({
      video_id: item.video_id,
      title: item.title,
      channel_id: item.channel_id,
      channel_username: item.channel_username,
      platform: item.platform,
      category: item.category, // 필요 시 비워두거나 category_id만 사용 가능
      category_id: item.category_id,
      view_count: item.view_count,
      like_count: item.like_count,
      comment_count: item.comment_count,
      published_at: item.published_at,
      thumbnail_url: item.thumbnail_url,
      crawled_at: item.crawled_at,
      surge_score: item.surge_score,
    }))

    return NextResponse.json({
      items: ranked,
      meta: {
        platform,
        limit: ranked.length,
        requested_limit: limit,
        days,
        velocity_days: velocityDays,
      },
    })
  } catch (error) {
    console.error('Failed to fetch trends/videos from backend:', error)

    return NextResponse.json(
      {
        items: [],
        meta: {
          platform,
          limit: 0,
          requested_limit: limit,
          days,
          velocity_days: velocityDays,
          message: '백엔드 트렌드 영상 데이터를 가져오는 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    )
  }
}
