import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import ResultsDashboard from './components/ResultsDashboard';
import { analyzeSurveyData } from './services/geminiService';
import { AnalysisResult, AnalysisStatus } from './types';
import { 
  ArrowPathIcon, 
  DocumentTextIcon, 
  PresentationChartLineIcon,
  QueueListIcon,
  TableCellsIcon,
  QuestionMarkCircleIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';

declare global {
  interface Window {
    XLSX: any;
  }
}

const SAMPLE_QUESTION = "Q1: 您对产品的总体满意度如何？\nQ2: 您最希望我们增加什么功能？\nQ3: 您对我们的定价有什么看法？";

const SAMPLE_DATA = `--- Q1: 您对产品的总体满意度如何？ ---
[用户 1] 非常满意，界面很漂亮，操作也流畅。
[用户 2] 一般般，有时候会卡顿，希望能优化一下性能。
[用户 3] 很差，根本无法登录，客服也没人理。
[用户 4] 挺好的，就是有些功能藏得太深了，找不到。
[用户 5] 还可以，主要用来处理日常工作，够用了。
[用户 6] 极其失望，承诺的功能一个都没有实现。
[用户 7] 我是老用户了，这版更新确实不错，很稳定。
[用户 8] 满意，特别是新的报表导出功能，帮了大忙。

--- Q2: 您最希望我们增加什么功能？ ---
[用户 1] 希望能增加暗黑模式，晚上用眼睛太累。
[用户 2] 需要更多的快捷键支持，提高效率。
[用户 3] 先把登录修好再说吧，功能再多进不去有什么用。
[用户 4] 希望能自定义首页布局，把常用的放前面。
[用户 5] 暂时没啥特别需要的，现有的稳定就好。
[用户 6] 你们承诺的云同步什么时候上线？
[用户 7] 暗黑模式 +1，还有希望能支持 iPad 端。
[用户 8] API 接口希望能开放更多权限。

--- Q3: 您对我们的定价有什么看法？ ---
[用户 1] 价格有点贵，如果有学生优惠就好了。
[用户 2] 稍微偏高，但考虑到功能，还算合理。
[用户 3] 不值这个价，体验太差。
[用户 4] 价格适中，可以接受。
[用户 5] 公司报销，所以我无所谓。
[用户 6] 完全不值，就是圈钱。
[用户 7] 对于专业版来说，这个价格其实很良心。
[用户 8] 性价比很高，比竞品便宜不少。`;

// Optimized Loading View Component to isolate re-renders
const LoadingView: React.FC = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + Math.floor(Math.random() * 10) + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md">
      <div className="h-14 w-14 bg-indigo-100 rounded-full mb-6 mx-auto flex items-center justify-center">
          <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">AI 正在深度分析数据...</h3>
      <p className="text-slate-500 text-sm mb-6">正在构建逻辑模型与用户画像</p>
      
      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="flex justify-between text-xs text-slate-400">
          <span>解析数据</span>
          <span>生成洞察</span>
          <span>构建图表</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Initialize state from LocalStorage if available
  const [inputText, setInputText] = useState(() => localStorage.getItem('survey_input_text') || '');
  const [questionText, setQuestionText] = useState(() => localStorage.getItem('survey_question_text') || '');
  
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'rows_are_questions' | 'rows_are_users' | null>(null);

  // Auto-save input text changes
  useEffect(() => {
    localStorage.setItem('survey_input_text', inputText);
  }, [inputText]);

  // Auto-save question text changes
  useEffect(() => {
    localStorage.setItem('survey_question_text', questionText);
  }, [questionText]);

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim()) {
      setError("请输入一些问卷回复以进行分析。");
      return;
    }

    setStatus(AnalysisStatus.LOADING);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeSurveyData(inputText, questionText);
      setResult(analysis);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err: any) {
      setError(err.message || "分析过程中发生意外错误。");
      setStatus(AnalysisStatus.ERROR);
    }
  }, [inputText, questionText]);

  const loadSampleData = useCallback(() => {
    setInputText(SAMPLE_DATA);
    setQuestionText(SAMPLE_QUESTION);
    setError(null);
  }, []);

  const triggerFileUpload = (type: 'rows_are_questions' | 'rows_are_users') => {
    setUploadType(type);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadType) return;

    setError(null);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = window.XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Read as raw array of arrays to handle indices manually
      const jsonData: any[][] = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error("文件似乎为空或数据不足。");
      }

      let extractedQuestions: string[] = [];
      let formattedResponses = '';

      if (uploadType === 'rows_are_questions') {
        // Structure 1: Row 0 = User IDs, Rows 1..N = Questions
        const userIdsRow = jsonData[0];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          const question = row[0];
          if (question) {
            extractedQuestions.push(question);
            const qNum = extractedQuestions.length;
            formattedResponses += `--- Q${qNum}: ${question} ---\n`;
            for (let j = 1; j < row.length; j++) {
              const answer = row[j];
              if (answer !== undefined && answer !== null && answer !== '') {
                let userId = (userIdsRow && userIdsRow[j] !== undefined && userIdsRow[j] !== null) 
                  ? String(userIdsRow[j]) 
                  : window.XLSX.utils.encode_cell({r: 0, c: j});
                formattedResponses += `[${userId}] ${answer}\n`;
              }
            }
            formattedResponses += '\n';
          }
        }
      } else {
        // Structure 2: Row 0 = Header (Questions start Col 1), Rows 1..N = Users
        const headerRow = jsonData[0];
        if (!headerRow || headerRow.length < 2) throw new Error("文件格式要求第一行包含问题（从 B 列开始）。");

        const questionIndices: number[] = [];
        for (let col = 1; col < headerRow.length; col++) {
          const qText = headerRow[col];
          if (qText) {
            questionIndices.push(col);
            extractedQuestions.push(qText);
          }
        }

        if (questionIndices.length === 0) throw new Error("未在第一行（B列及之后）发现问题。");

        questionIndices.forEach((colIdx, index) => {
          const qText = headerRow[colIdx];
          const qNum = index + 1;
          formattedResponses += `--- Q${qNum}: ${qText} ---\n`;
          for (let rowIdx = 1; rowIdx < jsonData.length; rowIdx++) {
            const row = jsonData[rowIdx];
            if (row && row[colIdx] !== undefined && row[colIdx] !== null && row[colIdx] !== '') {
              let userId = (row[0] !== undefined && row[0] !== null)
                ? String(row[0])
                : window.XLSX.utils.encode_cell({r: rowIdx, c: 0});
              formattedResponses += `[${userId}] ${row[colIdx]}\n`;
            }
          }
          formattedResponses += '\n';
        });
      }

      if (!formattedResponses.trim()) throw new Error("无法提取有效回复。请检查文件格式。");

      setInputText(formattedResponses);
      setQuestionText(extractedQuestions.map((q, i) => `Q${i+1}: ${q}`).join('\n'));

    } catch (err: any) {
      console.error(err);
      setError(`文件处理失败: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadType(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-grow w-full max-w-[95%] 2xl:max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* Left Column: Input Area */}
          <div className="xl:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-900">输入数据</h2>
                <div className="flex items-center space-x-2">
                  {/* Clear Cache Button */}
                  {(inputText || questionText) && (
                    <button 
                      onClick={() => { 
                        if(window.confirm('确定要清空所有内容吗？')) {
                          setInputText(''); 
                          setQuestionText('');
                          localStorage.removeItem('survey_input_text');
                          localStorage.removeItem('survey_question_text');
                        }
                      }} 
                      className="text-xs text-slate-400 hover:text-red-500 underline mr-2"
                    >
                      清空
                    </button>
                  )}
                  <button onClick={loadSampleData} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center transition-colors">
                    <DocumentTextIcon className="h-4 w-4 mr-1" /> 加载示例
                  </button>
                </div>
              </div>
              
              <div className="mb-6 p-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">导入文件 (CSV/Excel)</div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => triggerFileUpload('rows_are_questions')} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
                    <QueueListIcon className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 mb-2" />
                    <span className="text-sm text-center text-slate-600 font-medium">结构一<br/><span className="text-[10px] text-slate-400 font-normal">(行 = 问题)</span></span>
                  </button>
                  <button onClick={() => triggerFileUpload('rows_are_users')} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all group">
                    <TableCellsIcon className="h-6 w-6 text-slate-400 group-hover:text-indigo-600 mb-2" />
                    <span className="text-sm text-center text-slate-600 font-medium">结构二<br/><span className="text-[10px] text-slate-400 font-normal">(行 = 用户)</span></span>
                  </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv, .xlsx, .xls" className="hidden" />
              </div>

              <div className="mb-6">
                <label htmlFor="survey-question" className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                  <QuestionMarkCircleIcon className="h-4 w-4 mr-1 text-indigo-500" /> 问卷题目 <span className="text-slate-400 font-normal ml-1">(选填)</span>
                </label>
                <textarea id="survey-question" value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Q1: ... &#10;Q2: ..." className="w-full h-24 p-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm transition-all" />
              </div>

              <div className="relative mb-6">
                <label htmlFor="survey-input" className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                  <ChatBubbleBottomCenterTextIcon className="h-4 w-4 mr-1 text-indigo-500" /> 问卷回答
                </label>
                <div className="relative">
                  <textarea id="survey-input" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={`在此粘贴回复...`} className="w-full h-64 p-4 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm leading-relaxed transition-all font-mono text-xs" />
                  <div className="absolute bottom-3 right-3 text-xs text-slate-400 pointer-events-none">{inputText.length} 字符</div>
                </div>
              </div>

              <div>
                <button onClick={handleAnalyze} disabled={status === AnalysisStatus.LOADING || !inputText.trim()} className={`w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${(status === AnalysisStatus.LOADING || !inputText.trim()) ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99]'}`}>
                  {status === AnalysisStatus.LOADING ? (
                    <><ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" /> 分析中...</>
                  ) : "开始分析"}
                </button>
              </div>
              {error && <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">{error}</div>}
            </div>
          </div>

          {/* Right Column: Results Area */}
          <div className="xl:col-span-8">
            {status === AnalysisStatus.SUCCESS && result ? (
              <ResultsDashboard data={result} />
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center relative overflow-hidden">
                {status === AnalysisStatus.LOADING ? (
                  <LoadingView />
                ) : (
                  <>
                    <div className="bg-slate-50 p-5 rounded-full mb-5">
                      <PresentationChartLineIcon className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-medium text-slate-900">准备就绪</h3>
                    <p className="mt-2 text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">请在左侧粘贴问卷数据或导入 CSV/Excel 文件，然后点击“开始分析”。</p>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;