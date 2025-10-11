/**
 * ModelManager - Manages LLM model loading and configuration
 * Implements FR7: Model Management
 */
export class ModelManager {
  constructor() {
    this.currentModel = null;
    this.isLoading = false;
    this.models = [
      {
        id: 'tinyllama-1.1b',
        name: 'TinyLLaMA 1.1B',
        size: 650, // MB
        quantization: 'Q4_K_M',
        parameters: '1.1B',
        source: 'https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0',
        memoryRequired: 1200, // MB
        estimatedLatency: 2000 // ms
      },
      {
        id: 'phi-2',
        name: 'Phi-2',
        size: 1500, // MB
        quantization: 'Q4_0',
        parameters: '2.7B',
        source: 'https://huggingface.co/microsoft/phi-2',
        memoryRequired: 2500, // MB
        estimatedLatency: 3000 // ms
      },
      {
        id: 'mistral-7b-mini',
        name: 'Mistral 7B Mini',
        size: 3700, // MB
        quantization: 'Q4_K_M',
        parameters: '7B',
        source: 'https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.1',
        memoryRequired: 5000, // MB
        estimatedLatency: 4500 // ms
      }
    ];

    this.status = 'uninitialized';
    this.loadedModel = null;
  }

  /**
   * Get all available models
   */
  getAvailableModels() {
    return this.models;
  }

  /**
   * Get a specific model by ID
   */
  getModel(modelId) {
    return this.models.find(m => m.id === modelId);
  }

  /**
   * Load a model (FR7)
   */
  async loadModel(modelId) {
    if (this.isLoading) {
      throw new Error('Model loading already in progress');
    }

    const model = this.getModel(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    this.isLoading = true;
    this.status = 'loading';

    try {
      // Simulate model loading with delay based on size
      const loadTime = Math.max(1000, model.size / 100);
      await new Promise(resolve => setTimeout(resolve, loadTime));

      this.currentModel = model;
      this.loadedModel = model;
      this.status = 'ready';

      return {
        success: true,
        model: model,
        loadedAt: new Date()
      };
    } catch (error) {
      this.status = 'error';
      throw new Error(`Failed to load model: ${error.message}`);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Unload current model (FR7)
   */
  unloadModel() {
    if (this.loadedModel) {
      const unloadedModel = this.loadedModel;
      this.currentModel = null;
      this.loadedModel = null;
      this.status = 'uninitialized';
      return unloadedModel;
    }
    return null;
  }

  /**
   * Get currently loaded model
   */
  getCurrentModel() {
    return this.currentModel;
  }

  /**
   * Check if a model is loaded
   */
  isModelLoaded() {
    return this.currentModel !== null && this.status === 'ready';
  }

  /**
   * Get model status
   */
  getStatus() {
    return {
      status: this.status,
      isLoading: this.isLoading,
      currentModel: this.currentModel,
      loadedModel: this.loadedModel
    };
  }

  /**
   * Validate model configuration (FR7)
   */
  validateModel(modelId, availableMemory) {
    const model = this.getModel(modelId);
    if (!model) {
      return {
        valid: false,
        errors: ['Model not found']
      };
    }

    const errors = [];

    if (model.size > 5000) {
      errors.push('Model size exceeds recommended limit (5000 MB)');
    }

    if (model.memoryRequired > availableMemory) {
      errors.push(`Model requires ${model.memoryRequired}MB, but only ${availableMemory}MB available`);
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: model.estimatedLatency > 5000 ? ['Model may have slow inference on this hardware'] : []
    };
  }

  /**
   * Get model recommendations based on available resources
   */
  getRecommendations(availableMemory, preferredSpeed = 'balanced') {
    const compatible = this.models.filter(m => m.memoryRequired <= availableMemory);

    if (compatible.length === 0) {
      return {
        recommended: null,
        message: 'No models compatible with available memory'
      };
    }

    let recommended;
    if (preferredSpeed === 'fast') {
      recommended = compatible.reduce((prev, curr) =>
        curr.estimatedLatency < prev.estimatedLatency ? curr : prev
      );
    } else if (preferredSpeed === 'quality') {
      recommended = compatible.reduce((prev, curr) =>
        curr.parameters > prev.parameters ? curr : prev
      );
    } else {
      // balanced
      recommended = compatible[Math.floor(compatible.length / 2)];
    }

    return {
      recommended: recommended,
      compatible: compatible,
      message: `Found ${compatible.length} compatible models`
    };
  }

  /**
   * Get model capabilities
   */
  getModelCapabilities(modelId) {
    const model = this.getModel(modelId);
    if (!model) return null;

    return {
      model: model.id,
      capabilities: [
        'Text generation',
        'Chat completions',
        'Context understanding',
        'Instruction following'
      ],
      limitations: [
        'CPU-only inference',
        'Limited context window',
        'No vision capabilities'
      ],
      bestFor: [
        'General Q&A',
        'Conversation',
        'Text summarization',
        'Basic reasoning'
      ]
    };
  }

  /**
   * Format model info for display
   */
  formatModelInfo(model) {
    return `
Model: ${model.name}
Parameters: ${model.parameters}
Size: ${(model.size / 1024).toFixed(2)}GB
Quantization: ${model.quantization}
Memory Required: ${(model.memoryRequired / 1024).toFixed(2)}GB
Est. Latency: ${model.estimatedLatency / 1000}s
Source: ${model.source}
    `.trim();
  }
}
