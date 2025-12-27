import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/analyze-branch', async (req, res) => {
  try {
    const { projectPath, mainBranch, featureBranch, ollamaUrl, ollamaModel, excludedFolders } = req.body;

    if (!projectPath || !mainBranch || !featureBranch) {
      return res.status(400).json({
        error: 'Missing required fields: projectPath, mainBranch, featureBranch',
      });
    }

    const ollamaApiUrl = ollamaUrl || 'http://localhost:11434';
    const model = ollamaModel || 'llama2';
    const excludes = excludedFolders || [];
    const campaignId = uuidv4();

    try {
      await dbRun(
        `INSERT INTO campaigns (id, project_path, main_branch, feature_branch, excluded_folders, ollama_url, ollama_model, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [campaignId, projectPath, mainBranch, featureBranch, JSON.stringify(excludes), ollamaApiUrl, model, 'in_progress']
      );
    } catch (dbError) {
      return res.status(500).json({ error: `Failed to create campaign: ${dbError.message}` });
    }

    try {
      let statCommand = `git -C "${projectPath}" diff ${mainBranch}...${featureBranch} --stat`;
      let diffCommand = `git -C "${projectPath}" diff ${mainBranch}...${featureBranch}`;

      if (excludes.length > 0) {
        const excludePatterns = excludes.map((f) => `:!:${f}/**`).join(' ');
        statCommand += ` -- . ${excludePatterns}`;
        diffCommand += ` -- . ${excludePatterns}`;
      }

      const statOutput = execSync(statCommand, { encoding: 'utf8' });
      const detailOutput = execSync(diffCommand, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

      const diffSummary = parseDiffSummary(statOutput);
      const fileChanges = parseDiffDetails(detailOutput);

      let aiAnalysis = '';
      let errorsWarnings = [];

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
${detailOutput.substring(0, 8000)}

Provide your analysis in a structured format.`;

        const ollamaResponse = await fetch(`${ollamaApiUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            prompt: analysisPrompt,
            stream: false,
          }),
        });

        if (ollamaResponse.ok) {
          const ollamaData = await ollamaResponse.json();
          aiAnalysis = ollamaData.response || 'No analysis available';
          errorsWarnings = extractErrorsWarnings(aiAnalysis, fileChanges);
        } else {
          aiAnalysis =
            'Ollama analysis unavailable. Make sure Ollama is running locally.';
        }
      } catch (error) {
        aiAnalysis = `Ollama connection failed: ${error.message}. Ensure Ollama is installed and running on ${ollamaApiUrl}`;
      }

      const resultsId = uuidv4();
      try {
        await dbRun(
          `INSERT INTO analysis_results (id, campaign_id, diff_summary, file_changes, ai_analysis, errors_warnings)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [resultsId, campaignId, JSON.stringify(diffSummary), JSON.stringify(fileChanges), aiAnalysis, JSON.stringify(errorsWarnings)]
        );
      } catch (error) {
        console.error('Failed to save results:', error);
      }

      await dbRun(
        `UPDATE campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        ['completed', campaignId]
      );

      const result = {
        campaignId,
        diffSummary,
        fileChanges,
        aiAnalysis,
        errorsWarnings,
        status: 'completed',
      };

      res.json(result);
    } catch (error) {
      await dbRun(
        `UPDATE campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        ['failed', campaignId]
      );

      return res.status(400).json({
        error: `Analysis failed: ${error.message}`,
        campaignId,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.get('/api/campaigns', async (req, res) => {
  try {
    const data = await dbAll(
      `SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 50`
    );
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/campaigns/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await dbGet(
      `SELECT * FROM analysis_results WHERE campaign_id = ?`,
      [id]
    );
    res.json(data || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function parseDiffSummary(statText) {
  const lines = statText.split('\n');
  let filesChanged = 0;
  let insertions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.includes('file') && line.includes('changed')) {
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

function parseDiffDetails(detailText) {
  const fileChanges = [];
  const fileDiffs = detailText.split('diff --git');

  for (let i = 1; i < fileDiffs.length; i++) {
    const fileDiff = fileDiffs[i];
    const fileMatch = fileDiff.match(/a\/(.+?)\s+b\//);

    if (fileMatch) {
      const fileName = fileMatch[1];
      const lines = fileDiff.split('\n');

      let insertions = 0;
      let deletions = 0;

      for (const line of lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) insertions++;
        if (line.startsWith('-') && !line.startsWith('---')) deletions++;
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

function extractErrorsWarnings(analysis, fileChanges) {
  const errorsWarnings = [];

  const errorKeywords = ['error', 'bug', 'issue', 'problem', 'security', 'vulnerability'];
  const warningKeywords = ['warning', 'concern', 'consider', 'should', 'recommend'];

  const analysisLines = analysis.toLowerCase().split('\n');

  for (const line of analysisLines) {
    if (errorKeywords.some((keyword) => line.includes(keyword))) {
      errorsWarnings.push({
        type: 'error',
        message: line.trim(),
      });
    } else if (warningKeywords.some((keyword) => line.includes(keyword))) {
      errorsWarnings.push({
        type: 'warning',
        message: line.trim(),
      });
    }
  }

  return errorsWarnings;
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Make sure Ollama is running: ollama serve');
});
