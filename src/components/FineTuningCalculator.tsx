import React, { useState } from 'react';
import { FineTuningConfig } from '../types';
import { Cpu, Copy, Check, Sliders, HardDrive, Zap, Download, Terminal } from 'lucide-react';

export const FineTuningCalculator: React.FC = () => {
  const [config, setConfig] = useState<FineTuningConfig>({
    baseModel: 'Qwen/Qwen2.5-7B-Instruct',
    modelFamily: 'qwen2.5-7b',
    loraRank: 16,
    loraAlpha: 32,
    loraDropout: 0.05,
    quantizationBit: '4-bit',
    perDeviceBatchSize: 2,
    gradientAccumulationSteps: 8,
    learningRate: 0.0002,
    lrSchedulerType: 'cosine',
    warmupRatio: 0.03,
    numEpochs: 3,
    maxSeqLength: 2048,
    numGpus: 1,
    useFlashAttn2: true
  });

  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // VRAM Estimation Logic
  const getVramEstimate = () => {
    let baseVramGb = 14; // Default 7B FP16
    if (config.baseModel.includes('14B')) baseVramGb = 28;
    if (config.baseModel.includes('32B')) baseVramGb = 64;

    if (config.quantizationBit === '4-bit') {
      baseVramGb = baseVramGb * 0.35; // 4-bit quantization overhead
    } else if (config.quantizationBit === '8-bit') {
      baseVramGb = baseVramGb * 0.55;
    }

    // Context length and batch size overhead
    const contextMultiplier = (config.maxSeqLength / 2048) * (config.perDeviceBatchSize / 2);
    const totalVramPerGpu = Math.round((baseVramGb + contextMultiplier * 2.5) * 10) / 10;

    return totalVramPerGpu;
  };

  const estimatedVram = getVramEstimate();
  const effectiveBatchSize = config.perDeviceBatchSize * config.gradientAccumulationSteps * config.numGpus;

  // Generate dynamic PyTorch train.py script
  const generateTrainingScript = () => {
    return `import torch
from datasets import load_from_disk
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, prepare_model_for_kbit_training
from trl import SFTTrainer, SFTConfig

def train_qwen_astrologer():
    model_id = "${config.baseModel}"
    output_dir = "./qwen-astrologer-lora"

    # 1. Quantization Configuration
    ${
      config.quantizationBit === '4-bit'
        ? `bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True
    )`
        : config.quantizationBit === '8-bit'
        ? `bnb_config = BitsAndBytesConfig(load_in_8bit=True)`
        : `bnb_config = None`
    }

    # 2. Load Tokenizer & Model
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        ${config.quantizationBit !== 'none (FP16)' ? 'quantization_config=bnb_config,' : ''}
        device_map="auto",
        torch_dtype=torch.bfloat16,
        trust_remote_code=True${config.useFlashAttn2 ? ',\n        attn_implementation="flash_attention_2"' : ''}
    )

    # 3. PEFT LoRA Configuration
    ${config.quantizationBit !== 'none (FP16)' ? 'model = prepare_model_for_kbit_training(model)' : ''}

    peft_config = LoraConfig(
        r=${config.loraRank},
        lora_alpha=${config.loraAlpha},
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_dropout=${config.loraDropout},
        bias="none",
        task_type="CAUSAL_LM"
    )

    # 4. Dataset Loading
    dataset = load_from_disk("processed_qwen_astrology_ds")

    # 5. Training Arguments
    sft_config = SFTConfig(
        output_dir=output_dir,
        num_train_epochs=${config.numEpochs},
        per_device_train_batch_size=${config.perDeviceBatchSize},
        gradient_accumulation_steps=${config.gradientAccumulationSteps},
        learning_rate=${config.learningRate},
        lr_scheduler_type="${config.lrSchedulerType}",
        warmup_ratio=${config.warmupRatio},
        max_seq_length=${config.maxSeqLength},
        bf16=True,
        logging_steps=10,
        save_strategy="epoch",
        optim="${config.quantizationBit === '4-bit' ? 'paged_adamw_8bit' : 'adamw_torch'}",
        dataset_text_field="messages"
    )

    # 6. Initialize Trainer & Run
    trainer = SFTTrainer(
        model=model,
        args=sft_config,
        train_dataset=dataset,
        peft_config=peft_config,
        processing_class=tokenizer
    )

    print("🚀 Launching Qwen fine-tuning job...")
    trainer.train()

    # 7. Save Adapter
    trainer.model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print("✅ Fine-tuning completed! LoRA adapter saved.")

if __name__ == "__main__":
    train_qwen_astrologer()`;
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generateTrainingScript());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadScript = () => {
    const script = generateTrainingScript();
    const blob = new Blob([script], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'train_qwen_astrologer.py';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono border border-indigo-500/30">
              Interactive Hardware & Fine-Tuning Tool
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Qwen2.5 / Qwen3 QLoRA Generator
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Fine-Tuning Configurator & VRAM Calculator
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Customize model architectures, quantization, sequence lengths, and batch sizes to calculate GPU memory usage and output ready-to-run PyTorch SFT code.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <HardDrive className="w-8 h-8 text-amber-400 shrink-0" />
          <div>
            <span className="text-[11px] font-mono text-slate-400 block uppercase">
              Estimated VRAM / GPU
            </span>
            <span className="text-2xl font-extrabold text-amber-300 font-mono">
              ~{estimatedVram} GB
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls + Python Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Sliders & Selectors */}
        <div className="lg:col-span-5 space-y-6 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Hyperparameter Controls
            </h3>
          </div>

          {/* Base Model Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block font-sans">
              Base LLM Model Architecture:
            </label>
            <select
              value={config.baseModel}
              onChange={(e) => setConfig({ ...config, baseModel: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs font-mono focus:border-indigo-500 focus:outline-none"
            >
              <option value="Qwen/Qwen2.5-7B-Instruct">Qwen/Qwen2.5-7B-Instruct (Recommended)</option>
              <option value="Qwen/Qwen2.5-14B-Instruct">Qwen/Qwen2.5-14B-Instruct</option>
              <option value="Qwen/Qwen2.5-32B-Instruct">Qwen/Qwen2.5-32B-Instruct</option>
              <option value="Qwen/Qwen3-7B-Instruct">Qwen/Qwen3-7B-Instruct</option>
            </select>
          </div>

          {/* Quantization Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block font-sans">
              Quantization Precision (PEFT / QLoRA):
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {(['4-bit', '8-bit', 'none (FP16)'] as const).map((bit) => (
                <button
                  key={bit}
                  type="button"
                  onClick={() => setConfig({ ...config, quantizationBit: bit })}
                  className={`py-2 rounded-lg border transition-colors cursor-pointer ${
                    config.quantizationBit === bit
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {bit}
                </button>
              ))}
            </div>
          </div>

          {/* LoRA Rank r & Alpha */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                LoRA Rank ($r$): <span className="text-amber-400 font-mono">{config.loraRank}</span>
              </label>
              <input
                type="range"
                min="8"
                max="64"
                step="8"
                value={config.loraRank}
                onChange={(e) => setConfig({ ...config, loraRank: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                LoRA Alpha ($\alpha$): <span className="text-amber-400 font-mono">{config.loraAlpha}</span>
              </label>
              <input
                type="range"
                min="16"
                max="128"
                step="16"
                value={config.loraAlpha}
                onChange={(e) => setConfig({ ...config, loraAlpha: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Batch Size & Grad Accum */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Per Device Batch Size: <span className="text-amber-400 font-mono">{config.perDeviceBatchSize}</span>
              </label>
              <select
                value={config.perDeviceBatchSize}
                onChange={(e) => setConfig({ ...config, perDeviceBatchSize: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs font-mono"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={8}>8</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Gradient Accumulation: <span className="text-amber-400 font-mono">{config.gradientAccumulationSteps}</span>
              </label>
              <select
                value={config.gradientAccumulationSteps}
                onChange={(e) => setConfig({ ...config, gradientAccumulationSteps: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs font-mono"
              >
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={16}>16</option>
              </select>
            </div>
          </div>

          {/* Max Sequence Length */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Max Sequence Length (Tokens):
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {[1024, 2048, 4096].map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => setConfig({ ...config, maxSeqLength: len })}
                  className={`py-2 rounded-lg border transition-colors cursor-pointer ${
                    config.maxSeqLength === len
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {len} tokens
                </button>
              ))}
            </div>
          </div>

          {/* FlashAttention Toggle */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span>Use FlashAttention-2:</span>
            <input
              type="checkbox"
              checked={config.useFlashAttn2}
              onChange={(e) => setConfig({ ...config, useFlashAttn2: e.target.checked })}
              className="w-4 h-4 accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Calculated Specs Badge */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1 font-mono text-slate-300">
            <div className="flex justify-between">
              <span>Effective Batch Size:</span>
              <span className="text-amber-400 font-bold">{effectiveBatchSize}</span>
            </div>
            <div className="flex justify-between">
              <span>Hardware Compatibility:</span>
              <span className={estimatedVram <= 24 ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                {estimatedVram <= 24 ? 'Fits on 1x RTX 3090/4090 / L4 / A10G' : 'Requires A100 (40GB/80GB)'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Python Training Script Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Generated PyTorch Training Script (\`train_qwen_astrologer.py\`)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyScript}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadScript}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .py</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-x-auto shadow-2xl text-slate-200 leading-relaxed max-h-[600px] scrollbar-thin scrollbar-thumb-slate-800">
            <pre>
              <code>{generateTrainingScript()}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
