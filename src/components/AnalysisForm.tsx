import { useState } from "react";
import { GitBranch, Loader2 } from "lucide-react";

interface AnalysisFormProps {
  onAnalyze: (data: {
    projectPath: string;
    mainBranch: string;
    featureBranch: string;
    ollamaUrl: string;
    ollamaModel: string;
    excludedFolders: string[];
  }) => void;
  isLoading: boolean;
}

export function AnalysisForm({ onAnalyze, isLoading }: AnalysisFormProps) {
  const [projectPath, setProjectPath] = useState("");
  const [mainBranch, setMainBranch] = useState("main");
  const [featureBranch, setFeatureBranch] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama2");
  const [excludedFolders, setExcludedFolders] = useState(
    import.meta.env.VITE_EXCLUDED_FOLDERS ||
      "node_modules,dist,.git,.next,build,.venv,__pycache__,.env",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const excludes = excludedFolders
      .split(",")
      .map((f: string) => f.trim())
      .filter((f: string) => f.length > 0);

    onAnalyze({
      projectPath,
      mainBranch,
      featureBranch,
      ollamaUrl,
      ollamaModel,
      excludedFolders: excludes,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <GitBranch className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Branch Analyzer</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Path
          </label>
          <input
            type="text"
            value={projectPath}
            onChange={(e) => setProjectPath(e.target.value)}
            placeholder="/path/to/your/project"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Full path to your git repository
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Main Branch
            </label>
            <input
              type="text"
              value={mainBranch}
              onChange={(e) => setMainBranch(e.target.value)}
              placeholder="main"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feature Branch
            </label>
            <input
              type="text"
              value={featureBranch}
              onChange={(e) => setFeatureBranch(e.target.value)}
              placeholder="feature/new-feature"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Exclude Folders
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Folders to Exclude (comma-separated)
            </label>
            <textarea
              value={excludedFolders}
              onChange={(e) => setExcludedFolders(e.target.value)}
              placeholder="node_modules,dist,.git"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={2}
            />
            <p className="mt-1 text-xs text-gray-500">
              Folders to skip during analysis (e.g., dependencies, build output)
            </p>
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Ollama Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ollama API URL
              </label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Default works for local Ollama installation
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model Name
              </label>
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                placeholder="llama2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Use any model available in your Ollama (e.g., llama2, codellama,
                mistral)
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Branches"
          )}
        </button>
      </form>
    </div>
  );
}
