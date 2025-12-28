import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeRequest {
  projectPath: string;
  mainBranch: string;
  featureBranch: string;
  ollamaUrl?: string;
  ollamaModel?: string;
}

interface DiffSummary {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

interface FileChange {
  file: string;
  changes: number;
  insertions: number;
  deletions: number;
  diff: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      projectPath,
      mainBranch,
      featureBranch,
      ollamaUrl,
      ollamaModel,
    }: AnalyzeRequest = await req.json();

    if (!projectPath || !mainBranch || !featureBranch) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: projectPath, mainBranch, featureBranch",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const ollamaApiUrl = ollamaUrl || "http://localhost:11434";
    const model = ollamaModel || "llama2";

    const gitDiffCommand = new Deno.Command("git", {
      args: [
        "-C",
        projectPath,
        "diff",
        `${mainBranch}...${featureBranch}`,
        "--stat",
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const gitDiffDetailCommand = new Deno.Command("git", {
      args: ["-C", projectPath, "diff", `${mainBranch}...${featureBranch}`],
      stdout: "piped",
      stderr: "piped",
    });

    const [statOutput, detailOutput] = await Promise.all([
      gitDiffCommand.output(),
      gitDiffDetailCommand.output(),
    ]);

    if (!statOutput.success) {
      const errorText = new TextDecoder().decode(statOutput.stderr);
      return new Response(
        JSON.stringify({ error: `Git diff failed: ${errorText}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const statText = new TextDecoder().decode(statOutput.stdout);
    const detailText = new TextDecoder().decode(detailOutput.stdout);

    const diffSummary = parseDiffSummary(statText);
    const fileChanges = parseDiffDetails(detailText);

    let aiAnalysis = "";
    let errorsWarnings: Array<{
      type: string;
      message: string;
      file?: string;
      line?: number;
    }> = [];

    try {
      const analysisPrompt = `You are a code reviewer. Analyze the following git diff and provide:
1. A summary of changes
2. Potential errors or bugs
3. Code quality issues
4. Security concerns
5. Suggestions for improvement

Diff Summary:
Files changed: ${diffSummary.filesChanged}
Insertions: ${diffSummary.insertions}
Deletions: ${diffSummary.deletions}

Detailed changes:
${detailText.substring(0, 8000)}

Provide your analysis in a structured format.`;

      const ollamaResponse = await fetch(`${ollamaApiUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          prompt: analysisPrompt,
          stream: false,
        }),
      });

      if (ollamaResponse.ok) {
        const ollamaData = await ollamaResponse.json();
        aiAnalysis = ollamaData.response || "No analysis available";

        errorsWarnings = extractErrorsWarnings(aiAnalysis, fileChanges);
      } else {
        aiAnalysis =
          "Ollama analysis unavailable. Make sure Ollama is running locally.";
      }
    } catch (error) {
      aiAnalysis = `Ollama connection failed: ${error.message}. Ensure Ollama is installed and running on ${ollamaApiUrl}`;
    }

    const result = {
      diffSummary,
      fileChanges,
      aiAnalysis,
      errorsWarnings,
      status: "completed",
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseDiffSummary(statText: string): DiffSummary {
  const lines = statText.split("\n");
  let filesChanged = 0;
  let insertions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.includes("file") && line.includes("changed")) {
      const match = line.match(/(\d+)\s+file/);
      if (match) filesChanged = parseInt(match[1]);

      const insertMatch = line.match(/(\d+)\s+insertion/);
      if (insertMatch) insertions = parseInt(insertMatch[1]);

      const deleteMatch = line.match(/(\d+)\s+deletion/);
      if (deleteMatch) deletions = parseInt(deleteMatch[1]);
    }
  }

  return { filesChanged, insertions, deletions };
}

function parseDiffDetails(detailText: string): FileChange[] {
  const fileChanges: FileChange[] = [];
  const fileDiffs = detailText.split("diff --git");

  for (let i = 1; i < fileDiffs.length; i++) {
    const fileDiff = fileDiffs[i];
    const fileMatch = fileDiff.match(/a\/(.+?)\s+b\//);

    if (fileMatch) {
      const fileName = fileMatch[1];
      const lines = fileDiff.split("\n");

      let insertions = 0;
      let deletions = 0;

      for (const line of lines) {
        if (line.startsWith("+") && !line.startsWith("+++")) insertions++;
        if (line.startsWith("-") && !line.startsWith("---")) deletions++;
      }

      fileChanges.push({
        file: fileName,
        changes: insertions + deletions,
        insertions,
        deletions,
        diff: fileDiff.substring(0, 1000),
      });
    }
  }

  return fileChanges;
}

function extractErrorsWarnings(
  analysis: string,
  fileChanges: FileChange[]
): Array<{ type: string; message: string; file?: string; line?: number }> {
  const errorsWarnings: Array<{
    type: string;
    message: string;
    file?: string;
    line?: number;
  }> = [];

  const errorKeywords = [
    "error",
    "bug",
    "issue",
    "problem",
    "security",
    "vulnerability",
  ];
  const warningKeywords = [
    "warning",
    "concern",
    "consider",
    "should",
    "recommend",
  ];

  const analysisLines = analysis.toLowerCase().split("\n");

  for (const line of analysisLines) {
    if (errorKeywords.some((keyword) => line.includes(keyword))) {
      errorsWarnings.push({
        type: "error",
        message: line.trim(),
      });
    } else if (warningKeywords.some((keyword) => line.includes(keyword))) {
      errorsWarnings.push({
        type: "warning",
        message: line.trim(),
      });
    }
  }

  return errorsWarnings;
}
