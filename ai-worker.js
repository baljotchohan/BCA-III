/**
 * BCA 3 Hub — WebLLM Dedicated Background Web Worker
 * Runs @mlc-ai/web-llm off the main UI thread with WebGPU acceleration,
 * persistent cache storage, and real-time streaming tokens.
 */

// Import WebLLM via ES Modules in Worker
import * as webllm from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.78/+esm";

let engine = null;
let currentModelId = null;
let isInitializing = false;

// Listen for commands from the main thread
self.onmessage = async (event) => {
  const { type, data, id } = event.data || {};

  switch (type) {
    case 'PING':
      self.postMessage({ type: 'PONG', id });
      break;

    case 'INIT':
      await handleInit(data, id);
      break;

    case 'CHAT':
      await handleChat(data, id);
      break;

    case 'ABORT':
      if (engine) {
        try {
          await engine.interruptGenerate();
        } catch (e) {
          console.warn('[WebLLM Worker] Interrupt failed:', e);
        }
      }
      self.postMessage({ type: 'ABORTED', id });
      break;

    case 'UNLOAD':
      await handleUnload(id);
      break;

    case 'CHECK_MODEL_CACHED':
      await handleCheckCached(data, id);
      break;

    default:
      console.warn('[WebLLM Worker] Unknown message type:', type);
  }
};

/**
 * Initialize the MLCEngine with progress callbacks
 */
async function handleInit(data, id) {
  const { modelId, appConfig } = data || {};
  if (!modelId) {
    self.postMessage({ type: 'ERROR', error: 'No modelId specified for initialization', id });
    return;
  }

  if (engine && currentModelId === modelId) {
    self.postMessage({ type: 'INIT_DONE', data: { modelId, alreadyLoaded: true }, id });
    return;
  }

  isInitializing = true;
  currentModelId = modelId;

  try {
    // Unload existing engine if switching models
    if (engine) {
      try {
        await engine.unload();
      } catch (e) {
        console.warn('[WebLLM Worker] Previous engine unload error:', e);
      }
      engine = null;
    }

    self.postMessage({
      type: 'INIT_PROGRESS',
      data: { progress: 0.01, text: `Preparing WebGPU engine for ${modelId}...`, timeElapsed: 0 },
      id
    });

    const initProgressCallback = (report) => {
      self.postMessage({
        type: 'INIT_PROGRESS',
        data: {
          progress: report.progress || 0,
          text: report.text || 'Loading model weights...',
          timeElapsed: report.timeElapsed || 0
        },
        id
      });
    const engineOpts = {
      initProgressCallback,
      logLevel: 'WARN'
    };

    if (appConfig && appConfig.model_list && Array.isArray(appConfig.model_list)) {
      engineOpts.appConfig = appConfig;
    }

    engine = await webllm.CreateMLCEngine(modelId, engineOpts);

    isInitializing = false;
    self.postMessage({
      type: 'INIT_DONE',
      data: { modelId, loadedSuccessfully: true },
      id
    });
  } catch (error) {
    isInitializing = false;
    console.error('[WebLLM Worker] Engine initialization failed:', error);
    self.postMessage({
      type: 'ERROR',
      error: error.message || String(error),
      stage: 'INIT',
      id
    });
  }
}

/**
 * Handle streaming chat completions
 */
async function handleChat(data, id) {
  const { messages, temperature = 0.6, max_tokens = 1024, top_p = 0.9 } = data || {};

  if (!engine) {
    self.postMessage({
      type: 'ERROR',
      error: 'AI Engine is not initialized. Please load a model first.',
      stage: 'CHAT',
      id
    });
    return;
  }

  try {
    const chunks = await engine.chat.completions.create({
      messages,
      temperature,
      max_tokens,
      top_p,
      stream: true,
      stream_options: { include_usage: true }
    });

    let fullText = '';
    let promptTokens = 0;
    let completionTokens = 0;

    for await (const chunk of chunks) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (delta) {
        fullText += delta;
        self.postMessage({
          type: 'CHAT_CHUNK',
          delta,
          text: fullText,
          id
        });
      }

      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens || 0;
        completionTokens = chunk.usage.completion_tokens || 0;
      }
    }

    self.postMessage({
      type: 'CHAT_DONE',
      data: {
        text: fullText,
        usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens }
      },
      id
    });
  } catch (error) {
    console.error('[WebLLM Worker] Chat generation failed:', error);
    self.postMessage({
      type: 'ERROR',
      error: error.message || String(error),
      stage: 'CHAT',
      id
    });
  }
}

/**
 * Check if a model is already stored in browser Cache Storage
 */
async function handleCheckCached(data, id) {
  const { modelId } = data || {};
  try {
    const hasModel = await webllm.hasModelInCache(modelId);
    self.postMessage({
      type: 'CHECK_MODEL_CACHED_RESULT',
      data: { modelId, isCached: !!hasModel },
      id
    });
  } catch (e) {
    self.postMessage({
      type: 'CHECK_MODEL_CACHED_RESULT',
      data: { modelId, isCached: false },
      id
    });
  }
}

/**
 * Unload model from VRAM/RAM
 */
async function handleUnload(id) {
  try {
    if (engine) {
      await engine.unload();
      engine = null;
      currentModelId = null;
    }
    self.postMessage({ type: 'UNLOAD_DONE', id });
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message || String(error), stage: 'UNLOAD', id });
  }
}
