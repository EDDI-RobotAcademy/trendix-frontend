'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Icon } from '@iconify/react/dist/iconify.js'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

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

// 차트용 데이터 변환 - 조회수와 좋아요를 하나의 객체로 결합
function formatSnapshotForChart(snapshots: SnapshotData[]) {
    return snapshots.map(snapshot => ({
        date: new Date(snapshot.snapshot_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        조회수: snapshot.view_count || 0,
        좋아요: snapshot.like_count || 0,
        댓글: snapshot.comment_count || 0
    }))
}

// 커스텀 툴팁 컴포넌트
function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className='bg-gray-800 text-white p-3 rounded-lg shadow-lg'>
                <p className='font-semibold mb-2'>{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }} className='text-sm'>
                        {entry.name}: {formatNumber(entry.value)}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

function TrendLineChart({ data }: { data: any[] }) {
    if (!data.length) return null

    return (
        <div className='bg-gray-50 rounded-lg p-4'>
            <h4 className='font-medium text-gray-700 mb-3 text-sm'>7일간 추이</h4>
            <ResponsiveContainer width='100%' height={300}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
                    <XAxis
                        dataKey='date'
                        tick={{ fontSize: 12 }}
                        stroke='#666'
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatNumber(value)}
                        stroke='#666'
                        yAxisId='left'
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatNumber(value)}
                        stroke='#666'
                        orientation='right'
                        yAxisId='right'
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ fontSize: '14px' }}
                        iconType='line'
                    />
                    <Line
                        type='monotone'
                        dataKey='조회수'
                        stroke='#3b82f6'
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                        yAxisId='left'
                    />
                    <Line
                        type='monotone'
                        dataKey='좋아요'
                        stroke='#ec4899'
                        strokeWidth={3}
                        dot={{ fill: '#ec4899', r: 4 }}
                        activeDot={{ r: 6 }}
                        yAxisId='right'
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* 통계 정보 */}
            <div className='grid grid-cols-2 gap-4 mt-4'>
                <div className='bg-blue-50 rounded-lg p-3'>
                    <div className='flex items-center gap-2 mb-2'>
                        <div className='w-3 h-3 rounded-full bg-blue-500'></div>
                        <span className='text-sm font-medium text-gray-700'>조회수</span>
                    </div>
                    <div className='text-xs text-gray-600 space-y-1'>
                        <div className='flex justify-between'>
                            <span>시작:</span>
                            <span className='font-medium'>{formatNumber(data[0]?.조회수 || 0)}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>현재:</span>
                            <span className='font-medium'>{formatNumber(data[data.length - 1]?.조회수 || 0)}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>증가:</span>
                            <span className={`font-bold ${
                                (data[data.length - 1]?.조회수 || 0) > (data[0]?.조회수 || 0) ? 'text-green-600' : 'text-gray-500'
                            }`}>
                                +{formatNumber((data[data.length - 1]?.조회수 || 0) - (data[0]?.조회수 || 0))}
                            </span>
                        </div>
                    </div>
                </div>
                <div className='bg-pink-50 rounded-lg p-3'>
                    <div className='flex items-center gap-2 mb-2'>
                        <div className='w-3 h-3 rounded-full bg-pink-500'></div>
                        <span className='text-sm font-medium text-gray-700'>좋아요</span>
                    </div>
                    <div className='text-xs text-gray-600 space-y-1'>
                        <div className='flex justify-between'>
                            <span>시작:</span>
                            <span className='font-medium'>{formatNumber(data[0]?.좋아요 || 0)}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>현재:</span>
                            <span className='font-medium'>{formatNumber(data[data.length - 1]?.좋아요 || 0)}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>증가:</span>
                            <span className={`font-bold ${
                                (data[data.length - 1]?.좋아요 || 0) > (data[0]?.좋아요 || 0) ? 'text-green-600' : 'text-gray-500'
                            }`}>
                                +{formatNumber((data[data.length - 1]?.좋아요 || 0) - (data[0]?.좋아요 || 0))}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function VideoDetailModal({ video, onClose }: VideoDetailModalProps) {
    const [snapshotHistory, setSnapshotHistory] = useState<SnapshotData[]>([])
    const [loading, setLoading] = useState<boolean>(false)

    // 스냅샷 히스토리 데이터 가져오기
    useEffect(() => {
        if (!video?.id) {
            setSnapshotHistory([])
            return
        }

        // 영상이 바뀔 때마다 이전 데이터 초기화
        setSnapshotHistory([])
        setLoading(true)

        const fetchHistory = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/trends/videos/${video.id}/history?days=7`)
                if (response.ok) {
                    const data: VideoHistoryResponse = await response.json()
                    setSnapshotHistory(data.items || [])
                } else {
                    console.error('Failed to fetch video history:', response.status)
                    setSnapshotHistory([])
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
                    <div className='mb-4'>
                        {loading ? (
                            <div className='flex justify-center items-center h-20 text-gray-500'>
                                차트 데이터를 불러오는 중...
                            </div>
                        ) : snapshotHistory.length > 0 ? (
                            <TrendLineChart data={formatSnapshotForChart(snapshotHistory)} />
                        ) : (
                            <div className='flex justify-center items-center h-20 text-gray-500'>
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
