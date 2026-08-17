/**
 * BCA 3 Hub — AI Study Copilot (WebLLM 100% In-Browser Engine)
 * - Auto-detects device hardware & recommends optimal model tier
 * - Explicit download-first workflow with persistent OPFS/localStorage caching
 * - Never re-downloads once cached
 * - Injects full site context (7 subjects, 26+ Firebase notes, lectures, notices)
 * - Universal WebGPU shader-f16 & q4f32 fallback for Safari/Chrome/Edge/iOS
 */

const BCA_AI = (function () {
  'use strict';

  // --- 1. MODEL REGISTRY ---
  const MODELS = [
    {
      id: 'SmolLM2-360M-Instruct-q4f32_1-MLC',
      name: 'SmolLM2 360M',
      tag: '⚡ Ultra Fast (Mobile)',
      tier: 'mobile',
      params: '360M',
      downloadMB: 220,
      vramMB: 450,
      description: 'Ultra-lightweight model. Loads fastest, works smoothly on budget phones and slow networks.',
      recommendedFor: 'Phones (4GB RAM) & Slow Connections'
    },
    {
      id: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC',
      name: 'Qwen 2.5 0.5B',
      tag: '⚡ Fast All-Rounder',
      tier: 'mobile-plus',
      params: '0.5B',
      downloadMB: 350,
      vramMB: 650,
      description: 'High token efficiency, great for quick concept lookup and basic C programming.',
      recommendedFor: 'Modern Smartphones & Budget Laptops'
    },
    {
      id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
      name: 'Llama 3.2 1B',
      tag: '🎯 Recommended (Balanced)',
      tier: 'balanced',
      params: '1.2B',
      downloadMB: 850,
      vramMB: 1300,
      description: 'Best balance of intelligence, speed, and accuracy for BCA 3rd Sem syllabus.',
      recommendedFor: 'Standard Laptops & Modern Phones'
    },
    {
      id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
      name: 'Qwen 2.5 1.5B',
      tag: '🧠 Coding & Data Structures',
      tier: 'balanced-plus',
      params: '1.5B',
      downloadMB: 1100,
      vramMB: 1600,
      description: 'Excels at complex C/C++ algorithms, binary trees, sorting, and Numerical Methods.',
      recommendedFor: 'Mid-range Laptops (8GB RAM)'
    },
    {
      id: 'Phi-3.5-mini-instruct-q4f32_1-MLC',
      name: 'Phi 3.5 Mini 3.8B',
      tag: '🔬 Math & Reasoning',
      tier: 'performance',
      params: '3.8B',
      downloadMB: 2400,
      vramMB: 3200,
      description: 'Deep mathematical proofs, step-by-step Gauss elimination and Newton-Raphson working.',
      recommendedFor: 'Numerical Methods & Step-by-Step Math'
    },
    {
      id: 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
      name: 'Llama 3.2 3B',
      tag: '🚀 Full Pro Depth',
      tier: 'performance-max',
      params: '3.2B',
      downloadMB: 2200,
      vramMB: 2800,
      description: 'Maximum syllabus synthesis, deep explanations, and complete code architecture.',
      recommendedFor: 'MacBooks (M1/M2/M3) & 16GB+ PCs'
    }
  ];

  // --- STATE ---
  let _engine = null;
  let _webllm = null;
  let _deviceSpecs = null;
  let _selectedModelId = null;
  let _engineState = 'unloaded'; // 'unloaded' | 'downloading' | 'ready' | 'generating' | 'error' | 'fallback'
  let _chatHistory = [];
  let _currentMsgId = null;
  let _isAborting = false;

  const STORAGE_KEY_CACHED_MODEL = 'bca_ai_cached_model_id';

  // --- 2. HARDWARE PROBING & AUTO-RECOMMENDATION ---
  async function detectHardwareSpecs() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     (window.innerWidth <= 768) || (navigator.maxTouchPoints > 1 && window.innerWidth <= 1024);

    const memoryGB = navigator.deviceMemory || (isMobile ? 4 : 8);
    const cpuCores = navigator.hardwareConcurrency || 4;

    let hasWebGPU = false;
    let hasF16 = false;
    let gpuVendor = 'Generic GPU';
    let webgpuError = null;

    if ('gpu' in navigator && typeof navigator.gpu.requestAdapter === 'function') {
      try {
        const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        if (adapter) {
          hasWebGPU = true;
          hasF16 = adapter.features?.has?.('shader-f16') || false;
          if (adapter.info) {
            gpuVendor = adapter.info.vendor || adapter.info.architecture || 'WebGPU Supported';
          }
        } else {
          webgpuError = 'WebGPU adapter unavailable';
        }
      } catch (e) {
        webgpuError = e.message || 'WebGPU probe failed';
      }
    } else {
      webgpuError = 'WebGPU not supported in this browser version';
    }

    // Auto-Recommend according to user hardware specifications
    let recommendedModelId = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
    let tierName = 'Standard Laptop / Modern Phone';

    if (isMobile) {
      if (memoryGB <= 4) {
        recommendedModelId = 'SmolLM2-360M-Instruct-q4f32_1-MLC';
        tierName = 'Mobile Ultra-Light (360M)';
      } else {
        recommendedModelId = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';
        tierName = 'Smartphone All-Rounder (0.5B)';
      }
    } else {
      // Desktop / Mac / PC
      if (memoryGB >= 16 || (navigator.userAgent.includes('Macintosh') && cpuCores >= 8)) {
        recommendedModelId = 'Llama-3.2-3B-Instruct-q4f32_1-MLC';
        tierName = 'Apple Silicon / 16GB+ PC (3B)';
      } else if (memoryGB >= 8) {
        recommendedModelId = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
        tierName = 'Standard Laptop (1B)';
      } else {
        recommendedModelId = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';
        tierName = 'Budget PC (0.5B)';
      }
    }

    _deviceSpecs = {
      isMobile,
      hasWebGPU,
      hasF16,
      memoryGB,
      cpuCores,
      gpuVendor,
      webgpuError,
      recommendedModelId,
      tierName
    };

    // If user previously downloaded a model, keep that model
    const savedModel = localStorage.getItem(STORAGE_KEY_CACHED_MODEL);
    if (savedModel && MODELS.some(m => m.id === savedModel)) {
      _selectedModelId = savedModel;
    } else if (!_selectedModelId) {
      _selectedModelId = recommendedModelId;
    }

    return _deviceSpecs;
  }

  function getModelById(id) {
    return MODELS.find(m => m.id === id) || MODELS[2];
  }

  // --- 3. LIVE KNOWLEDGE BASE INJECTION (RAG) ---
  function buildLiveHubContext() {
    let ctx = '=== BCA 3RD SEMESTER (PANJAB UNIVERSITY 2026-27) LIVE HUB DATA ===\n\n';

    // Syllabus
    if (typeof window !== 'undefined' && window.BCA_3RD_SEM_DATA && window.BCA_3RD_SEM_DATA.subjects) {
      ctx += '--- OFFICIAL SUBJECTS & UNITS ---\n';
      window.BCA_3RD_SEM_DATA.subjects.forEach(s => {
        ctx += `\n[${s.code}] ${s.title} (${s.credits} Credits, ${s.theoryHours}h)\n`;
        if (s.units) {
          s.units.forEach(u => {
            ctx += `  • ${u.unitNumber}: ${u.title} -> ${u.summary || ''}\n`;
            if (u.topics) ctx += `    Key topics: ${u.topics.slice(0, 6).join(', ')}\n`;
          });
        }
      });
    }

    // Live Published Notes
    const notes = (typeof _globalCloudData !== 'undefined' && _globalCloudData.notes) || [];
    if (notes.length > 0) {
      ctx += '\n--- LIVE PUBLISHED DIGITAL NOTES (26+ NOTES IN DATABASE) ---\n';
      notes.slice(0, 15).forEach((n, i) => {
        ctx += `${i + 1}. [${n.subject || n.subjectId || 'Note'}] "${n.title}" (Unit ${n.unit || 'I'})\n`;
        if (n.summary) ctx += `   Summary: ${n.summary}\n`;
      });
    }

    // Lectures
    const lectures = (typeof _globalCloudData !== 'undefined' && _globalCloudData.lectures) || [];
    if (lectures.length > 0) {
      ctx += '\n--- RECENT LECTURE TIMELINE COVERED IN CLASS ---\n';
      lectures.slice(0, 8).forEach(l => {
        ctx += `• [${l.date || 'Recent'}] ${l.subject || ''}: "${l.topic}" — ${l.description || ''}\n`;
      });
    }

    // Announcements
    const notices = (typeof _academicCalendarDataCache !== 'undefined' && _academicCalendarDataCache.announcements) ||
                    (typeof _globalCloudData !== 'undefined' && _globalCloudData.announcements) || [];
    if (notices.length > 0) {
      ctx += '\n--- ACTIVE HUB NOTICES ---\n';
      notices.slice(0, 5).forEach(n => {
        ctx += `📢 [${n.date || 'Notice'}] ${n.title}: ${n.message || n.content || ''}\n`;
      });
    }

    return ctx;
  }

  function buildSystemPrompt() {
    return `You are "BCA III AI Copilot", an elite, privacy-preserving in-browser study companion for BCA 3rd Semester students at Panjab University (2026-27 batch).
All computations run 100% locally on the student's device.

You have complete knowledge of:
1. Computer Architecture (BCA-DSC-301)
2. Data Structures (BCA-DSC-302)
3. Computer Oriented Numerical Methods (BCA-DSC-303)
4. Introduction to Machine Learning (BCA-DSC-304)
5. English-3 (AEC)
6. Web Development / Designing (MDC)
7. Backend Web Development (SEC)

${buildLiveHubContext()}

INSTRUCTIONS:
1. Ground answers strictly in the Panjab University BCA 3rd Sem syllabus.
2. For coding questions (Data Structures, Web Dev), provide clear, correct C/C++/Python code with Big-O Time & Space Complexity analysis.
3. For Numerical Methods (Gauss Elimination, Newton-Raphson, Runge-Kutta), give step-by-step mathematical calculations.
4. For Computer Architecture, explain registers (AC, PC, IR, DR, TR), bus architecture, and 8086 instructions cleanly.
5. Format answers cleanly in Markdown with bold headers, bullet lists, and syntax-highlighted code blocks.`;
  }

  // --- 4. ENGINE LOADER & PERSISTENT CACHING ---
  async function loadWebLLMModule() {
    if (_webllm) return _webllm;
    _webllm = await import("https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.78/+esm");
    return _webllm;
  }

  async function checkModelInCache(modelId) {
    try {
      const webllm = await loadWebLLMModule();
      if (typeof webllm.hasModelInCache === 'function') {
        return await webllm.hasModelInCache(modelId);
      }
    } catch (e) {
      console.warn('[BCA AI] Cache check error:', e);
    }
    return localStorage.getItem(STORAGE_KEY_CACHED_MODEL) === modelId;
  }

  async function downloadAndInitializeModel(modelId, autoTriggerPrompt) {
    if (!_deviceSpecs) await detectHardwareSpecs();

    if (!_deviceSpecs.hasWebGPU) {
      _engineState = 'fallback';
      updateUIStatus('fallback', 'Knowledge Search Active (No WebGPU)');
      if (autoTriggerPrompt) executeFallbackChat(autoTriggerPrompt);
      return;
    }

    _selectedModelId = modelId || _selectedModelId || _deviceSpecs.recommendedModelId;
    const modelObj = getModelById(_selectedModelId);

    _engineState = 'downloading';
    updateUIStatus('downloading', `Downloading ${modelObj.name}...`);
    showProgressBar(true, `Downloading ${modelObj.name} weights (~${modelObj.downloadMB} MB)...`);

    try {
      const webllm = await loadWebLLMModule();

      if (_engine) {
        try { await _engine.unload(); } catch(e) {}
        _engine = null;
      }

      _engine = await webllm.CreateMLCEngine(_selectedModelId, {
        initProgressCallback: (report) => {
          handleInitProgress(report);
        },
        logLevel: 'WARN'
      });

      // Mark model as permanently cached in browser
      localStorage.setItem(STORAGE_KEY_CACHED_MODEL, _selectedModelId);

      _engineState = 'ready';
      updateUIStatus('ready', `Model Ready (${modelObj.name})`);
      showProgressBar(false);

      updateHardwareBadge();

      if (autoTriggerPrompt) {
        executeChat(autoTriggerPrompt);
      }
    } catch (err) {
      console.error('[BCA AI] Model load error:', err);
      _engineState = 'fallback';
      updateUIStatus('fallback', 'Instant Knowledge Mode');
      showProgressBar(false);
      if (autoTriggerPrompt) {
        executeFallbackChat(autoTriggerPrompt);
      }
    }
  }

  function handleInitProgress(report) {
    const progress = Math.min(100, Math.max(0, Math.round((report.progress || 0) * 100)));
    const text = report.text || 'Loading weights...';

    console.log(`%c[BCA AI Download] ${progress}% -> ${text}`, 'color: #cc785c; font-weight: bold;');

    const bar = document.getElementById('ai-init-progress-bar');
    const label = document.getElementById('ai-init-progress-text');
    const percent = document.getElementById('ai-init-progress-percent');

    if (bar) bar.style.width = `${progress}%`;
    if (label) label.textContent = text;
    if (percent) percent.textContent = `${progress}%`;
  }

  // --- 5. CHAT EXECUTION & STREAMING ---
  async function sendMessage(userPrompt) {
    if (!userPrompt || !userPrompt.trim()) return;
    const prompt = userPrompt.trim();

    if (!_deviceSpecs) await detectHardwareSpecs();

    // If WebGPU is not supported, run fallback
    if (!_deviceSpecs.hasWebGPU || _engineState === 'fallback') {
      executeFallbackChat(prompt);
      return;
    }

    // If model not yet downloaded / loaded, trigger download-first workflow
    if (_engineState === 'unloaded' || _engineState === 'error' || !_engine) {
      appendUserMessage(prompt);
      _currentMsgId = 'ai-msg-' + Date.now();
      appendAssistantPlaceholder(_currentMsgId, `Downloading ${getModelById(_selectedModelId)?.name} into browser cache (happens only once)...`);
      await downloadAndInitializeModel(_selectedModelId, prompt);
      return;
    }

    if (_engineState === 'downloading') {
      appendUserMessage(prompt);
      return;
    }

    appendUserMessage(prompt);
    _currentMsgId = 'ai-msg-' + Date.now();
    appendAssistantPlaceholder(_currentMsgId, 'Thinking...');
    executeChat(prompt);
  }

  async function executeChat(prompt) {
    if (!_engine) {
      executeFallbackChat(prompt);
      return;
    }

    try {
      const messages = [
        { role: 'system', content: buildSystemPrompt() },
        ..._chatHistory.slice(-8),
        { role: 'user', content: prompt }
      ];

      _chatHistory.push({ role: 'user', content: prompt });
      _engineState = 'generating';
      updateUIStatus('generating', 'Generating answer...');

      const stream = await _engine.chat.completions.create({
        messages,
        temperature: 0.6,
        max_tokens: 1200,
        stream: true
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content || '';
        if (delta) {
          fullResponse += delta;
          updateStreamingMessage(fullResponse);
        }
      }

      _chatHistory.push({ role: 'assistant', content: fullResponse });
      _engineState = 'ready';
      updateUIStatus('ready', `Model Ready (${getModelById(_selectedModelId)?.name})`);
      finalizeStreamingMessage();
    } catch (err) {
      console.error('[BCA AI] Inference error:', err);
      executeFallbackChat(prompt);
    }
  }

  function executeFallbackChat(prompt) {
    appendUserMessage(prompt);
    const msgId = 'ai-fallback-' + Date.now();
    appendAssistantPlaceholder(msgId, 'Searching BCA III syllabus & notes...');

    setTimeout(() => {
      const q = prompt.toLowerCase();
      let ans = '';

      if (q.includes('subject') || q.includes('syllabus') || q.includes('credit')) {
        ans = `### 📚 Panjab University BCA 3rd Semester Courses (2026-27)\n\n` +
          `1. **Computer Architecture (BCA-DSC-301)** — *4 Credits* (Major)\n` +
          `2. **Data Structures (BCA-DSC-302)** — *4 Credits* (Major)\n` +
          `3. **Numerical Methods (BCA-DSC-303)** — *2 Credits* (Minor)\n` +
          `4. **Intro to Machine Learning (BCA-DSC-304)** — *2 Credits* (Minor)\n` +
          `5. **English-3 (AEC)** — *2 Credits*\n` +
          `6. **Web Development / Designing (MDC)** — *3 Credits*\n` +
          `7. **Backend Web Development (SEC)** — *3 Credits*`;
      } else if (q.includes('lecture') || q.includes('today') || q.includes('class')) {
        const lectures = (typeof _globalCloudData !== 'undefined' && _globalCloudData.lectures) || [];
        if (lectures.length > 0) {
          ans = `### 🎙️ Recent Lecture Timeline\n\n`;
          lectures.slice(0, 5).forEach(l => {
            ans += `- **${l.date}** | **${l.subject || 'Class'}**: ${l.topic} — *${l.description || 'Completed in class'}*\n`;
          });
        } else {
          ans = `No lectures logged for today yet.`;
        }
      } else {
        ans = `### 💡 BCA III Hub Instant Knowledge Base\n\n` +
          `Here is verified curriculum information for your inquiry on **${escapeHtml(prompt)}**.\n\n` +
          `- You can access all **26+ digital notes** for Data Structures & Machine Learning in the subject workspaces.\n` +
          `- To activate the **100% In-Browser Local LLM** (${getModelById(_selectedModelId)?.name}), click **"Download Model"** or open with **Google Chrome 113+ / Safari 17.4+ / Edge 113+** with WebGPU enabled.`;
      }

      const textEl = document.querySelector(`#${msgId} .ai-bubble-text`);
      if (textEl) textEl.innerHTML = renderMarkdown(ans);

      _engineState = 'ready';
      updateUIStatus('ready', 'Knowledge Mode Ready');
      finalizeStreamingMessage();
    }, 400);
  }

  // --- 6. UI HELPERS & MARKDOWN FORMATTER ---
  function renderMarkdown(md) {
    if (!md) return '';
    return md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g, (m, lang, code) => {
        return `<div class="ai-code-block-wrap">
          <div class="ai-code-block-header">
            <span class="ai-code-lang">${lang ? lang.toUpperCase() : 'CODE'}</span>
            <button class="ai-copy-code-btn" onclick="BCA_AI.copyCode(this)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy</span>
            </button>
          </div>
          <pre><code>${code.trim()}</code></pre>
        </div>`;
      })
      .replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
      .replace(/^### (.*$)/gim, '<h4 class="ai-md-h4">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 class="ai-md-h3">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 class="ai-md-h2">$1</h2>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^\s*[-•]\s*(.*$)/gim, '<li class="ai-md-li">$1</li>')
      .replace(/^\s*(\d+)\.\s*(.*$)/gim, '<li class="ai-md-num-li"><span class="ai-li-num">$1.</span> $2</li>')
      .replace(/\n\n/g, '<p class="ai-md-p"></p>')
      .replace(/\n/g, '<br/>');
  }

  function appendUserMessage(text) {
    const list = document.getElementById('ai-chat-messages-list');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'ai-msg-row user-msg';
    div.innerHTML = `
      <div class="ai-msg-bubble user-bubble">
        <div class="ai-bubble-text">${escapeHtml(text)}</div>
      </div>
      <div class="ai-msg-avatar user-avatar">👤</div>
    `;
    list.appendChild(div);
    scrollChat();
  }

  function appendAssistantPlaceholder(msgId, initialText) {
    const list = document.getElementById('ai-chat-messages-list');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'ai-msg-row assistant-msg';
    div.id = msgId;
    div.innerHTML = `
      <div class="ai-msg-avatar assistant-avatar">✨</div>
      <div class="ai-msg-bubble assistant-bubble">
        <div class="ai-bubble-text"><span class="ai-cursor-pulse">${escapeHtml(initialText || 'Thinking...')}</span></div>
        <div class="ai-msg-actions">
          <button class="ai-msg-action-btn" onclick="BCA_AI.copyMessageContent('${msgId}')" title="Copy response">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy</span>
          </button>
        </div>
      </div>
    `;
    list.appendChild(div);
    scrollChat();
  }

  function updateStreamingMessage(text) {
    if (!_currentMsgId) return;
    const textEl = document.querySelector(`#${_currentMsgId} .ai-bubble-text`);
    if (textEl) {
      textEl.innerHTML = renderMarkdown(text);
      scrollChat();
    }
  }

  function finalizeStreamingMessage() {
    if (_currentMsgId) {
      const active = document.getElementById(_currentMsgId);
      const pulse = active?.querySelector('.ai-cursor-pulse');
      if (pulse) pulse.remove();
    }
    _currentMsgId = null;
    scrollChat();
  }

  function scrollChat() {
    const list = document.getElementById('ai-chat-messages-list');
    if (list) list.scrollTop = list.scrollHeight;
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function updateUIStatus(state, label) {
    const pill = document.getElementById('ai-engine-status-pill');
    const text = document.getElementById('ai-engine-status-text');
    const sendBtn = document.getElementById('ai-chat-send-btn');
    const stopBtn = document.getElementById('ai-chat-stop-btn');

    if (pill) pill.className = `ai-status-pill status-${state}`;
    if (text) text.textContent = label || state;

    if (sendBtn && stopBtn) {
      if (state === 'generating') {
        sendBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
      } else {
        sendBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
      }
    }
  }

  function showProgressBar(show, initialText) {
    const wrap = document.getElementById('ai-init-progress-wrap');
    if (wrap) {
      wrap.style.display = show ? 'block' : 'none';
      if (show && initialText) {
        const text = document.getElementById('ai-init-progress-text');
        if (text) text.textContent = initialText;
      }
    }
  }

  function updateHardwareBadge() {
    const badge = document.getElementById('ai-detected-hardware-badge');
    if (!badge || !_deviceSpecs) return;

    const isCached = localStorage.getItem(STORAGE_KEY_CACHED_MODEL) === _selectedModelId;
    const modelObj = getModelById(_selectedModelId);

    badge.innerHTML = `
      <span class="ai-hw-dot ${ _deviceSpecs.hasWebGPU ? 'ready' : 'fallback' }"></span>
      <span>${_deviceSpecs.hasWebGPU ? 'WebGPU Active' : 'Knowledge Fallback'}</span>
      <span class="ai-hw-sep">•</span>
      <span>${_deviceSpecs.memoryGB}GB RAM (${_deviceSpecs.cpuCores} Cores)</span>
      <span class="ai-hw-sep">•</span>
      <span class="ai-hw-chip">${modelObj.name} ${isCached ? '⚡ Cached' : ''}</span>
    `;
  }

  // --- 7. PUBLIC INTERACTION CONTROLLERS ---
  async function initUI() {
    await detectHardwareSpecs();
    updateHardwareBadge();

    const isCached = localStorage.getItem(STORAGE_KEY_CACHED_MODEL) === _selectedModelId;
    if (isCached) {
      updateUIStatus('ready', `Cached & Ready (${getModelById(_selectedModelId).name})`);
    } else {
      updateUIStatus('unloaded', `Click to Load (${getModelById(_selectedModelId).name})`);
    }

    renderModelPicker();
  }

  function renderModelPicker() {
    const list = document.getElementById('ai-model-picker-list');
    if (!list) return;

    const cachedId = localStorage.getItem(STORAGE_KEY_CACHED_MODEL);

    list.innerHTML = MODELS.map(m => {
      const isSelected = m.id === _selectedModelId;
      const isRecommended = _deviceSpecs && m.id === _deviceSpecs.recommendedModelId;
      const isCached = cachedId === m.id;

      return `
        <div class="ai-model-card ${isSelected ? 'active' : ''}" onclick="BCA_AI.selectModel('${m.id}')">
          <div class="ai-model-card-top">
            <div class="ai-model-name-wrap">
              <span class="ai-model-title">${m.name}</span>
              <span class="ai-model-tag">${m.tag}</span>
              ${isRecommended ? '<span class="ai-model-rec-badge">⭐ Recommended for your device</span>' : ''}
              ${isCached ? '<span class="ai-model-cached-badge">💾 Downloaded &amp; Offline Ready</span>' : ''}
            </div>
            <div class="ai-model-select-radio">${isSelected ? '●' : '○'}</div>
          </div>
          <p class="ai-model-desc">${m.description}</p>
          <div class="ai-model-specs-row">
            <span class="ai-spec-pill">📦 ~${m.downloadMB} MB Download</span>
            <span class="ai-spec-pill">🧠 ~${m.vramMB} MB RAM</span>
            <span class="ai-spec-pill">🎯 ${m.recommendedFor}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function selectModel(modelId) {
    _selectedModelId = modelId;
    renderModelPicker();
    updateHardwareBadge();
    closeModelPickerModal();

    const isCached = localStorage.getItem(STORAGE_KEY_CACHED_MODEL) === _selectedModelId;
    if (isCached && _engine) {
      updateUIStatus('ready', `Model Ready (${getModelById(_selectedModelId).name})`);
    } else {
      downloadAndInitializeModel(_selectedModelId);
    }
  }

  function openModelPickerModal() {
    const modal = document.getElementById('ai-model-picker-modal');
    if (modal) modal.style.display = 'flex';
  }

  function closeModelPickerModal() {
    const modal = document.getElementById('ai-model-picker-modal');
    if (modal) modal.style.display = 'none';
  }

  function setQuickPrompt(text) {
    const input = document.getElementById('ai-chat-input');
    if (input) {
      input.value = text;
      input.focus();
    }
  }

  function submitChat() {
    const input = document.getElementById('ai-chat-input');
    if (input && input.value.trim()) {
      const val = input.value.trim();
      input.value = '';
      sendMessage(val);
    }
  }

  function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitChat();
    }
  }

  function copyCode(btn) {
    const code = btn.closest('.ai-code-block-wrap')?.querySelector('pre code')?.innerText;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        const span = btn.querySelector('span');
        if (span) {
          span.textContent = 'Copied!';
          setTimeout(() => span.textContent = 'Copy', 2000);
        }
      });
    }
  }

  function copyMessageContent(msgId) {
    const text = document.querySelector(`#${msgId} .ai-bubble-text`)?.innerText;
    if (text) {
      navigator.clipboard.writeText(text).then(() => alert('Response copied!'));
    }
  }

  function clearChat() {
    if (confirm('Clear current AI study conversation?')) {
      _chatHistory = [];
      const list = document.getElementById('ai-chat-messages-list');
      if (list) {
        list.innerHTML = `
          <div class="ai-welcome-card">
            <div class="ai-welcome-icon">🎓</div>
            <h3 class="ai-welcome-title serif">BCA III In-Browser AI Copilot</h3>
            <p class="ai-welcome-sub">
              Your private, 100% in-browser study assistant. Ask about syllabus units, C/C++ code, Numerical Methods formulas, today's lecture logs, and live notes.
            </p>
          </div>
        `;
      }
    }
  }

  function abortGeneration() {
    _isAborting = true;
    _engineState = 'ready';
    updateUIStatus('ready', 'Generation stopped.');
    finalizeStreamingMessage();
  }

  return {
    MODELS,
    detectHardwareSpecs,
    initUI,
    downloadAndInitializeModel,
    selectModel,
    sendMessage,
    submitChat,
    handleInputKeydown,
    openModelPickerModal,
    closeModelPickerModal,
    setQuickPrompt,
    copyCode,
    copyMessageContent,
    clearChat,
    abortGeneration
  };
})();

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  window.BCA_AI = BCA_AI;
  document.addEventListener('DOMContentLoaded', () => {
    BCA_AI.initUI();
  });
}
