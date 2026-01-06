'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Icon } from '@iconify/react/dist/iconify.js'

interface Video {
    id: string
    title: string
    channelName: string
    channelId: string
    thumbnailUrl: string
    viewCount: number
    viewCountChange: number
    likeCount: number
    likeCountChange: number
    publishedAt: string
    duration: string
    categoryId: string
    isShort: boolean
    trendingRank?: number
    trendingReason?: string
}

interface VideoDetailModalProps {
    video: Video | null
    onClose: () => void
}

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

function formatChange(num: number): string {
    const sign = num >= 0 ? '+' : ''
    return sign + formatNumber(num)
}

function timeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}일 전`
    return `${Math.floor(seconds / 604800)}주 전`
}

interface ViewHistoryItem {
    snapshot_date: string
    view_count: number
    like_count: number
    comment_count: number
}

function SimpleChart({ 
    data, 
    label, 
    color, 
    isLoading 
}: { 
    data: { time: string; count: number }[], 
    label: string, 
    color: string,
    isLoading?: boolean
}) {
    if (isLoading) {
        return (
            <div className='bg-gray-50 rounded-lg p-3 border border-gray-200'>
                <h4 className='font-medium text-gray-700 mb-3 text-sm'>{label} 추이</h4>
                <div className='flex items-center justify-center h-48'>
                    <Icon icon='mdi:loading' className='text-2xl text-gray-400 animate-spin' />
                </div>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className='bg-gray-50 rounded-lg p-3 border border-gray-200'>
                <h4 className='font-medium text-gray-700 mb-3 text-sm'>{label} 추이</h4>
                <div className='flex items-center justify-center h-48 text-gray-400 text-sm'>
                    데이터 없음
                </div>
            </div>
        )
    }

    // Y축을 "최소값 대비 차이값(Δ)" 스케일로 설정
    const realMin = Math.min(...data.map(d => d.count))
    const realMax = Math.max(...data.map(d => d.count))
    const range = Math.max(realMax - realMin, 0)

    // 모든 데이터가 같은 값인지 확인
    const allSameValue = range === 0

    // 각 데이터를 Δ(차이값)로 변환
    const dataWithDelta = data.map(item => ({
        ...item,
        delta: item.count - realMin,
    }))

    // 차트 데이터는 "과거 -> 최신" 순서로 들어온다고 가정
    // 변화량은 (최신 - 과거) 기준으로 계산
    const oldestCount = data[0]?.count ?? 0
    const newestCount = data[data.length - 1]?.count ?? 0
    const deltaCount = newestCount - oldestCount

    // X축: 최대 10개까지는 화면에 모두 표시, 10개 초과만 가로 스크롤
    const isScrollable = dataWithDelta.length > 10
    const barWidthPx = 28

    return (
        <div className='bg-gray-50 rounded-lg p-3 border border-gray-200'>
            <h4 className='font-medium text-gray-700 mb-3 text-sm pb-2 border-b border-gray-200'>
                {label} 추이
            </h4>
            
            {/* 막대 그래프 영역 */}
            {isScrollable ? (
                <div className='h-48 mb-1 px-2 overflow-x-auto'>
                    <div className='h-full flex items-end gap-1'>
                        {dataWithDelta.map((item, i) => {
                            // Δ 스케일 기준으로 막대 높이 계산
                            const heightPercent = range > 0 ? (item.delta / range) * 100 : 100

                            return (
                                <div
                                    key={i}
                                    className='h-full flex flex-col justify-end items-center group relative shrink-0'
                                    style={{ width: barWidthPx }}
                                >
                                    <div
                                        className={`w-full rounded-t-md transition-all duration-200 ${color} hover:brightness-110 cursor-pointer shadow-sm`}
                                        style={{
                                            height: `${heightPercent}%`,
                                            minHeight: '4px',
                                            minWidth: '8px',
                                        }}
                                    >
                                        {/* 툴팁 */}
                                        <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none'>
                                            <div className='bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg'>
                                                {item.time}
                                                <br />
                                                <span className='font-semibold'>+{formatNumber(item.delta)}</span>
                                                <span className='text-gray-300 text-[10px]'> (총 {formatNumber(item.count)})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div className='h-48 mb-1 px-2'>
                    <div className='h-full flex items-end gap-1'>
                        {dataWithDelta.map((item, i) => {
                            const heightPercent = range > 0 ? (item.delta / range) * 100 : 100

                            return (
                                <div
                                    key={i}
                                    className='h-full flex-1 flex flex-col justify-end items-center group relative'
                                    style={{ minWidth: 28 }}
                                >
                                    <div
                                        className={`w-full rounded-t-md transition-all duration-200 ${color} hover:brightness-110 cursor-pointer shadow-sm`}
                                        style={{
                                            height: `${heightPercent}%`,
                                            minHeight: '4px',
                                        }}
                                    >
                                        {/* 툴팁 */}
                                        <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none'>
                                            <div className='bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg'>
                                                {item.time}
                                                <br />
                                                <span className='font-semibold'>+{formatNumber(item.delta)}</span>
                                                <span className='text-gray-300 text-[10px]'> (총 {formatNumber(item.count)})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            
            {/* X축 날짜 라벨: 리스트 개수만큼 전부 표시 (최대 10개는 화면에 모두 표시) */}
            {isScrollable ? (
                <div className='px-2 overflow-x-auto mb-2'>
                    <div className='flex gap-1 text-[9px] text-gray-400'>
                        {dataWithDelta.map((item, i) => (
                            <div key={i} className='text-center shrink-0' style={{ width: barWidthPx }}>
                                {item.time}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className='px-2 mb-2'>
                    <div className='flex gap-1 text-[9px] text-gray-400'>
                        {dataWithDelta.map((item, i) => (
                            <div key={i} className='text-center flex-1' style={{ minWidth: 28 }}>
                                {item.time}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* 통계 정보 */}
            <div className='flex justify-between text-xs text-gray-500 pt-2'>
                <span>MIN: 0</span>
                <span className='font-medium text-gray-700'>MAX: {formatNumber(range)}</span>
                {allSameValue ? (
                    <span className='text-gray-600 font-medium'>
                        변동 없음
                    </span>
                ) : (
                    <span className='text-green-600 font-medium'>
                        {formatChange(deltaCount)}
                    </span>
                )}
            </div>
            <div className='mt-1 text-[11px] text-gray-400'>
                기준값(최소): {formatNumber(realMin)}
            </div>
        </div>
    )
}

export default function VideoDetailModal({ video, onClose }: VideoDetailModalProps) {
    const [viewHistory, setViewHistory] = useState<ViewHistoryItem[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    // 비디오가 변경될 때마다 조회수 추이 데이터 가져오기
    useEffect(() => {
        if (!video) return

        const controller = new AbortController()
        
        const fetchViewHistory = async () => {
            setIsLoadingHistory(true)
            try {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
                
                if (!apiBaseUrl) {
                    console.error('NEXT_PUBLIC_API_BASE_URL is not defined. Please set it in .env.local')
                    setViewHistory([])
                    setIsLoadingHistory(false)
                    return
                }

                const url = `${apiBaseUrl}/trends/videos/${video.id}/view_history?platform=youtube&limit=30`
                console.log('Fetching view history from:', url)

                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store',
                    signal: controller.signal,
                })

                if (res.ok) {
                    const data = await res.json()
                    const history: ViewHistoryItem[] = data.history || []
                    
                    // 날짜 순서대로 정렬 (오래된 것 -> 최신)
                    const sortedByDate = history.sort((a, b) => {
                        const dateA = new Date(a.snapshot_date).getTime()
                        const dateB = new Date(b.snapshot_date).getTime()
                        return dateA - dateB
                    })
                    
                    console.log('View history loaded:', sortedByDate.length, 'days')
                    if (sortedByDate.length > 0) {
                        console.log('First date:', sortedByDate[0].snapshot_date, 'view_count:', sortedByDate[0].view_count)
                        console.log('Last date:', sortedByDate[sortedByDate.length - 1].snapshot_date, 'view_count:', sortedByDate[sortedByDate.length - 1].view_count)
                    }
                    
                    setViewHistory(sortedByDate)
                } else {
                    const errorText = await res.text().catch(() => '')
                    console.error('Failed to fetch view history:', {
                        status: res.status,
                        statusText: res.statusText,
                        error: errorText,
                        url: res.url
                    })
                    setViewHistory([])
                }
            } catch (error: any) {
                if (error?.name !== 'AbortError') {
                    console.error('Error fetching view history:', error)
                }
                setViewHistory([])
            } finally {
                setIsLoadingHistory(false)
            }
        }

        fetchViewHistory()

        return () => controller.abort()
    }, [video])

    // ESC 키로 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    // 스크롤 방지
    useEffect(() => {
        if (!video) return

        const originalStyle = window.getComputedStyle(document.body).overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = originalStyle
        }
    }, [video])

    if (!video) return null

    return (
        <div
            className='fixed inset-0 z-[100] flex items-center justify-center p-4'
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className='absolute inset-0 bg-black/60 backdrop-blur-sm z-[-1]' />

            {/* Modal */}
            <div
                className='relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className='absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors'
                >
                    <Icon icon='mdi:close' className='text-xl' />
                </button>

                {/* Thumbnail */}
                <div className='relative aspect-video'>
                    <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className='object-cover rounded-t-2xl'
                    />
                    {video.trendingRank && video.trendingRank <= 10 && (
                        <div className='absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg'>
                            <Icon icon='mdi:fire' className='text-xl' />
                            <span className='font-bold'>급등 #{video.trendingRank}</span>
                        </div>
                    )}
                    <div className='absolute bottom-4 right-4 bg-black/80 text-white px-2 py-1 rounded text-sm'>
                        {video.duration}
                    </div>
                </div>

                {/* Content */}
                <div className='p-6'>
                    {/* Title */}
                    <h2 className='text-xl font-bold text-gray-900 mb-3'>{video.title}</h2>

                    {/* Channel & Stats */}
                    <div className='flex flex-wrap items-center gap-4 text-gray-600 text-sm mb-4'>
                        <span className='font-medium'>{video.channelName}</span>
                        <span className='text-gray-300'>|</span>
                        <div className='flex items-center gap-1'>
                            <Icon icon='mdi:eye' />
                            <span>{formatNumber(video.viewCount)}</span>
                            <span className='text-green-500'>{formatChange(video.viewCountChange)}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                            <Icon icon='mdi:thumb-up' />
                            <span>{formatNumber(video.likeCount)}</span>
                            <span className='text-green-500'>{formatChange(video.likeCountChange)}</span>
                        </div>
                        <span className='text-gray-400'>{timeAgo(video.publishedAt)}</span>
                    </div>

                    {/* Trending reason */}
                    {video.trendingReason && (
                        <div className='bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-4'>
                            <div className='flex items-start gap-3'>
                                <div className='p-2 bg-orange-100 rounded-lg'>
                                    <Icon icon='mdi:trending-up' className='text-xl text-orange-600' />
                                </div>
                                <div>
                                    <h3 className='font-semibold text-orange-800 mb-1'>급등 분석</h3>
                                    <p className='text-orange-700 text-sm'>{video.trendingReason}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Charts */}
                    <div className='grid grid-cols-2 gap-4 mb-4'>
                        <SimpleChart 
                            // 리스트 개수만큼 전부 표시, 과거 -> 최신(최신이 맨 뒤)
                            data={viewHistory
                                .map(item => ({
                                    time: new Date(item.snapshot_date).toLocaleDateString('ko-KR', { 
                                        month: 'short', 
                                        day: 'numeric'
                                    }),
                                    count: item.view_count
                                }))}
                            label='조회수' 
                            color='bg-blue-500'
                            isLoading={isLoadingHistory}
                        />
                        <SimpleChart
                            // 리스트 개수만큼 전부 표시, 과거 -> 최신(최신이 맨 뒤)
                            data={viewHistory
                                .map(item => ({
                                    time: new Date(item.snapshot_date).toLocaleDateString('ko-KR', { 
                                        month: 'short', 
                                        day: 'numeric'
                                    }),
                                    count: item.like_count
                                }))}
                            label='좋아요'
                            color='bg-pink-500'
                            isLoading={isLoadingHistory}
                        />
                    </div>

                    {/* Actions */}
                    <div className='flex gap-3'>
                        <a
                            href={`https://youtube.com/watch?v=${video.id}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-600 transition-colors'
                        >
                            <Icon icon='mdi:youtube' />
                            YouTube에서 보기
                        </a>
                        <button
                            onClick={onClose}
                            className='flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors'
                        >
                            <Icon icon='mdi:close' />
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
