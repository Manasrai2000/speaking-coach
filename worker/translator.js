import { pipeline, env } from '@xenova/transformers';

// Skip local model checks since we are running in the browser
env.allowLocalModels = false;
env.useBrowserCache = true;

class TranslatorPipeline {
  static task = 'translation';
  static modelPrefix = 'Xenova/opus-mt-';
  static instance = null;

  static async getInstance(progress_callback = null, sourceLang, targetLang) {
    // English 'en', Hindi 'hi'
    // opus-mt handles direction gracefully via models: en-hi and hi-en
    let modelName = `${this.modelPrefix}${sourceLang}-${targetLang}`;
    
    // If we request a different model direction, we might need a new pipeline instance,
    // so we store the current model name on the instance.
    if (this.instance === null || this.currentModel !== modelName) {
      this.instance = pipeline(this.task, modelName, { progress_callback });
      this.currentModel = modelName;
    }

    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { text, sourceLang, targetLang } = event.data;

  // We only support en->hi or hi->en for this specific model set
  if ((sourceLang !== 'en' && sourceLang !== 'hi') || (targetLang !== 'en' && targetLang !== 'hi')) {
    self.postMessage({
      status: 'error',
      error: 'Invalid language pair supported by this worker.'
    });
    return;
  }

  // Same language translation is just returning the text
  if (sourceLang === targetLang) {
    self.postMessage({
      status: 'complete',
      output: [ { translation_text: text } ]
    });
    return;
  }

  try {
    // Send a message indicating we are initializing / downloading model
    self.postMessage({ status: 'init' });

    // Retrieve the translation pipeline
    let translator = await TranslatorPipeline.getInstance(x => {
      // Callback for model loading progress
      self.postMessage({ ...x, status: 'progress' });
    }, sourceLang, targetLang);

    // Send a message that we started translating
    self.postMessage({ status: 'translating', text });

    // Actually perform the translation
    let output = await translator(text);

    // Send the output back to the main thread
    self.postMessage({
      status: 'complete',
      output: output,
    });
  } catch (err) {
    console.error('Translation error:', err);
    self.postMessage({ status: 'error', error: err.message });
  }
});
