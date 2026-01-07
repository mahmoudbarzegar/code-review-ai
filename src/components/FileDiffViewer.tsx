import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface LineChange {
  oldLineNumber: number | null;
  newLineNumber: number | null;
  type: "addition" | "deletion" | "context";
  content: string;
}

interface FileDiffViewerProps {
  file: string;
  insertions: number;
  deletions: number;
  lineChanges: LineChange[];
}

export function FileDiffViewer({
  file,
  insertions,
  deletions,
  lineChanges,
}: FileDiffViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
          <span className="font-mono text-sm font-medium text-gray-800">
            {file}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-600 font-semibold">+{insertions}</span>
          <span className="text-red-600 font-semibold">-{deletions}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <tbody>
                {lineChanges.map((line, index) => {
                  const bgColor =
                    line.type === "addition"
                      ? "bg-green-900 bg-opacity-30"
                      : line.type === "deletion"
                      ? "bg-red-900 bg-opacity-30"
                      : "bg-gray-900";

                  const textColor =
                    line.type === "addition"
                      ? "text-green-300"
                      : line.type === "deletion"
                      ? "text-red-300"
                      : "text-gray-300";

                  const linePrefix =
                    line.type === "addition"
                      ? "+"
                      : line.type === "deletion"
                      ? "-"
                      : " ";

                  return (
                    <tr key={index} className={`${bgColor} ${textColor}`}>
                      <td className="px-3 py-0.5 text-gray-500 text-right select-none border-r border-gray-700 w-12">
                        {line.oldLineNumber || ""}
                      </td>
                      <td className="px-3 py-0.5 text-gray-500 text-right select-none border-r border-gray-700 w-12">
                        {line.newLineNumber || ""}
                      </td>
                      <td className="px-3 py-0.5 whitespace-pre">
                        <span className="select-none mr-2 opacity-60">
                          {linePrefix}
                        </span>
                        {line.content}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
