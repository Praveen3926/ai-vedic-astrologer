import React, { useState } from 'react';
import { VPSDeploymentConfig } from '../types';
import { Server, Copy, Check, Download, Shield, Terminal, Globe, Cpu } from 'lucide-react';

export const DeploymentConfigurator: React.FC = () => {
  const [vpsConfig, setVpsConfig] = useState<VPSDeploymentConfig>({
    domainName: 'astrologer-api.yourdomain.com',
    port: 8000,
    gpuType: 'NVIDIA A10G (24GB)',
    gpuCount: 1,
    modelPathOrHfRepo: '/home/ubuntu/qwen2.5-vedic-astrologer-merged',
    maxModelLen: 4096,
    gpuMemoryUtilization: 0.90,
    tensorParallelSize: 1,
    apiAuthKey: 'sk-astrologer-secret-key-2026',
    enableSsl: true
  });

  const [activeFileTab, setActiveFileTab] = useState<'systemd' | 'nginx' | 'setup_sh' | 'test_curl'>('systemd');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Generate systemd unit file
  const generateSystemdService = () => {
    return `[Unit]
Description=vLLM OpenAI-Compatible API Server (Vedic Astrologer Qwen)
After=network.target nvidia-persistenced.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
Environment="PATH=/home/ubuntu/vllm_env/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"
ExecStart=/home/ubuntu/vllm_env/bin/python3 -m vllm.entrypoints.openai.api_server \\
  --model ${vpsConfig.modelPathOrHfRepo} \\
  --host 127.0.0.1 \\
  --port ${vpsConfig.port} \\
  --tensor-parallel-size ${vpsConfig.tensorParallelSize} \\
  --gpu-memory-utilization ${vpsConfig.gpuMemoryUtilization} \\
  --max-model-len ${vpsConfig.maxModelLen} \\
  --served-model-name qwen-vedic-astrologer \\
  --trust-remote-code

Restart=always
RestartSec=10
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target`;
  };

  // Generate Nginx configuration
  const generateNginxConf = () => {
    return `# Rate Limiting Zone setup
limit_req_zone $binary_remote_addr zone=astrologer_limit:10m rate=10r/s;

server {
    listen 80;
    server_name ${vpsConfig.domainName};

    location / {
        limit_req zone=astrologer_limit burst=20 nodelay;

        proxy_pass http://127.0.0.1:${vpsConfig.port};
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
        proxy_read_timeout 600s;
    }
}`;
  };

  // Generate Ubuntu Bash Setup Script
  const generateSetupSh = () => {
    return `#!/bin/bash
# One-Click VPS Production Setup Script for vLLM
set -e

echo "🚀 Starting VPS Environment Provisioning..."

# 1. Update Packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl wget git ufw nginx certbot python3-certbot-nginx

# 2. Configure Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable

# 3. Setup Python Virtual Environment
python3 -m venv ~/vllm_env
source ~/vllm_env/bin/activate
pip install --upgrade pip
pip install "vllm>=0.7.0" "openai>=1.60.0"

# 4. Create Systemd Service
sudo bash -c 'cat << "EOF" > /etc/systemd/system/vllm.service
${generateSystemdService()}
EOF'

# 5. Enable and Start vLLM
sudo systemctl daemon-reload
sudo systemctl enable vllm
sudo systemctl start vllm

# 6. Setup Nginx Site
sudo bash -c 'cat << "EOF" > /etc/nginx/sites-available/vllm
${generateNginxConf()}
EOF'

sudo ln -sf /etc/nginx/sites-available/vllm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

${vpsConfig.enableSsl ? `# 7. Issue SSL Certificate\nsudo certbot --nginx -d ${vpsConfig.domainName} --non-interactive --agree-tos -m admin@${vpsConfig.domainName}` : ''}

echo "✅ VPS Setup Complete! vLLM API Server is live at https://${vpsConfig.domainName}/v1"`;
  };

  // Generate Curl / OpenAI Test Script
  const generateTestCurl = () => {
    return `# Test API Endpoint via Curl
curl https://${vpsConfig.domainName}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "qwen-vedic-astrologer",
    "messages": [
      {
        "role": "system",
        "content": "You are an expert AI Vedic Astrologer..."
      },
      {
        "role": "user",
        "content": "My birth details are 14 Oct 1994, 08:30 AM, Bengaluru. Will I get a job offer soon?"
      }
    ],
    "temperature": 0.7,
    "max_tokens": 512,
    "stream": false
  }'`;
  };

  const getActiveCode = () => {
    if (activeFileTab === 'systemd') return generateSystemdService();
    if (activeFileTab === 'nginx') return generateNginxConf();
    if (activeFileTab === 'setup_sh') return generateSetupSh();
    return generateTestCurl();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono border border-indigo-500/30">
              VPS Infrastructure Generator
            </span>
            <span className="text-xs text-slate-400 font-mono">
              vLLM + Nginx + Systemd + Certbot
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            vLLM VPS Deployment Configurator
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Generate production-grade deployment configurations for hosting your fine-tuned Qwen model on an Ubuntu VPS with high throughput, streaming SSE, and SSL security.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <Globe className="w-8 h-8 text-indigo-400 shrink-0" />
          <div>
            <span className="text-[11px] font-mono text-slate-400 block uppercase">
              Target API Domain
            </span>
            <span className="text-sm font-bold text-indigo-300 font-mono truncate max-w-[200px] block">
              {vpsConfig.domainName}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Settings + File Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Settings */}
        <div className="lg:col-span-5 space-y-6 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Server className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              VPS Server Settings
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Domain Name */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">API Domain Name:</label>
              <input
                type="text"
                value={vpsConfig.domainName}
                onChange={(e) => setVpsConfig({ ...vpsConfig, domainName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Model Path */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Merged Model Local Path:</label>
              <input
                type="text"
                value={vpsConfig.modelPathOrHfRepo}
                onChange={(e) => setVpsConfig({ ...vpsConfig, modelPathOrHfRepo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* GPU Spec & Count */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">GPU Type:</label>
                <select
                  value={vpsConfig.gpuType}
                  onChange={(e) => setVpsConfig({ ...vpsConfig, gpuType: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 font-mono"
                >
                  <option value="NVIDIA A10G (24GB)">NVIDIA A10G (24GB)</option>
                  <option value="NVIDIA L4 (24GB)">NVIDIA L4 (24GB)</option>
                  <option value="NVIDIA RTX 4090 (24GB)">NVIDIA RTX 4090 (24GB)</option>
                  <option value="NVIDIA A100 (80GB)">NVIDIA A100 (80GB)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">GPU Count (TP Size):</label>
                <select
                  value={vpsConfig.tensorParallelSize}
                  onChange={(e) => setVpsConfig({ ...vpsConfig, tensorParallelSize: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 font-mono"
                >
                  <option value={1}>1 GPU (TP=1)</option>
                  <option value={2}>2 GPUs (TP=2)</option>
                  <option value={4}>4 GPUs (TP=4)</option>
                </select>
              </div>
            </div>

            {/* Max Model Len & Memory Utilization */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Max Context Len:</label>
                <select
                  value={vpsConfig.maxModelLen}
                  onChange={(e) => setVpsConfig({ ...vpsConfig, maxModelLen: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 font-mono"
                >
                  <option value={2048}>2048 tokens</option>
                  <option value={4096}>4096 tokens</option>
                  <option value={8192}>8192 tokens</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">GPU Utilization:</label>
                <select
                  value={vpsConfig.gpuMemoryUtilization}
                  onChange={(e) => setVpsConfig({ ...vpsConfig, gpuMemoryUtilization: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 font-mono"
                >
                  <option value={0.85}>85% VRAM</option>
                  <option value={0.90}>90% VRAM (Default)</option>
                  <option value={0.95}>95% VRAM</option>
                </select>
              </div>
            </div>

            {/* Enable SSL */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> Auto Certbot SSL:
              </span>
              <input
                type="checkbox"
                checked={vpsConfig.enableSsl}
                onChange={(e) => setVpsConfig({ ...vpsConfig, enableSsl: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Generated Configurations */}
        <div className="lg:col-span-7 space-y-4">
          {/* File Selector Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 font-mono text-xs">
              <button
                onClick={() => setActiveFileTab('systemd')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeFileTab === 'systemd' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                vllm.service
              </button>
              <button
                onClick={() => setActiveFileTab('nginx')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeFileTab === 'nginx' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                nginx.conf
              </button>
              <button
                onClick={() => setActiveFileTab('setup_sh')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeFileTab === 'setup_sh' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                setup_vps.sh
              </button>
              <button
                onClick={() => setActiveFileTab('test_curl')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeFileTab === 'test_curl' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                test_api.sh
              </button>
            </div>

            <button
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedCode ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Code Viewbox */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-x-auto shadow-2xl text-slate-200 leading-relaxed max-h-[550px] scrollbar-thin scrollbar-thumb-slate-800">
            <pre>
              <code>{getActiveCode()}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
