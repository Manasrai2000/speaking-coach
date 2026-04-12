import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3/dist/transformers.min.js';

// Configuration
env.allowLocalModels = false;
env.useBrowserCache = true;

// Using smaller Opus-MT models for fast testing (~30MB vs ~130MB)
const MODEL_PREFIX = 'Xenova/opus-mt-';

class TranslatorManager {
  static task = 'translation';
  static instances = {};

  static async getInstance(progress_callback = null, modelName) {
    if (!this.instances[modelName]) {
      console.log(`[Worker] Initializing Compact model: ${modelName}...`);
      try {
        // Attempt WebGPU first
        this.instances[modelName] = await pipeline(this.task, modelName, { 
          device: 'webgpu',
          progress_callback 
        });
        self.postMessage({ status: 'hardware_info', device: 'webgpu' });
      } catch (err) {
        console.warn(`[Worker] WebGPU failed, falling back to WASM for ${modelName}:`, err);
        // Fallback to WASM
        this.instances[modelName] = await pipeline(this.task, modelName, { 
          device: 'wasm', 
          progress_callback 
        });
        self.postMessage({ status: 'hardware_info', device: 'wasm' });
      }
    }
    return this.instances[modelName];
  }
}

// Handle messages
self.addEventListener('message', async (event) => {
  const { action, text, sourceLang, targetLang } = event.data;

  // Determine model name for En <-> Hi
  const modelName = `${MODEL_PREFIX}${sourceLang}-${targetLang}`;

  // Action: Warmup (Pre-load models)
  if (action === 'warmup') {
    console.log('[Worker] Warming up Compact models...');
    try {
      // Warm up both directions for Hindi-English UI
      await TranslatorManager.getInstance(x => {
        self.postMessage({ ...x, type: 'download_progress' });
      }, 'Xenova/opus-mt-en-hi');
      
      await TranslatorManager.getInstance(x => {
        self.postMessage({ ...x, type: 'download_progress' });
      }, 'Xenova/opus-mt-hi-en');
      
      console.log(`[Worker] Warmup complete.`);
    } catch (err) {
      console.error('[Worker] Warmup error:', err);
    }
    return;
  }

  // Action: Translate
  if (sourceLang === targetLang) {
    self.postMessage({ status: 'complete', output: [{ translation_text: text }] });
    return;
  }

  try {
    self.postMessage({ status: 'init' });

    let translator = await TranslatorManager.getInstance(x => {
      self.postMessage({ ...x, type: 'download_progress' });
    }, modelName);

    self.postMessage({ status: 'translating', text });

    const startTime = performance.now();
    
    // Opus-MT translation
    let output = await translator(text);
    
    const endTime = performance.now();
    
    console.log(`[Worker] Translation took ${(endTime - startTime).toFixed(2)}ms`);

    self.postMessage({ 
      status: 'complete', 
      output: output,
      latency: (endTime - startTime).toFixed(0)
    });
  } catch (err) {
    console.error('Translation error:', err);
    self.postMessage({ status: 'error', error: err.message });
  }
});
