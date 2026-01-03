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

// 스냅샷 히스토리 데이터 타입
interface SnapshotData {
    snapshot_date: string
    view_count: number
    like_count: number
    comment_count: number
    daily_view_increase: number
    daily_like_increase: number
    daily_comment_increase: number
}

// API 응답 타입
interface VideoHistoryResponse {
    video_id: string
    items: SnapshotData[]
}

// 차트용 데이터 변환
function formatSnapshotForChart(snapshots: SnapshotData[], metric: 'view_count' | 'like_count' | 'comment_count') {
    return snapshots.map(snapshot => ({
        time: new Date(snapshot.snapshot_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        count: snapshot[metric] || 0
    }))
}

function SimpleChart({ data, label, color }: { data: { time: string; count: number }[], label: string, color: string }) {
    if (!data.length) return null
    
    const maxCount = Math.max(...data.map(d => d.count))
    const minCount = Math.min(...data.map(d => d.count))
    const avgCount = data.reduce((sum, d) => sum + d.count, 0) / data.length
    const hasVariation = maxCount !== minCount
    
    // 평균값이 차트 중간(50%)에 오도록 범위 계산
    let chartMin: number, chartMax: number
    
    if (hasVariation) {
        const range = maxCount - minCount
        // 평균값을 중심으로 위아래 확장
        const avgToMax = maxCount - avgCount
        const avgToMin = avgCount - minCount
        const maxRange = Math.max(avgToMax, avgToMin) * 2
        
        chartMin = Math.max(0, avgCount - maxRange / 2)
        chartMax = avgCount + maxRange / 2
    } else {
        // 변화가 없는 경우 평균값 기준으로 약간의 범위 설정
        chartMin = avgCount * 0.95
        chartMax = avgCount * 1.05
    }

    return (
        <div className='bg-gray-50 rounded-lg p-3'>
            <h4 className='font-medium text-gray-700 mb-3 text-sm'>{label} 추이</h4>
            <div className='flex items-end h-20 relative'>
                {/* 평균선 표시 (중간 50% 위치) */}
                <div className='absolute left-0 right-0 border-b border-gray-300 border-dashed opacity-50' 
                     style={{ bottom: '50%' }}
                     title={`평균: ${formatNumber(Math.round(avgCount))}`}
                />
                {data.map((item, i) => {
                    // 평균값이 50% 위치에 오도록 높이 계산
                    const normalizedValue = (item.count - chartMin) / (chartMax - chartMin)
                    const height = Math.max(2, normalizedValue * 100)
                    
                    return (
                        <div key={i} className='flex-1 relative'>
                            <div
                                className={`w-full ${color} transition-all duration-300`}
                                style={{ height: `${height}%`, minHeight: '2px' }}
                                title={`${item.time}: ${formatNumber(item.count)}`}
                            />
                        </div>
                    )
                })}
            </div>
            <div className='flex justify-between mt-2 text-xs text-gray-500'>
                <span>{formatNumber(data[0]?.count || 0)}</span>
                <span className={`font-medium ${
                    data[data.length - 1]?.count > data[0]?.count ? 'text-green-600' : 
                    data[data.length - 1]?.count < data[0]?.count ? 'text-red-600' : 
                    'text-gray-500'
                }`}>
                    {data.length >= 2 ? (
                        (data[data.length - 1]?.count - data[0]?.count) >= 0 ? 
                        `+${formatNumber(data[data.length - 1]?.count - data[0]?.count)}` :
                        formatNumber(data[data.length - 1]?.count - data[0]?.count)
                    ) : '변화없음'}
                </span>
                <span>{formatNumber(data[data.length - 1]?.count || 0)}</span>
            </div>
        </div>
    )
}

export default function VideoDetailModal({ video, onClose }: VideoDetailModalProps) {
    const [snapshotHistory, setSnapshotHistory] = useState<SnapshotData[]>([])
    const [loading, setLoading] = useState<boolean>(false)

    // 스냅샷 히스토리 데이터 가져오기
    useEffect(() => {
        if (!video?.id) return

        const fetchHistory = async () => {
            setLoading(true)
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/trends/videos/${video.id}/history?days=7`)
                if (response.ok) {
                    const data: VideoHistoryResponse = await response.json()
                    setSnapshotHistory(data.items || [])
                }
            } catch (error) {
                console.error('Failed to fetch video history:', error)
                setSnapshotHistory([])
            } finally {
                setLoading(false)
            }
        }

        fetchHistory()
    }, [video?.id])

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
                        {loading ? (
                            <div className='col-span-2 flex justify-center items-center h-20 text-gray-500'>
                                차트 데이터를 불러오는 중...
                            </div>
                        ) : snapshotHistory.length > 0 ? (
                            <>
                                <SimpleChart 
                                    data={formatSnapshotForChart(snapshotHistory, 'view_count')} 
                                    label='조회수' 
                                    color='bg-blue-500' 
                                />
                                <SimpleChart 
                                    data={formatSnapshotForChart(snapshotHistory, 'like_count')} 
                                    label='좋아요' 
                                    color='bg-pink-500' 
                                />
                            </>
                        ) : (
                            <div className='col-span-2 flex justify-center items-center h-20 text-gray-500'>
                                차트 데이터가 없습니다
                            </div>
                        )}
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
