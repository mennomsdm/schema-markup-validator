import React, { useState } from 'react';
import { SchemaAnalysisResult, SchemaIssue, ValidationSeverity } from '../types';
import ScoreGauge from './ScoreGauge';
import { 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle, 
  Code, 
  FileJson, 
  Copy, 
  Check 
} from 'lucide-react';

interface ResultDashboardProps {
  result: SchemaAnalysisResult;
}

const ResultDashboard: React.FC<ResultDashboardProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result.correctedJsonLd, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to detect if an issue is an "improvement opportunity" (missing recommended fields)
  // regardless of the severity assigned by Gemini (which might be Info).
  const isImprovement = (issue: SchemaIssue) => {
    return issue.severity === ValidationSeverity.Warning || 
           (issue.message.toLowerCase().includes('ontbreekt') || 
            issue.message.toLowerCase().includes('aanbevolen'));
  };

  const getSeverityIcon = (issue: SchemaIssue) => {
    if (issue.severity === ValidationSeverity.Error) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    if (isImprovement(issue)) {
      return <AlertTriangle className="w-5 h-5 text-amber-500" />; // Orange/Yellow warning icon
    }
    // Success/Info
    return <CheckCircle className="w-5 h-5 text-brand-500" />;
  };

  const getSeverityClass = (issue: SchemaIssue) => {
    if (issue.severity === ValidationSeverity.Error) {
      return 'bg-red-50 border-red-100 text-red-900';
    }
    if (isImprovement(issue)) {
      // "Disclaimer" style: Light yellow background, orange/gold border, brown/orange text
      return 'bg-[#fffbeb] border-[#fcd34d] text-[#92400e]';
    }
    // Default Purple (Info/Success)
    return 'bg-brand-50 border-brand-100 text-brand-900';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section: Score & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded border border-slate-200 p-6 flex items-center justify-center md:col-span-1 shadow-sm">
          <ScoreGauge score={result.healthScore} />
        </div>
        
        <div className="bg-white rounded border border-slate-200 p-6 md:col-span-2 flex flex-col justify-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <FileJson className="w-5 h-5 text-brand-600" />
            Analyse Samenvatting
          </h2>
          <p className="text-slate-600 leading-relaxed">{result.summary}</p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {result.detectedTypes.map((type, idx) => (
              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-brand-100 text-brand-800 border border-brand-200">
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Issues */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Validatie Rapport</h3>
          <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
            {result.issues.length} meldingen
          </span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {result.issues.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <CheckCircle className="w-12 h-12 text-brand-500 mx-auto mb-3" />
              <p className="font-medium">Geen problemen gevonden. Uitstekend!</p>
            </div>
          ) : (
            result.issues.map((issue, idx) => (
              <div key={idx} className={`p-4 flex gap-4 ${getSeverityClass(issue)} border-l-4 ${issue.severity === ValidationSeverity.Error ? 'border-l-red-500' : isImprovement(issue) ? 'border-l-[#f59e0b]' : 'border-l-brand-400'}`}>
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon(issue)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="uppercase text-[10px] font-bold tracking-wider opacity-80 border border-current px-1 rounded">
                      {issue.type}
                    </span>
                    {issue.entity && (
                      <span className="text-xs font-semibold opacity-90">
                        {issue.entity}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium">{issue.message}</p>
                  {issue.property && (
                    <p className="text-xs mt-1 opacity-75">Eigenschap: <code>{issue.property}</code></p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Entity Breakdown */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Entiteit Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {result.entities.map((entity, idx) => (
            <div key={idx} className="border border-slate-200 rounded p-4 hover:border-brand-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-slate-800">{entity.type}</span>
              </div>
              
              <div className="space-y-3">
                {entity.missingRequired.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-red-600 block mb-1">Ontbrekend Verplicht</span>
                    <div className="flex flex-wrap gap-1">
                      {entity.missingRequired.map(prop => (
                        <span key={prop} className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">{prop}</span>
                      ))}
                    </div>
                  </div>
                )}
                 {entity.missingRecommended.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-[#92400e] block mb-1">Aanbevolen</span>
                    <div className="flex flex-wrap gap-1">
                      {entity.missingRecommended.map(prop => (
                        <span key={prop} className="text-[10px] bg-[#fffbeb] text-[#92400e] px-1.5 py-0.5 rounded border border-[#fcd34d]">{prop}</span>
                      ))}
                    </div>
                  </div>
                )}
                 <div>
                    <span className="text-xs font-semibold text-brand-600 block mb-1">Aanwezig</span>
                    <div className="flex flex-wrap gap-1">
                      {entity.propertiesFound.slice(0, 5).map(prop => (
                         <span key={prop} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{prop}</span>
                      ))}
                      {entity.propertiesFound.length > 5 && (
                        <span className="text-[10px] text-slate-400 pl-1">+{entity.propertiesFound.length - 5} meer</span>
                      )}
                    </div>
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Corrected JSON-LD Output */}
      <div className="rounded shadow-lg overflow-hidden border border-slate-800 bg-[#0E172A]">
        <div className="flex items-center justify-between px-4 py-3 bg-[#020617] border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-slate-300">Gecorrigeerde JSON-LD</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-transparent border border-slate-600 rounded hover:bg-slate-800 hover:border-slate-500 hover:text-white transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Gekopieerd!' : 'Kopieer'}
          </button>
        </div>
        <div className="relative group bg-[#0E172A]">
          <pre className="p-4 overflow-x-auto custom-scrollbar text-sm text-slate-300 font-mono leading-relaxed max-h-[500px] bg-[#0E172A]">
            {JSON.stringify(result.correctedJsonLd, null, 2)}
          </pre>
        </div>
      </div>

    </div>
  );
};

export default ResultDashboard;