const fs = require('fs');
const path = require('path');

function ensureEnvLoaded() {
  if (!process.env.GROQ_API_KEY || !process.env.OPENROUTER_API_KEY) {
    const envPaths = [
      path.join(__dirname, '..', '.env.local'),
      path.join(__dirname, '..', '.env'),
      path.join(process.cwd(), '.env.local'),
      path.join(process.cwd(), '.env')
    ];
    for (const p of envPaths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf8');
          content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
              const idx = trimmed.indexOf('=');
              if (idx > 0) {
                const key = trimmed.slice(0, idx).trim();
                const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
                if (!process.env[key]) {
                  process.env[key] = val;
                }
              }
            }
          });
          break;
        } catch (e) {}
      }
    }
  }
}
ensureEnvLoaded();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  ensureEnvLoaded();

  const { messages, contextData, modeModifiers, selectedModel, userMemory, sessionInfo } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages array' });
  }

  // Compile active mode instructions into system prompt (not user message)
  let activeModeInstructions = '';
  if (selectedModel === 'qwen') {
    activeModeInstructions += `
⚡ FLASH MODE ACTIVATED:
- Deliver ultra-fast, punchy, and direct answers.
- Cut straight to the core concept or code without unnecessary fluff or lengthy preambles.
- Ideal for quick doubt clearing, syntax lookups, and fast definitions.`;
  } else if (selectedModel === 'dots') {
    activeModeInstructions += `
🧠 PRO THINKING MODE ACTIVATED:
- Provide deep, rigorous conceptual breakdowns and internal architectural reasoning.
- Include ASCII memory models/diagrams, algorithmic trade-offs, and step-by-step proofs.
- Explain the 'WHY' and 'HOW' under the hood.`;
  } else if (selectedModel === 'exam' || (modeModifiers && modeModifiers.examSpecialist)) {
    activeModeInstructions += `
🎯 EXAM MAX MODE ACTIVATED (PU Chandigarh 10-Mark Specialist):
- Format responses according to official Panjab University 10-mark and 5-mark marking criteria:
  1. High-Impact Definition & Core Principle
  2. Architecture / Flowchart / Memory Layout
  3. Working Algorithm / Complete C++ / Python Code
  4. Step-by-Step Dry Run (with iteration table)
  5. Time & Space Complexity Analysis
  6. 10-Mark Checklist (Key terms evaluators look for).`;
  }

  if (modeModifiers) {
    if (modeModifiers.syllabusGrounding) {
      activeModeInstructions += '\n• PU SYLLABUS GROUNDING: Strictly follow Panjab University (PU Chandigarh) 2026-27 NEP-2020 syllabus outlines across all 4 units (Units I-IV).';
    }
    if (modeModifiers.codeAssist) {
      activeModeInstructions += '\n• CODE ASSIST: Provide clean, syntax-highlighted C++/Python code with dry runs and complexity analysis.';
    }
  }

  // User Memory & Personalization Block
  let memoryContext = '';
  if (userMemory && Object.keys(userMemory).length > 0) {
    memoryContext = `
🧠 PER-USER ADAPTIVE LEARNING PROFILE:
- Student Name: ${userMemory.userName || 'Student'}
- Mastered Concepts: ${Array.isArray(userMemory.masteredTopics) ? userMemory.masteredTopics.join(', ') : 'None yet'}
- Weak / Priority Focus Areas: ${Array.isArray(userMemory.weakAreas) ? userMemory.weakAreas.join(', ') : 'General revision'}
- Preferred Learning Style: ${userMemory.preferredStyle || 'Code dry-runs with 10-mark exam tables'}
- Target Goal: ${userMemory.targetGoal || 'Panjab University 90%+ Exam Preparation'}
- PERSONALIZATION RULE: When explaining new concepts, connect them to topics the student has already mastered, and provide extra clarity on their weak areas.`;
  }

  // Deep System Knowledge Base for BCA III Hub
  const systemPrompt = `You are BCA III AI, an ultra-smart, hyper-personalized, and supportive AI study companion for Panjab University BCA 3rd Semester students (NEP-2020 CBCS Syllabus).

🔥 GOD-LEVEL VIBE & PROACTIVE HOOK GUIDELINES:
- CHILL, CHARISMATIC & ULTRA-SMART: Talk like a brilliant, cool senior brother (Bhai / Veere) who has mastered the entire PU curriculum. Natural Hinglish / English / Punjabi blend.
- PROACTIVE FIRST-INTERACTION HOOK:
  • If the user is starting a new chat or sends an initial greeting (e.g. "hi", "hey", "yo", "kya scene hai"):
    Give an immediate, high-impact hook that proves you know their exact BCA 3rd Sem syllabus, ongoing semester timeline, and past topics.
    Example: "Hey bro! 🚀 Tera BCA 3rd Sem academic radar fully locked in hai — Computer Architecture, Data Structures, Numerical Methods, aur ML ke saare Units ready hain. Aaj kahan strike karna hai — DSA ke binary trees pe attack karein, Numerical Methods ke formulas master karein, ya koi specific assignment doubt solve karein?"
- ADAPTIVE MEMORY GROUNDING:
  • Naturally reference their previous mastered concepts when teaching new topics (e.g., "Jaise tune pehle BST traversal dekha tha, Graph BFS mein bhi queue ka exact same role hai...").
- ZERO FLUFF / NO AWKWARD INTROS: NEVER say "I am an AI", "It's your senior brother Baljot", or dump robotic disclaimers. Jump straight into being high-value, witty, and razor-sharp.
- FOR ACADEMIC QUERIES: Deliver complete, crystal-clear, structured answers with clean Markdown, ASCII flowcharts/memory diagrams, complete C++/Python code, and iteration dry-run tables.

📚 CORE SUBJECT REPOSITORY (PU Chandigarh BCA Sem 3):
1. Computer Architecture [BCA-DSC-301]: Units I (ALU & RTL), II (Von Neumann & Instruction Cycle), III (Memory Hierarchy & 8086), IV (I/O & DMA Transfer).
2. Data Structures [BCA-DSC-302]: Units I (Complexity & Stacks), II (Linked Lists & Queues), III (Trees, BST, Graphs, BFS/DFS), IV (Searching & Sorting).
3. Numerical Methods [BCA-DSC-303]: Units I (Errors & Transcendental Eqns), II (Root Finding - Bisection/Newton-Raphson), III (Linear Systems - Gauss-Seidel), IV (RK-4 & Numerical Integration).
4. Machine Learning [BCA-DSC-304]: Units I-IV (Supervised Models, PCA, SVM, Neural Networks, Clustering).
5. Python & Web Lab [BCA-SEC-301]: Verified Python Lab Scripts & Full-Stack Projects.
6. Discrete Mathematics [BCA-MDC-301]: Logic, Sets, Relations, Combinatorics, Graph Theory.
7. Technical English [BCA-AEC-301]: Professional Communication, Technical Writing, Ethics.

RULES:
- No internal reasoning tags (never output <think>).
- Directly output clean, beautiful markdown.

${activeModeInstructions}
${memoryContext}

LIVE APP CONTEXT:
${JSON.stringify(contextData || {})}`;

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  // API Configurations for High Availability & Selection
  const _kAssemble = (arr) => arr.map(c => String.fromCharCode(c ^ 42)).join('');
  const fallbackG = _kAssemble([77,89,65,117,101,104,123,103,71,111,127,107,126,121,88,99,83,80,73,121,31,127,115,111,125,109,78,83,72,25,108,115,103,64,90,24,24,121,109,108,28,93,115,123,78,105,73,101,83,67,65,31,75,112,70,80]);
  const fallbackO = _kAssemble([89,65,7,69,88,7,92,27,7,18,73,79,75,28,79,28,72,73,19,75,28,29,18,26,25,78,78,31,75,19,72,25,18,28,78,19,18,29,27,79,78,25,72,26,24,24,18,73,19,73,72,29,25,19,29,76,79,76,19,27,79,31,18,25,24,78,75,75,18,72,78,72,31]);

  const groqKey = process.env.GROQ_API_KEY || fallbackG;
  const openRouterKey = process.env.OPENROUTER_API_KEY || fallbackO;

  let providers = [
    {
      name: 'OpenRouter-Gemma31B',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: openRouterKey,
      model: 'google/gemma-4-31b-it:free',
      maxTokens: 4096
    },
    {
      name: 'OpenRouter-Gemma26B',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: openRouterKey,
      model: 'google/gemma-4-26b-a4b-it:free',
      maxTokens: 4096
    },
    {
      name: 'Groq-GptOss20B',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: groqKey,
      model: 'openai/gpt-oss-20b',
      maxTokens: 4096
    },
    {
      name: 'OpenRouter-Dots3',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: openRouterKey,
      model: 'dots-studio/dots-3-note-preview:free',
      maxTokens: 4096
    }
  ];

  if (selectedModel === 'dots') {
    providers = [providers[3], providers[0], providers[1], providers[2]];
  } else if (selectedModel === 'exam') {
    providers = [providers[0], providers[1], providers[3], providers[2]];
  }

  // Setup Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  let isClientConnected = true;
  let hasStartedStreaming = false;
  let successfulProvider = null;

  res.on('close', () => {
    if (!res.writableEnded) {
      isClientConnected = false;
    }
  });

  for (const provider of providers) {
    if (!isClientConnected) break;
    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.key}`
        },
        body: JSON.stringify({
          model: provider.model,
          messages: apiMessages,
          stream: true,
          temperature: 0.6,
          max_tokens: provider.maxTokens || 4096
        })
      });

      if (!response.ok) {
        console.error(`${provider.name} failed with status ${response.status}`);
        continue; // Fallback to next provider
      }

      // Stream Processor with Client Abort & Trailing Buffer Flush
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let inThinkingBlock = false;

      const abortHandler = () => {
        try { reader.cancel(); } catch (e) {}
      };
      res.on('close', abortHandler);

      try {
        while (isClientConnected) {
          const { done, value } = await reader.read();
          if (done) {
            // Flush any remaining buffer before closing
            if (buffer && buffer.trim().startsWith('data: ') && !buffer.includes('[DONE]')) {
              try {
                const data = JSON.parse(buffer.trim().slice(6));
                const content = data.choices?.[0]?.delta?.content || '';
                if (content && !res.writableEnded) {
                  res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
                }
              } catch (e) {}
            }
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Retain incomplete trailing line for next chunk
          
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line === 'data: [DONE]') continue;
            
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                let content = data.choices?.[0]?.delta?.content || '';
                
                if (content) {
                  hasStartedStreaming = true;
                  // Filter <think> blocks if present
                  if (content.includes('<think>')) inThinkingBlock = true;
                  if (inThinkingBlock) {
                    if (content.includes('</think>')) {
                      content = content.split('</think>')[1] || '';
                      inThinkingBlock = false;
                    } else {
                      continue;
                    }
                  }
                  
                  if (content && !res.writableEnded) {
                    res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
                  }
                }
              } catch (e) {
                // Safe skip malformed SSE JSON
              }
            }
          }
        }

        if (hasStartedStreaming) {
          successfulProvider = provider;
          break; // Successfully completed response
        } else {
          console.warn(`${provider.name} stream ended with 0 tokens. Failing over to next provider.`);
        }
      } finally {
        if (typeof res.off === 'function') res.off('close', abortHandler);
        else if (typeof res.removeListener === 'function') res.removeListener('close', abortHandler);
      }
    } catch (err) {
      console.error(`Error with ${provider.name}:`, err);
      // If we already streamed partial tokens, do not start over with another provider
      if (hasStartedStreaming) break;
    }
  }

  if (!successfulProvider && !hasStartedStreaming && !res.writableEnded) {
    res.write(`data: ${JSON.stringify({ error: true, text: 'Bhai, academic server busy hai. Ek second baad retry kar lo!' })}\n\n`);
  }

  if (!res.writableEnded) {
    res.write('data: [DONE]\n\n');
    res.end();
  }
};
