/* global process */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PYTHON_SCRIPT = path.join(__dirname, '..', 'python', 'optimize.py');

function heuristicRoundRobin(participantIds) {
  const ids = [...participantIds];
  if (ids.length % 2 !== 0) ids.push(null);

  const rounds = [];
  const fixed = ids[0];
  let rotating = ids.slice(1);

  for (let round = 0; round < ids.length - 1; round += 1) {
    const group = [fixed, ...rotating];
    const pairings = [];

    for (let i = 0; i < group.length / 2; i += 1) {
      const a = group[i];
      const b = group[group.length - 1 - i];
      if (a && b) pairings.push([a, b]);
    }

    rounds.push(pairings);
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }

  return rounds;
}

function runPythonOptimizer(payload) {
  const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python';
  const timeoutMs = Number(process.env.OPTIMIZER_TIMEOUT_MS || 15_000);

  return new Promise((resolve, reject) => {
    const child = spawn(pythonExecutable, [PYTHON_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let didTimeout = false;

    const timer = setTimeout(() => {
      didTimeout = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (didTimeout) {
        return reject(new Error(`Python optimizer timed out after ${timeoutMs}ms`));
      }
      if (code !== 0) {
        return reject(new Error(stderr || `Python optimizer exited with code ${code}`));
      }
      try {
        return resolve(JSON.parse(stdout));
      } catch (error) {
        return reject(new Error(`Invalid optimizer JSON output: ${error.message}`));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

export async function optimizeSchedule({ participants, strategy = 'round-robin', roundsRequested }) {
  if (!participants || participants.length < 2) {
    return {
      source: 'python-ortools',
      summary: 'Not enough participants to optimize.',
      rounds: [],
    };
  }

  const payload = { participants, strategy, roundsRequested };

  try {
    const result = await runPythonOptimizer(payload);
    if (!result || !Array.isArray(result.rounds)) {
      throw new Error('Optimizer response missing rounds array');
    }
    return {
      source: result.source || 'python-ortools',
      summary: result.summary || `Generated ${result.rounds.length} optimized rounds via Python OR-Tools.`,
      rounds: result.rounds,
      diagnostics: result.diagnostics || null,
    };
  } catch (error) {
    const rounds = heuristicRoundRobin(participants);
    return {
      source: 'heuristic-fallback',
      summary: `Python OR-Tools unavailable, used fallback: ${error.message}`,
      rounds,
    };
  }
}
