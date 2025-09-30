// app/offline/page.tsx
'use client';
import React from 'react';

export default function Offline() {
  return (
    <div className="min-h-dvh flex items-center justify-center text-center p-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">오프라인 상태입니다</h1>
        <p>네트워크 연결 후 다시 시도해주세요.</p>
      </div>
    </div>
  );
}
