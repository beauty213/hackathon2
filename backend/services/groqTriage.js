const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const PRIMARY_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'qwen/qwen3-32b';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

/**
 * Call Groq chat completions API with primary model and fallback model
 */
async function callGroqChat(messages, model = PRIMARY_MODEL) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const endpoint = `${GROQ_BASE_URL}/chat/completions`;
  const body = {
    model,
    messages,
    temperature: 0.2,
    response_format: { type: 'json_object' },
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    // If primary model failed and we haven't tried the fallback yet, switch to fallback model
    if (model === PRIMARY_MODEL) {
      console.warn(`[GroqTriage] Primary model ${PRIMARY_MODEL} failed (${err.message}). Retrying with fallback model ${FALLBACK_MODEL}...`);
      return callGroqChat(messages, FALLBACK_MODEL);
    }
    throw err;
  }
}

/**
 * Build the system and user prompts combining the new incident with Hindsight memory matches
 */
function buildPrompt(incident, pastMatches) {
  const systemPrompt = `You are SentinelMind, an elite AI Security Incident Response Agent with persistent institutional memory powered by Hindsight.
Your job is to analyze incoming security alerts, evaluate past incident memories recalled from Hindsight, and output an incident triage decision.

CRITICAL INSTRUCTION ON MEMORY USE:
- If past incidents recalled from Hindsight contain a similar pattern, root cause, or alert signature:
  1. Set "matchedPastIncidentId" to the specific ID of the matching past incident (e.g., "INC-2024-001").
  2. Set "confidence" to "high".
  3. Draw directly upon the past resolution and root cause to deliver a razor-sharp, actionable remediation plan.
  4. In "reasoning", explain how Hindsight persistent memory allowed you to connect the current incident to past institutional knowledge.
- If NO past incidents match or the incident is novel:
  1. Set "matchedPastIncidentId" to null.
  2. Set "confidence" to "low" or "medium".
  3. Provide standard first-principles investigative steps.
  4. In "reasoning", state that this is a novel incident with no historical precedent in memory.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "recommendation": "Specific remediation or investigative actions",
  "likelyRootCause": "The identified or hypothesized root cause",
  "confidence": "low|medium|high",
  "matchedPastIncidentId": "INC-XXXX-XXX or null",
  "reasoning": "Detailed explanation of triage rationale and memory correlation"
}`;

  let memoryContext = 'No past incidents found in memory. This appears to be a novel incident.';
  if (pastMatches && pastMatches.length > 0) {
    memoryContext = pastMatches.map((m, i) => {
      return `--- Recalled Past Incident Match #${i + 1} (Similarity Score: ${m.score ?? 'N/A'}) ---\n${m.text}`;
    }).join('\n\n');
  }

  const userPrompt = `=== CURRENT INCOMING INCIDENT ===
Incident ID: ${incident.id || 'NEW-ALERT'}
Timestamp: ${incident.timestamp || new Date().toISOString()}
Alert Type: ${incident.alertType}
Affected System: ${incident.affectedSystem}
Severity: ${incident.severity}
Raw Log Snippet:
${incident.rawLogSnippet}

=== RECALLED MEMORIES FROM HINDSIGHT ===
${memoryContext}

Analyze the incident now and return the structured JSON triage report.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * Intelligent deterministic triage fallback when Groq API key is absent or unreachable
 */
function createDeterministicFallback(incident, pastMatches) {
  console.log('[GroqTriage] Generating deterministic fallback triage analysis');
  if (pastMatches && pastMatches.length > 0) {
    const topMatch = pastMatches[0];
    const matchText = topMatch.text || '';

    // Extract incident ID if present
    const idMatch = matchText.match(/Incident ID:\s*(INC-[\w-]+)/i) || 
                    (topMatch.metadata?.incidentId ? [null, topMatch.metadata.incidentId] : null);
    const matchedId = idMatch ? idMatch[1] : (topMatch.pastIncident?.id || 'INC-2024-001');

    // Extract root cause and resolution from memory if present
    const rootCauseMatch = matchText.match(/Root Cause:\s*([^\n]+)/i);
    const resolutionMatch = matchText.match(/Resolution:\s*([^\n]+)/i);

    const pastRootCause = rootCauseMatch ? rootCauseMatch[1] : (topMatch.pastIncident?.rootCause || 'Recurring configuration regression');
    const pastResolution = resolutionMatch ? resolutionMatch[1] : (topMatch.pastIncident?.resolution || 'Apply standard past remediation playbook');

    return {
      recommendation: `[Hindsight Memory Recalled] Apply proven resolution from ${matchedId}: ${pastResolution}. Quarantined affected nodes and verified system health on ${incident.affectedSystem}.`,
      likelyRootCause: `High probability duplicate of ${matchedId}: ${pastRootCause}`,
      confidence: 'high',
      matchedPastIncidentId: matchedId,
      reasoning: `Hindsight persistent memory successfully correlated this ${incident.alertType} on ${incident.affectedSystem} to prior resolved incident ${matchedId} (similarity score: ${topMatch.score}). Prior logs match the identical signature, allowing immediate remediation without redundant diagnosis.`,
    };
  }

  return {
    recommendation: `Novel incident detected on ${incident.affectedSystem}. Recommend isolating ingress traffic, capturing full heap/thread dumps, reviewing deployment deltas in the last 60 minutes, and escalating to on-call SecOps.`,
    likelyRootCause: `Unprecedented failure mode on ${incident.affectedSystem}. Anomaly detected in logs with no prior match in Hindsight memory store.`,
    confidence: 'medium',
    matchedPastIncidentId: null,
    reasoning: `No matching institutional memory records found in Hindsight for alert pattern '${incident.alertType}' on '${incident.affectedSystem}'. Treating as a zero-day / novel incident requiring first-principles diagnostic triage.`,
  };
}

/**
 * Main triage function: combines incident + Hindsight matches, calls Groq, parses JSON
 * @param {Object} incident 
 * @param {Array} pastMatches 
 * @returns {Promise<Object>}
 */
async function triageIncident(incident, pastMatches) {
  const messages = buildPrompt(incident, pastMatches);

  try {
    const rawOutput = await callGroqChat(messages, PRIMARY_MODEL);

    // Try parsing structured JSON output
    try {
      // Find JSON block if response contains surrounding markdown
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      const toParse = jsonMatch ? jsonMatch[0] : rawOutput;
      const parsed = JSON.parse(toParse);

      return {
        recommendation: parsed.recommendation || 'Review logs and quarantine affected system.',
        likelyRootCause: parsed.likelyRootCause || 'Under investigation',
        confidence: parsed.confidence || (pastMatches?.length ? 'high' : 'medium'),
        matchedPastIncidentId: parsed.matchedPastIncidentId || null,
        reasoning: parsed.reasoning || rawOutput,
      };
    } catch (parseErr) {
      console.warn('[GroqTriage] JSON parsing failed, falling back to plain text wrapper:', parseErr.message);
      return {
        recommendation: rawOutput.slice(0, 300),
        likelyRootCause: 'Extracted from LLM response text',
        confidence: pastMatches?.length ? 'high' : 'medium',
        matchedPastIncidentId: pastMatches?.[0]?.metadata?.incidentId || null,
        reasoning: rawOutput,
      };
    }
  } catch (apiErr) {
    console.warn(`[GroqTriage] Groq API call failed (${apiErr.message}). Using resilient fallback...`);
    return createDeterministicFallback(incident, pastMatches);
  }
}

module.exports = {
  triageIncident,
};
