import {
  FileCode,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { FileDiffViewer } from "./FileDiffViewer";

interface LineChange {
  oldLineNumber: number | null;
  newLineNumber: number | null;
  type: "addition" | "deletion" | "context";
  content: string;
}

interface AnalysisResultsProps {
  diffSummary: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
  fileChanges: Array<{
    file: string;
    changes: number;
    insertions: number;
    deletions: number;
    diff: string;
    lineChanges: LineChange[];
  }>;
  aiAnalysis: string;
  errorsWarnings: Array<{
    type: string;
    message: string;
    file?: string;
    line?: number;
  }>;
}

export function AnalysisResults({
  diffSummary,
  fileChanges,
  aiAnalysis,
  errorsWarnings,
}: AnalysisResultsProps) {
  const errors = errorsWarnings.filter((item) => item.type === "error");
  const warnings = errorsWarnings.filter((item) => item.type === "warning");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Files Changed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {diffSummary.filesChanged}
              </p>
            </div>
            <FileCode className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Insertions</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                +{diffSummary.insertions}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Deletions</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                -{diffSummary.deletions}
              </p>
            </div>
            <TrendingDown className="w-12 h-12 text-red-500" />
          </div>
        </div>
      </div>

      {(errors.length > 0 || warnings.length > 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Issues Found
          </h3>

          {errors.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h4 className="font-medium text-red-700">
                  Errors ({errors.length})
                </h4>
              </div>
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className="bg-red-50 border-l-4 border-red-500 p-3 rounded"
                  >
                    <p className="text-sm text-red-800">{error.message}</p>
                    {error.file && (
                      <p className="text-xs text-red-600 mt-1">
                        File: {error.file}
                        {error.line && ` (Line ${error.line})`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <h4 className="font-medium text-yellow-700">
                  Warnings ({warnings.length})
                </h4>
              </div>
              <div className="space-y-2">
                {warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded"
                  >
                    <p className="text-sm text-yellow-800">{warning.message}</p>
                    {warning.file && (
                      <p className="text-xs text-yellow-600 mt-1">
                        File: {warning.file}
                        {warning.line && ` (Line ${warning.line})`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileCode className="w-6 h-6 text-gray-700" />
          File Changes with Line Details
        </h3>
        <div className="space-y-3">
          {fileChanges.map((file, index) => (
            <FileDiffViewer
              key={index}
              file={file.file}
              insertions={file.insertions}
              deletions={file.deletions}
              lineChanges={file.lineChanges}
            />
          ))}
        </div>
      </div>

      {aiAnalysis && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            AI Analysis
          </h3>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
              {aiAnalysis}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
