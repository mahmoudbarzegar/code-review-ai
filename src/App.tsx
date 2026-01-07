import { useState } from "react";
import { AnalysisForm } from "./components/AnalysisForm";
import { AnalysisResults } from "./components/AnalysisResults";
import { History } from "lucide-react";

interface LineChange {
  oldLineNumber: number | null;
  newLineNumber: number | null;
  type: "addition" | "deletion" | "context";
  content: string;
}

interface AnalysisData {
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

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (formData: {
    projectPath: string;
    mainBranch: string;
    featureBranch: string;
    ollamaUrl: string;
    ollamaModel: string;
    excludedFolders: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    setAnalysisData(null);

    try {
      const response = await fetch("http://localhost:3001/api/analyze-branch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectPath: formData.projectPath,
          mainBranch: formData.mainBranch,
          featureBranch: formData.featureBranch,
          ollamaUrl: formData.ollamaUrl,
          ollamaModel: formData.ollamaModel,
          excludedFolders: formData.excludedFolders,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setAnalysisData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Git Branch Analyzer
            </h1>
            <p className="text-gray-600">
              Compare branches and get AI-powered insights with Ollama
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <AnalysisForm onAnalyze={handleAnalyze} isLoading={isLoading} />

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <History className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Setup Requirements:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Install Ollama locally</li>
                      <li>Pull a model (e.g., llama2)</li>
                      <li>Ensure Ollama is running</li>
                      <li>Provide valid git repository path</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              )}

              {analysisData && (
                <AnalysisResults
                  diffSummary={analysisData.diffSummary}
                  fileChanges={analysisData.fileChanges}
                  aiAnalysis={analysisData.aiAnalysis}
                  errorsWarnings={analysisData.errorsWarnings}
                />
              )}

              {!analysisData && !error && !isLoading && (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Enter your project details and click "Analyze Branches" to
                    get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
