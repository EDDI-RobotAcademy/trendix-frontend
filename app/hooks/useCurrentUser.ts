'use client';

import { useEffect, useState } from 'react';
import type { UserInfo } from '@/types/userInfo';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * 현재 로그인한 사용자 정보를 가져오는 클라이언트 훅
 */
export function useCurrentUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        // 세션 상태 확인
        const statusRes = await fetch(`${API_BASE_URL}/authentication/status`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!statusRes.ok) {
          setUser(null);
          return;
        }

        const statusResult = await statusRes.json();

        if (statusResult.logged_in === false) {
          setUser(null);
          return;
        }

        // 사용자 정보 가져오기
        const userInfoRes = await fetch(
          `${API_BASE_URL}/accounts/${statusResult.user_id}`,
          {
            credentials: 'include',
            cache: 'no-store',
          }
        );

        if (!userInfoRes.ok) {
          setUser(null);
          return;
        }

        const userInfo: UserInfo = await userInfoRes.json();
        userInfo.logged_in = true;
        setUser(userInfo);
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading };
}
