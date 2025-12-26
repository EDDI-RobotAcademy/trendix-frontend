'use client';

import React, { useState } from 'react';
import Info from './Detail/Info';
import { useInterestList } from '@/context/InterestContext';
import { InterestType } from '@/types/interestType';
import { useAuth } from '@/contexts/AuthContext';
import { deleteInterest } from '@/app/actions/deleteInterest';
import { insertInterest } from '@/app/actions/insertInterest';
import { useRouter } from 'next/navigation';


interface UserInterest {
    id: string;
    name: string;
}

interface UserChannel {
    id: string;
    platform: 'YouTube' | 'Instagram' | 'TikTok' | 'Twitter';
    isConnected: boolean;
    handle?: string; // e.g., @username
}

const INITIAL_CHANNELS: UserChannel[] = [
    { id: '1', platform: 'YouTube', isConnected: true, handle: 'hong_tv' },
    { id: '2', platform: 'Instagram', isConnected: false },
    { id: '3', platform: 'TikTok', isConnected: false },
    { id: '4', platform: 'Twitter', isConnected: true, handle: 'hong_tw' },
];

export default function UserDetail() {
    // --- State ---
    const router = useRouter();
    const { interestList } = useInterestList();
    const { interests, userId } = useAuth();

    const [channels, setChannels] = useState<UserChannel[]>(INITIAL_CHANNELS);
    const [selectedInterest, setSelectedInterest] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter interests based on search term
    const filteredInterests = interestList
        .filter(item => !interests?.some(userInterest => userInterest.interest === item.category))
        .filter(item => item.category.toLowerCase().includes(searchTerm.toLowerCase()));

    // Interests
    const handleAddInterest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInterest || isSubmitting) return;

        // Check if already exists
        if (interests?.some(item => item.interest === selectedInterest)) {
            setErrorMessage('이미 추가된 관심사입니다.');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        setIsSubmitting(true);
        await insertInterest(selectedInterest, userId);
        setSelectedInterest('');
        setSearchTerm('');
        setIsDropdownOpen(false);
        setErrorMessage('');
        setIsSubmitting(false);
        router.refresh(); // Refresh to get updated data from server
    };

    const handleSelectInterest = (category: string) => {
        setSelectedInterest(category);
        setSearchTerm(category);
        setIsDropdownOpen(false);
    };

    const handleRemoveInterest = async (id: string) => {
        setIsSubmitting(true);
        await deleteInterest(id, userId);
        setIsSubmitting(false);
        router.refresh(); // Refresh to get updated data from server
    };

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('form')) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Channels
    const toggleChannelConnection = (id: string) => {
        setChannels(
            channels.map((channel) =>
                channel.id === id ? { ...channel, isConnected: !channel.isConnected } : channel
            )
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 overflow-hidden space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">내 정보 관리</h1>

            {/* --- Section 1: Basic Information --- */}
            <Info />

            {/* --- Section 2: Interests --- */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">관심사</h2>
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {interests && interests.map((interest) => (
                            <div
                                key={interest.id}
                                className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100"
                            >
                                <span>{interest.interest}</span>
                                <button
                                    onClick={() => handleRemoveInterest(interest.id)}
                                    className="ml-2 p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {errorMessage && (
                        <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleAddInterest} className="flex gap-2 max-w-md">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setIsDropdownOpen(true);
                                    setSelectedInterest('');
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                placeholder="관심사를 검색하세요..."
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />

                            {isDropdownOpen && filteredInterests.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {filteredInterests.map((interest) => (
                                        <button
                                            key={interest.category}
                                            type="button"
                                            onClick={() => handleSelectInterest(interest.category)}
                                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm transition-colors"
                                        >
                                            {interest.category}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {isDropdownOpen && searchTerm && filteredInterests.length === 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-500">
                                    검색 결과가 없습니다.
                                </div>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={!selectedInterest || isSubmitting}
                            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? '추가 중...' : '추가'}
                        </button>
                    </form>
                </div>
            </section>

            {/* --- Section 3: Channel Integration --- */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">채널 연동</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {channels.map((channel) => (
                        <div
                            key={channel.id}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${channel.isConnected
                                ? 'border-blue-200 bg-blue-50/30'
                                : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${channel.platform === 'YouTube' ? 'bg-red-100 text-red-600' :
                                    channel.platform === 'Instagram' ? 'bg-pink-100 text-pink-600' :
                                        channel.platform === 'TikTok' ? 'bg-black text-white' :
                                            'bg-blue-100 text-blue-500' // Twitter/Default
                                    }`}>
                                    {/* Simple Icons based on platform */}
                                    {channel.platform === 'YouTube' && "Y"}
                                    {channel.platform === 'Instagram' && "I"}
                                    {channel.platform === 'TikTok' && "T"}
                                    {channel.platform === 'Twitter' && "X"}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{channel.platform}</h3>
                                    {channel.isConnected ? (
                                        <p className="text-xs text-blue-600 font-medium">연동됨 ({channel.handle})</p>
                                    ) : (
                                        <p className="text-xs text-gray-400">연동되지 않음</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => toggleChannelConnection(channel.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${channel.isConnected
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : 'border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'
                                    }`}
                            >
                                {channel.isConnected ? '해제' : '연동'}
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}