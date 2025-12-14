import { ai, MODEL_TRANSLATOR } from './gemini';
import { translationCache } from './translationCache';

interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  context?: string[];
}

interface TranslationResult {
  translation: string;
  fromCache: boolean;
  confidence?: number;
}

export class TranslationService {
  private queue: Array<{
    request: TranslationRequest;
    resolve: (result: TranslationResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private processing = false;
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second
  private concurrentLimit = 3;
  private activeRequests = 0;

  /**
   * Translate text with retry logic and caching
   */
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    // Check cache first
    const cached = translationCache.get(
      request.text,
      request.sourceLang,
      request.targetLang
    );

    if (cached) {
      return {
        translation: cached,
        fromCache: true,
        confidence: 1.0
      };
    }

    // Add to queue and process
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process translation queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    if (this.activeRequests >= this.concurrentLimit) return;

    this.processing = true;
    
    while (this.queue.length > 0 && this.activeRequests < this.concurrentLimit) {
      const item = this.queue.shift();
      if (!item) break;

      this.activeRequests++;
      
      this.translateWithRetry(item.request)
        .then(result => {
          item.resolve(result);
          this.activeRequests--;
          this.processQueue();
        })
        .catch(error => {
          item.reject(error);
          this.activeRequests--;
          this.processQueue();
        });
    }

    this.processing = false;
  }

  /**
   * Translate with exponential backoff retry
   */
  private async translateWithRetry(
    request: TranslationRequest,
    attempt = 0
  ): Promise<TranslationResult> {
    try {
      const translation = await this.performTranslation(request);
      
      // Cache successful translation
      translationCache.set(
        request.text,
        request.sourceLang,
        request.targetLang,
        translation
      );

      return {
        translation,
        fromCache: false,
        confidence: 0.9
      };
    } catch (error) {
      if (attempt < this.maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = this.baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
        return this.translateWithRetry(request, attempt + 1);
      }
      
      throw new Error(`Translation failed after ${this.maxRetries} attempts: ${error}`);
    }
  }

  /**
   * Perform actual translation using Gemini API
   */
  private async performTranslation(request: TranslationRequest): Promise<string> {
    const { text, sourceLang, targetLang, context } = request;

    // Build context-aware prompt
    let prompt = '';
    
    if (context && context.length > 0) {
      prompt += `Previous context:\n${context.join('\n')}\n\n`;
    }

    prompt += `Translate the following text from ${sourceLang} to ${targetLang}. `;
    prompt += `Maintain the original tone, style, and emotion. `;
    prompt += `Output ONLY the translation without any explanations or additional text.\n\n`;
    prompt += `Text to translate: "${text}"`;

    const response = await ai.models.generateContent({
      model: MODEL_TRANSLATOR,
      contents: prompt
    });

    const translation = response.text?.trim();

    if (!translation) {
      throw new Error('Empty translation response');
    }

    return translation;
  }

  /**
   * Batch translate multiple texts
   */
  async batchTranslate(
    texts: string[],
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult[]> {
    const promises = texts.map(text =>
      this.translate({ text, sourceLang, targetLang })
    );
    return Promise.all(promises);
  }

  /**
   * Detect language of text
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      const prompt = `Detect the language of the following text and respond with ONLY the ISO 639-1 language code (e.g., 'en', 'es', 'fr'). Text: "${text}"`;
      
      const response = await ai.models.generateContent({
        model: MODEL_TRANSLATOR,
        contents: prompt
      });

      const languageCode = response.text?.trim().toLowerCase();
      return languageCode || 'en';
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'en'; // Default to English
    }
  }

  /**
   * Get translation quality estimate
   */
  async getConfidence(translation: string): Promise<number> {
    // Simple heuristic: longer translations tend to be more accurate
    if (translation.length < 3) return 0.5;
    if (translation.length < 10) return 0.7;
    return 0.9;
  }

  /**
   * Clear translation queue
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      processing: this.processing
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const translationService = new TranslationService();
