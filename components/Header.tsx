import React from 'react';
import { PresentationChartLineIcon } from '@heroicons/react/24/outline';

const Header: React.FC = React.memo(() => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-[95%] 2xl:max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <PresentationChartLineIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">问卷洞察 AI</h1>
            <p className="text-xs text-slate-500">开放式问卷智能分析助手</p>
          </div>
        </div>
        <div className="hidden md:block">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
            由 Gemini 2.5 Flash 驱动
          </span>
        </div>
      </div>
    </header>
  );
});

export default Header;