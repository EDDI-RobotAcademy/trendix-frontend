'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchDashboardLayout, saveDashboardLayout } from '@/app/lib/api/dashboard';

// 위젯 타입 정의
interface Widget {
  i: string;
  type: string;
  name: string;
}

// react-grid-layout 타입
type LayoutItem = any;
type Layouts = Record<string, LayoutItem[]>;

/**
 * 대시보드 레이아웃 관리 훅 (Application Layer)
 * - 비즈니스 로직을 캡슐화
 * - localStorage와 API 간 마이그레이션 처리
 */
export function useDashboardLayout(accountId: string | null) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layouts, setLayouts] = useState<Layouts>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 레이아웃 불러오기
  useEffect(() => {
    async function loadLayout() {
      setLoading(true);
      try {
        if (accountId) {
          // 로그인한 경우: API에서만 불러오기 (localStorage 무시)
          const data = await fetchDashboardLayout(accountId);
          setWidgets(data.widgets || []);
          setLayouts(data.layouts || {});
        } else {
          // 비로그인 상태: localStorage 사용
          const localData = loadFromLocalStorage();
          if (localData) {
            setWidgets(localData.widgets);
            setLayouts(localData.layouts);
          } else {
            // localStorage에 데이터가 없으면 빈 배열로 시작
            setWidgets([]);
            setLayouts({});
          }
        }
      } catch (error) {
        console.error('레이아웃 로딩 실패:', error);
        if (accountId) {
          // 로그인한 경우: 에러 시에도 빈 배열 (localStorage 사용 안 함)
          setWidgets([]);
          setLayouts({});
        } else {
          // 비로그인 상태: localStorage 폴백
          const localData = loadFromLocalStorage();
          if (localData) {
            setWidgets(localData.widgets);
            setLayouts(localData.layouts);
          } else {
            setWidgets([]);
            setLayouts({});
          }
        }
      } finally {
        setLoading(false);
      }
    }

    loadLayout();
  }, [accountId]);

  // 레이아웃 저장
  const saveLayout = useCallback(async (newWidgets: Widget[], newLayouts: Layouts) => {
    setSaving(true);
    try {
      if (accountId) {
        // 로그인한 경우: API로 저장
        await saveDashboardLayout(accountId, newWidgets, newLayouts);
      } else {
        // 비로그인 상태: localStorage에 저장
        saveToLocalStorage(newWidgets, newLayouts);
      }
      setWidgets(newWidgets);
      setLayouts(newLayouts);
    } catch (error) {
      console.error('레이아웃 저장 실패:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [accountId]);

  return {
    widgets,
    layouts,
    loading,
    saving,
    setWidgets,
    setLayouts,
    saveLayout,
  };
}

// localStorage 헬퍼 함수들
function loadFromLocalStorage(): { widgets: Widget[]; layouts: Layouts } | null {
  try {
    const widgets = JSON.parse(localStorage.getItem('dashboard_widgets_v2') || 'null');
    const layouts = JSON.parse(localStorage.getItem('dashboard_layouts_v2') || 'null');

    if (widgets && layouts && widgets.length > 0) {
      return { widgets, layouts };
    }
  } catch (error) {
    console.error('localStorage 읽기 실패:', error);
  }
  return null;
}

function saveToLocalStorage(widgets: Widget[], layouts: Layouts) {
  try {
    localStorage.setItem('dashboard_widgets_v2', JSON.stringify(widgets));
    localStorage.setItem('dashboard_layouts_v2', JSON.stringify(layouts));
  } catch (error) {
    console.error('localStorage 저장 실패:', error);
  }
}
