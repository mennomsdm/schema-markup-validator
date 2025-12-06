import React, { useState, useRef, useEffect } from 'react';
import { Layout, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { getSchemaAnalysis } from './services/geminiService';
import { SchemaAnalysisResult, AnalysisStatus } from './types';
import ResultDashboard from './components/ResultDashboard';

function App() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.Idle);
  const [result, setResult] = useState<SchemaAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;

    setStatus(AnalysisStatus.Loading);
    setError(null);
    setResult(null);

    try {
      const data = await getSchemaAnalysis(input);
      setResult(data);
      setStatus(AnalysisStatus.Success);
    } catch (err: any) {
      setError(err.message || "Er is iets misgegaan.");
      setStatus(AnalysisStatus.Error);
    }
  };

  useEffect(() => {
    if (status === AnalysisStatus.Success && resultsRef.current) {
      // Small delay to ensure render is complete
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [status]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded flex items-center justify-center shadow-sm">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800">Schema Markup Validator</span>
          </div>
          <div className="flex items-center gap-4">
             <a href="#" className="text-sm font-medium text-slate-500 hover:text-slate-800">Documentatie</a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Structured Data Validatie
          </h1>
          <p className="text-lg text-slate-600">
            Valideer, repareer en optimaliseer je schema markup voor betere SEO resultaten.
          </p>
        </div>

        {/* Input Section - styled like the "Importeer URL" card from screenshot */}
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-800">Importeer Structured Data (Code of URL)</label>
          </div>
          <div className="p-6">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Plak hier je JSON-LD, Microdata of HTML..."
              className="w-full h-48 p-4 font-mono text-sm text-slate-800 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-y placeholder:text-slate-400"
            />
             <div className="mt-4 flex justify-end">
                <button
                onClick={handleAnalyze}
                disabled={status === AnalysisStatus.Loading || !input.trim()}
                className={`flex items-center justify-center px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 border-none
                    ${status === AnalysisStatus.Loading || !input.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-[#FFC107] text-slate-900 hover:bg-[#E5AD06] hover:shadow-md hover:-translate-y-0.5'
                    }`}
                >
                {status === AnalysisStatus.Loading ? (
                    <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Analyseren...
                    </>
                ) : (
                    "Analyseren"
                )}
                </button>
             </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded flex items-start gap-3 text-red-800 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Analyse Mislukt</h4>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Results Area */}
        <div ref={resultsRef}>
          {result && status === AnalysisStatus.Success && (
            <ResultDashboard result={result} />
          )}
        </div>
        
        {status === AnalysisStatus.Idle && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-500 mt-12">
            <div className="p-6 rounded border border-dashed border-slate-300 bg-white text-center">
              <div className="w-10 h-10 mx-auto bg-brand-50 rounded-full flex items-center justify-center mb-3">
                <span className="font-bold text-brand-600">1</span>
              </div>
              <h3 className="font-medium text-slate-900 mb-1">Detectie</h3>
              <p className="text-sm">Herkent automatisch JSON-LD, RDFa en Microdata.</p>
            </div>
            <div className="p-6 rounded border border-dashed border-slate-300 bg-white text-center">
              <div className="w-10 h-10 mx-auto bg-brand-50 rounded-full flex items-center justify-center mb-3">
                 <span className="font-bold text-brand-600">2</span>
              </div>
              <h3 className="font-medium text-slate-900 mb-1">Validatie</h3>
              <p className="text-sm">Controleert strikt volgens de Schema.org standaarden.</p>
            </div>
            <div className="p-6 rounded border border-dashed border-slate-300 bg-white text-center">
              <div className="w-10 h-10 mx-auto bg-brand-50 rounded-full flex items-center justify-center mb-3">
                 <span className="font-bold text-brand-600">3</span>
              </div>
              <h3 className="font-medium text-slate-900 mb-1">Reparatie</h3>
              <p className="text-sm">Genereert direct bruikbare en foutloze code.</p>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Schema Markup Validator. Powered by Gemini 2.5 Flash.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;