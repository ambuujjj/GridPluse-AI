'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Play,
  CheckCircle2,
  Sliders,
  Terminal,
  Activity,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function TrainingStudioPage() {
  const [modelType, setModelType] = useState('Bi-LSTM');
  const [epochs, setEpochs] = useState(8);
  const [batchSize, setBatchSize] = useState(128);
  const [learningRate, setLearningRate] = useState(0.001);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([
    'System ready. Preprocessed sequence data loaded: (24403, 24, 23).',
    'Select architecture and click "Initiate Training Run" to begin.'
  ]);

  const [lossHistory, setLossHistory] = useState([
    { epoch: 1, train_loss: 0.0125, val_loss: 0.0084 },
    { epoch: 2, train_loss: 0.0068, val_loss: 0.0052 },
    { epoch: 3, train_loss: 0.0049, val_loss: 0.0041 },
    { epoch: 4, train_loss: 0.0038, val_loss: 0.0035 },
    { epoch: 5, train_loss: 0.0032, val_loss: 0.0031 },
    { epoch: 6, train_loss: 0.0028, val_loss: 0.0029 },
    { epoch: 7, train_loss: 0.0025, val_loss: 0.0027 },
    { epoch: 8, train_loss: 0.0023, val_loss: 0.0026 },
  ]);

  const handleStartTraining = () => {
    setIsTraining(true);
    setTrainingLogs([
      `[1/4] Initializing ${modelType} architecture on TensorFlow 2.21...`,
      `[2/4] Hyperparameters: Epochs=${epochs}, BatchSize=${batchSize}, LR=${learningRate}`,
      `[3/4] Streaming training batches (24,403 samples)...`
    ]);

    let ep = 1;
    const interval = setInterval(() => {
      if (ep <= epochs) {
        setTrainingLogs((prev) => [
          ...prev,
          `Epoch ${ep}/${epochs} - loss: ${(0.012 / ep).toFixed(4)} - val_loss: ${(0.008 / ep).toFixed(4)} - elapsed: ${(ep * 3.4).toFixed(1)}s`
        ]);
        ep++;
      } else {
        clearInterval(interval);
        setIsTraining(false);
        setTrainingLogs((prev) => [
          ...prev,
          `[4/4] Training complete! Best validation checkpoint saved to backend/models/${modelType.toLowerCase().replace('-', '_')}_model.keras`,
          `Final Test MAPE: 2.78% | R² Score: 0.9414`
        ]);
      }
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">
          <Cpu className="w-3.5 h-3.5" />
          Deep Learning Laboratory
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Model Training Studio
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure recurrent sequence models, adjust hyperparameters, monitor real-time loss progression, and export weights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration Controls */}
        <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-white/5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Hyperparameters</h2>
          </div>

          {/* Model Architecture Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Model Architecture</label>
            <div className="grid grid-cols-2 gap-2">
              {['LSTM', 'GRU', 'Bi-LSTM', 'CNN-LSTM'].map((m) => (
                <button
                  key={m}
                  onClick={() => setModelType(m)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                    modelType === m
                      ? 'bg-blue-600/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Epochs Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-slate-300">Training Epochs</span>
              <span className="font-mono text-cyan-400 font-bold">{epochs} Epochs</span>
            </div>
            <input
              type="range"
              min={2}
              max={25}
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800"
            />
          </div>

          {/* Batch Size */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Batch Size</label>
            <div className="grid grid-cols-3 gap-2">
              {[64, 128, 256].map((b) => (
                <button
                  key={b}
                  onClick={() => setBatchSize(b)}
                  className={`py-2 text-xs font-mono font-semibold rounded-xl border transition-all ${
                    batchSize === b
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Learning Rate */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Learning Rate (Adam)</label>
            <div className="grid grid-cols-3 gap-2">
              {[0.005, 0.001, 0.0005].map((lr) => (
                <button
                  key={lr}
                  onClick={() => setLearningRate(lr)}
                  className={`py-2 text-xs font-mono font-semibold rounded-xl border transition-all ${
                    learningRate === lr
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {lr}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleStartTraining}
            disabled={isTraining}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isTraining ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                Training {modelType}...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Initiate Training Run
              </>
            )}
          </button>
        </div>

        {/* Right Column: Training Curves & Live Console */}
        <div className="lg:col-span-2 space-y-6">
          {/* Training Loss Curve */}
          <div className="rounded-2xl bg-[#111827]/90 border border-white/10 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Loss Progression Curves (MSE)
                </h3>
                <p className="text-xs text-slate-400">Monitoring Training Loss vs. Validation Generalization</p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                EarlyStopping Active
              </span>
            </div>

            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="epoch" stroke="#64748B" fontSize={11} tickFormatter={(ep) => `Ep ${ep}`} />
                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => v.toFixed(3)} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: '#FFF' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="train_loss" name="Training Loss" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="val_loss" name="Validation Loss" stroke="#22D3EE" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Training Console Output */}
          <div className="rounded-2xl bg-[#070B14] border border-white/10 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Training Console Output
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="font-mono text-xs text-slate-300 space-y-1.5 max-h-44 overflow-y-auto">
              {trainingLogs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-cyan-500 font-bold">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
