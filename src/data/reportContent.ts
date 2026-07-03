import { ReportSection } from '../types';

export const REPORT_SECTIONS: ReportSection[] = [
  {
    id: 'section-1-dataset-analysis',
    title: '1. Dataset Analysis & Architectural Alignment',
    subtitle: 'Format, System Prompts, Safety Guardrails, Response Style & Training Objectives',
    iconName: 'Database',
    estimatedReadTime: '8 min read',
    contentMarkdown: `
# 1. Dataset Analysis & Architectural Alignment

## 1.1 Conversation Format Analysis
The dataset is structured following the standardized multi-turn conversational format optimized for instruction-tuned Large Language Models (LLMs) such as **Qwen2.5** and **Qwen3**. Each conversation is formatted as a structured sequence of turns in JSON/ChatML schema, maintaining role attribution (\`system\`, \`user\`, and \`assistant\`).

### Schema Overview:
\`\`\`json
{
  "id": "conv-001",
  "messages": [
    {
      "role": "system",
      "content": "You are an expert AI Vedic Astrologer..."
    },
    {
      "role": "user",
      "content": "Hello, I was laid off two weeks ago..."
    },
    {
      "role": "assistant",
      "content": "I hear the deep pain and anxiety in your words..."
    }
  ]
}
\`\`\`

### Key Format Features:
1. **Multi-Turn Depth (15–20 Turns):** Unlike simple single-turn Q&A datasets, these extended conversations capture complex emotional trajectories, follow-up questions, edge cases, and evolving user concerns.
2. **System Prompt Anchorage:** Every conversation starts with a persistent system prompt that anchors the AI's persona, knowledge base, and safety boundaries.
3. **Explicit Role Mapping:** Compatible with standard ChatML delimiters (\`<|im_start|>system\`, \`<|im_start|>user\`, \`<|im_start|>assistant\`).

---

## 1.2 System Prompt Dissection
The system prompt defines the operational parameters of the AI Vedic Astrologer. It is designed to bridge ancient domain wisdom (*Jyotish Shastra*) with modern ethical AI safety practices.

### System Prompt Template:
> *"You are an expert AI Vedic Astrologer trained in traditional Jyotish Shastra (Parashari and Jaimini systems). Speak with profound empathy, compassion, and respect. When birth details are provided, always state: 'Please give me a moment while I draw up and carefully analyze your Kundli (birth chart)...' before presenting your analysis. Demonstrate mastery of Bhavas, Grahas, Rashis, Dashas, and Yogas. Adhere strictly to safety guardrails: NEVER predict death or terminal illness, NEVER guarantee future events, NEVER give medical or legal advice, and ALWAYS conclude with a balanced, hopeful prediction of an upcoming favorable time period."*

---

## 1.3 Safety Rules & Guardrails Breakdown

| Safety Guardrail | Rationale & Ethical Imperative | Implementation Strategy in Dataset |
| :--- | :--- | :--- |
| **No Death or Illness Predictions** | Predicting mortality or terminal disease causes severe psychological trauma, self-fulfilling anxiety, and medical harm. | Direct refusal & empathetic re-framing. Redirects physical symptoms to medical doctors. |
| **No Absolute Guarantees** | Deterministic guarantees ("You WILL win $1M") promote reckless behavior or passivity. | Probabilistic, window-based language ("astrological indicators support...", "a favorable time window opens..."). |
| **No Legal / Medical Advice** | AI models are not licensed physicians or attorneys. Unqualified advice poses real-world danger. | Explicit disclaimers and immediate referral to licensed professionals. |
| **Pragmatic Self-Effort (Karma)** | Astrology must empower personal agency (*Purushartha*), not foster fatalism. | Positions astrology as a weather forecast; hard work, ethics, and practical actions dictate outcomes. |

---

## 1.4 Response Style & Tone Analysis
- **Tone:** Warm, compassionate, respectful, emotionally grounded, and non-judgmental.
- **Structure:**
  1. *Validation & Empathy:* Acknowledges emotional state before technical analysis.
  2. *Kundli Calculation Pause:* Explicit acknowledgment protocol before delivering chart analysis.
  3. *Technical Breakdown:* Clear explanation of Houses (Bhavas), Planets (Grahas), Vimshottari Dashas, and Transits (Gochar).
  4. *Practical Remedies:* Simple, cost-free habits (discipline, meditation, morning routine, charity).
  5. *Balanced Outlook:* Ending with an empowering, favorable upcoming time window.

---

## 1.5 Training Objective
The core objective of fine-tuning Qwen on this dataset is **Domain Adaptation with Supervised Safety Guardrails (SFT)**. It aligns a base foundation model to adopt a specific empathetic persona while learning negative constraints (refusal behaviors) for hazardous queries.
`
  },
  {
    id: 'section-2-fine-tuning-guide',
    title: '2. Complete Step-by-Step Fine-Tuning Guide (Qwen2.5 / Qwen3)',
    subtitle: 'Environment Setup, QLoRA, PEFT, TRL SFTTrainer, Hyperparameters & Inference',
    iconName: 'Cpu',
    estimatedReadTime: '12 min read',
    contentMarkdown: `
# 2. Step-by-Step Fine-Tuning Guide for Qwen2.5 / Qwen3

This section provides a production-ready, step-by-step technical guide for fine-tuning **Qwen2.5-7B-Instruct** (or Qwen3-7B) using **QLoRA (Quantized Low-Rank Adaptation)** with Hugging Face **PEFT** and TRL **SFTTrainer**.

---

## 2.1 Environment Setup
Execute the following commands in an Ubuntu 22.04 LTS environment with NVIDIA GPU support (e.g., A10G, L4, RTX 3090/4090, or A100).

\`\`\`bash
# Create and activate Python 3.10 virtual environment
python3 -m venv qwen_env
source qwen_env/bin/activate

# Upgrade pip and CUDA toolkit dependencies
pip install --upgrade pip setuptools wheel

# Install PyTorch with CUDA 12.1 support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install Hugging Face & Fine-Tuning Libraries
pip install "transformers>=4.48.0" "datasets>=3.2.0" "peft>=0.14.0" "trl>=0.14.0" "bitsandbytes>=0.45.0" "accelerate>=1.2.0" "sentencepiece" "protobuf"

# Optional: Install FlashAttention-2 for faster training (Ampere or newer GPUs)
pip install flash-attn --no-build-isolation
\`\`\`

---

## 2.2 Dataset Preparation Script (\`prepare_dataset.py\`)
Convert raw conversation JSON into Hugging Face \`Dataset\` format formatted with Qwen's standard ChatML template.

\`\`\`python
import json
from datasets import Dataset

def format_conversations(json_filepath):
    with open(json_filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    formatted_records = []
    for conv in data:
        messages = conv["messages"]
        # Format as list of dicts with role and content
        formatted_records.append({"messages": messages})
        
    dataset = Dataset.from_list(formatted_records)
    return dataset

if __name__ == "__main__":
    ds = format_conversations("vedic_astrologer_dataset.json")
    ds.save_to_disk("processed_qwen_astrology_ds")
    print(f"Dataset successfully saved with {len(ds)} conversations!")
\`\`\`

---

## 2.3 Hyperparameter Matrix & Rationale

| Hyperparameter | Value | Technical Rationale |
| :--- | :--- | :--- |
| **Base Model** | \`Qwen/Qwen2.5-7B-Instruct\` | High reasoning capacity, strong multilingual support, native ChatML support. |
| **Quantization** | 4-bit NF4 (\`bitsandbytes\`) | Reduces base model VRAM from ~15GB to ~5.5GB, allowing training on 24GB GPUs. |
| **LoRA Rank ($r$)** | \`16\` | Provides sufficient adaptation capacity for style/persona without overfitting. |
| **LoRA Alpha ($\alpha$)** | \`32\` | Standard $2 \\times r$ scaling factor for stable gradient flow. |
| **Target Modules** | All Linear Projections | Targets \`q_proj\`, \`k_proj\`, \`v_proj\`, \`o_proj\`, \`gate_proj\`, \`up_proj\`, \`down_proj\`. |
| **Learning Rate** | \`2e-4\` | Optimal learning rate for LoRA adapters with Cosine decay schedule. |
| **Batch Size** | \`2\` per device | Fits within 24GB VRAM. |
| **Gradient Accumulation** | \`8\` | Yields effective batch size of $2 \\times 8 = 16$. |
| **Max Sequence Length** | \`2048\` / \`4096\` | Captures long 15–20 turn conversations without truncating history. |
| **Epochs** | \`3\` | Prevents catastrophic forgetting while embedding guardrails. |
| **Optimizer** | \`paged_adamw_8bit\` | Memory-efficient 8-bit AdamW optimizer with page swapping to CPU RAM. |

---

## 2.4 Complete Production Training Script (\`train.py\`)

\`\`\`python
import os
import torch
from datasets import load_from_disk
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer, SFTConfig

def train():
    model_id = "Qwen/Qwen2.5-7B-Instruct"
    output_dir = "./qwen2.5-vedic-astrologer-adapter"
    
    # 1. Configure 4-bit Quantization (QLoRA)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True
    )
    
    # 2. Load Model & Tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        model_id,
        trust_remote_code=True,
        padding_side="right"
    )
    tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
        torch_dtype=torch.bfloat16
    )
    
    # 3. Prepare Model for PEFT
    model = prepare_model_for_kbit_training(model)
    
    # 4. LoRA Adapter Configuration
    peft_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj"
        ],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )
    
    # 5. Load Prepared Dataset
    dataset = load_from_disk("processed_qwen_astrology_ds")
    
    # 6. Training Arguments (SFTConfig)
    sft_config = SFTConfig(
        output_dir=output_dir,
        num_train_epochs=3,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=8,
        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        warmup_ratio=0.03,
        logging_steps=10,
        save_strategy="epoch",
        bf16=True,
        max_seq_length=2048,
        dataset_text_field="messages",
        packing=False,
        optim="paged_adamw_8bit",
        report_to="none"
    )
    
    # 7. Initialize SFTTrainer
    trainer = SFTTrainer(
        model=model,
        args=sft_config,
        train_dataset=dataset,
        peft_config=peft_config,
        processing_class=tokenizer
    )
    
    # 8. Execute Training
    print("Starting Qwen fine-tuning...")
    trainer.train()
    
    # 9. Save Final Adapter
    trainer.model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"Training completed! LoRA adapter saved to {output_dir}")

if __name__ == "__main__":
    train()
\`\`\`

---

## 2.5 Merging LoRA Weights (\`merge_weights.py\`)
To deploy with **vLLM**, we merge the LoRA adapter weights directly into the base Qwen model.

\`\`\`python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model_id = "Qwen/Qwen2.5-7B-Instruct"
adapter_dir = "./qwen2.5-vedic-astrologer-adapter"
merged_output_dir = "./qwen2.5-vedic-astrologer-merged"

print("Loading base model in FP16...")
base_model = AutoModelForCausalLM.from_pretrained(
    base_model_id,
    torch_dtype=torch.float16,
    device_map="cpu"
)

tokenizer = AutoTokenizer.from_pretrained(adapter_dir)

print("Loading LoRA adapter...")
peft_model = PeftModel.from_pretrained(base_model, adapter_dir)

print("Merging weights...")
merged_model = peft_model.merge_and_unload()

print(f"Saving merged model to {merged_output_dir}...")
merged_model.save_pretrained(merged_output_dir)
tokenizer.save_pretrained(merged_output_dir)
print("Merge complete! Ready for vLLM deployment.")
\`\`\`
`
  },
  {
    id: 'section-3-deployment-guide',
    title: '3. Production Deployment Guide on VPS using vLLM',
    subtitle: 'VPS Hardware Specs, Ubuntu Setup, CUDA, vLLM Server, Systemd, Nginx & SSL',
    iconName: 'Server',
    estimatedReadTime: '10 min read',
    contentMarkdown: `
# 3. Production VPS Deployment Guide using vLLM

This section covers deploying the fine-tuned **Qwen2.5 / Qwen3 Vedic Astrologer** model on a Virtual Private Server (VPS) using **vLLM** for high-throughput, OpenAI-compatible API serving.

---

## 3.1 VPS Hardware Requirements Matrix

| Model Parameter | Precision | Minimum GPU VRAM | Recommended VPS Spec | Provider Examples |
| :--- | :--- | :--- | :--- | :--- |
| **Qwen2.5-7B** | FP16 / BF16 | 16 GB VRAM | 1x NVIDIA A10G / L4 (24GB), 32GB RAM, 100GB NVMe | AWS g5.xlarge, GCP g2-standard-8, RunPod |
| **Qwen2.5-7B** | AWQ 4-bit | 10 GB VRAM | 1x NVIDIA RTX 3090 / 4090 (24GB), 16GB RAM | Vast.ai, Hetzner GPU |
| **Qwen2.5-14B** | FP16 / BF16 | 32 GB VRAM | 1x NVIDIA A100 (40GB) or 2x L4 (24GB) | AWS g5.12xlarge, Lambda Labs |
| **Qwen2.5-32B** | AWQ 4-bit | 24 GB VRAM | 1x NVIDIA A10G / L4 / RTX 4090 (24GB) | RunPod, FluidStack |

---

## 3.2 System Setup & NVIDIA Drivers (Ubuntu 22.04 LTS)

\`\`\`bash
# Update system packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl wget git ufw nginx certbot python3-certbot-nginx

# Configure UFW Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Install NVIDIA Drivers (Version 550+)
sudo apt install -y nvidia-driver-550 nvidia-utils-550
sudo reboot

# Verify NVIDIA GPU installation
nvidia-smi
\`\`\`

---

## 3.3 vLLM Installation & Verification

\`\`\`bash
# Create dedicated python venv
python3 -m venv vllm_env
source vllm_env/bin/activate

# Install vLLM with OpenAI API support
pip install --upgrade pip
pip install "vllm>=0.7.0" "openai>=1.60.0"

# Verify installation
python3 -c "import vllm; print('vLLM Version:', vllm.__version__)"
\`\`\`

---

## 3.4 vLLM OpenAI-Compatible Server Command
Start the server listening locally on port \`8000\`:

\`\`\`bash
python3 -m vllm.entrypoints.openai.api_server \
  --model ./qwen2.5-vedic-astrologer-merged \
  --host 127.0.0.1 \
  --port 8000 \
  --tensor-parallel-size 1 \
  --gpu-memory-utilization 0.90 \
  --max-model-len 4096 \
  --served-model-name "qwen-vedic-astrologer" \
  --trust-remote-code
\`\`\`

---

## 3.5 Systemd Automation (\`/etc/systemd/system/vllm.service\`)
Ensure automatic start on server reboot and background execution.

\`\`\`ini
[Unit]
Description=vLLM OpenAI-Compatible API Service
After=network.target nvidia-persistenced.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
Environment="PATH=/home/ubuntu/vllm_env/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"
ExecStart=/home/ubuntu/vllm_env/bin/python3 -m vllm.entrypoints.openai.api_server \
  --model /home/ubuntu/qwen2.5-vedic-astrologer-merged \
  --host 127.0.0.1 \
  --port 8000 \
  --tensor-parallel-size 1 \
  --gpu-memory-utilization 0.90 \
  --max-model-len 4096 \
  --served-model-name qwen-vedic-astrologer

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
\`\`\`

Enable and start the systemd service:
\`\`\`bash
sudo systemctl daemon-reload
sudo systemctl enable vllm
sudo systemctl start vllm
sudo systemctl status vllm
\`\`\`

---

## 3.6 Nginx Reverse Proxy & SSL Setup

Create Nginx site configuration at \`/etc/nginx/sites-available/vllm\`:

\`\`\`nginx
# Rate Limiting Zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    server_name astrologer-api.yourdomain.com;

    location / {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE Streaming Headers for Chat Completions
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }
}
\`\`\`

Enable configuration and issue SSL certificate:
\`\`\`bash
sudo ln -s /etc/nginx/sites-available/vllm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue Let's Encrypt SSL Certificate
sudo certbot --nginx -d astrologer-api.yourdomain.com
\`\`\`

---

## 3.7 API Verification using \`curl\` and Python

### Testing via \`curl\`:
\`\`\`bash
curl https://astrologer-api.yourdomain.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen-vedic-astrologer",
    "messages": [
      {
        "role": "system",
        "content": "You are an expert AI Vedic Astrologer..."
      },
      {
        "role": "user",
        "content": "My birth details are 14 Oct 1994, 08:30 AM, Bengaluru. Will I get a job soon?"
      }
    ],
    "temperature": 0.7,
    "max_tokens": 512
  }'
\`\`\`
`
  },
  {
    id: 'section-4-synthetic-dataset',
    title: '4. Five Original 15–20 Turn Training Conversations',
    subtitle: 'Manually Crafted Synthetic Training Conversations Demonstrating Ethics & Vedic Astrology Knowledge',
    iconName: 'MessageSquare',
    estimatedReadTime: '15 min read',
    contentMarkdown: `
# 4. Original Training Conversations (15–20 Turns Each)

Below is an overview of the 5 original multi-turn conversations included in the training dataset. Each conversation is 15–20 turns long, manually written to demonstrate empathy, Kundli calculation pauses, deep Vedic terminology, strict refusal of death/disease/guarantees/legal/medical advice, and balanced upcoming timing predictions.

*(Note: You can explore the full interactive turn-by-turn breakdown and download the dataset files in the **Dataset Explorer** tab).*

---

### Summary Table of Conversations:

| Conv ID | Topic / Persona | Turn Count | Key Safety & Astrological Traits Demonstrated |
| :--- | :--- | :--- | :--- |
| **Conv 1** | Career Transition & Layoff Anxiety (Rahul, 30, Software Eng) | **16 Turns** | Saturn Mahadasha analysis, refusal of absolute guarantees, refusal of high-risk day trading speculation, practical remedies, balanced upcoming Jupiter transit. |
| **Conv 2** | Relationship & Late Marriage (Ananya, 31, Marketing Lead) | **18 Turns** | Demystifying Mangal Dosha, 7th house breakdown, refusal of death predictions, Guna Milan context, refusal to ignore real-world red flags, balanced Q4 timing window. |
| **Conv 3** | Financial Risk & Startup Loan (Vikram, 36, Founder) | **16 Turns** | Dhana Yoga analysis, debt caution under Saturn transit, refusal of legal advice / mandatory legal counsel, debunking black magic, practical cash flow planning. |
| **Conv 4** | Foreign Education & Visa Delay (Priya, 23, Student) | **18 Turns** | 9th & 12th house foreign indicators, refusal of disease/death predictions, refusal of fraudulent visa documents, panic attack support, balanced relocation timing. |
| **Conv 5** | Mental Burnout & Sade Sati (Rohan, 38, Director) | **16 Turns** | Demystifying Sade Sati phase, strict medical referral for chest tightness, refusal of expensive gemstone exploitation, 12th house Sun spiritual guidance, upcoming Jupiter transit. |
`
  },
  {
    id: 'section-5-dataset-suitability',
    title: '5. Dataset Suitability & Technical Justification for Fine-Tuning',
    subtitle: 'Why these conversations are ideal for SFT Alignment, Guardrail Enforcement & Context Preservation',
    iconName: 'CheckCircle',
    estimatedReadTime: '6 min read',
    contentMarkdown: `
# 5. Dataset Suitability Analysis

This section explains why this dataset of 15–20 turn synthetic conversations is technically optimal for fine-tuning foundation models like Qwen2.5 and Qwen3.

---

## 5.1 Multi-Turn Context Window & State Retention
Standard fine-tuning datasets often consist of brief single-turn Q&A pairs (e.g., "What is 10th house?"). In real-world deployment, users engage in long, emotionally charged conversations where they ask follow-up questions, express doubt, push back on advice, or request clarifications.

- **Context Depth:** Each 15–20 turn conversation trains the model to retain earlier conversational state (e.g., remembering birth details provided in Turn 3 during Turn 14).
- **Attention Map Reinforcement:** Longer sequences ($2048 - 4096$ tokens) condition Qwen's self-attention mechanism to maintain role consistency across extended dialogues.

---

## 5.2 Negative Constraint Training (Guardrail Embedding)
LLMs tend to suffer from "sycophancy"—agreeing with whatever the user asks, including dangerous requests (e.g., "Guarantee I won't lose money" or "Predict when my boss will die").

By explicitly including user prompts that trigger safety boundaries followed by compliant refusal patterns, the dataset teaches the model:
1. **Refusal Pattern Recognition:** Identifying queries that request medical diagnoses, death predictions, or absolute guarantees.
2. **Empathetic Pivot:** Refusing the unsafe prompt politely without breaking persona or appearing cold.

---

## 5.3 Domain Vocabulary Grounding without Hallucinated Certainty
Vedic Astrology involves intricate technical jargon (Bhavas, Rashis, Dashas, Gochar, Yogas). Un-tuned base LLMs frequently hallucinate astronomical terms or misapply rules.

- **Rule Consistency:** The dataset reinforces accurate Parashari rules (e.g., correctly identifying that Mars in the 11th house does not create a malefic 7th-house Manglik Dosha).
- **Epistemic Modality:** The model learns to adopt probabilistic phrasing ("astrological indicators suggest", "a supportive window opens") rather than absolute claims.

---

## 5.4 Conclusion
This dataset serves as a robust benchmark for Supervised Fine-Tuning, resulting in an AI Vedic Astrologer that is **empathetic, technically grounded, ethically guarded, and production-ready**.
`
  }
];
