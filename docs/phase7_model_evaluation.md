# Phase 7: Model Evaluation & Benchmarking Report

### Champion Architecture: **Bi-LSTM**

| Model Name | MAE (MW) | RMSE (MW) | MAPE (%) | R² Score | Train Time (s) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Bi-LSTM 🏆 (Best)** | 802.87 | 1,109.34 | **2.78%** | **0.9414** | 0.16s |
| **GRU** | 824.91 | 1,116.80 | **2.86%** | **0.9406** | 0.11s |
| **LSTM** | 864.99 | 1,173.31 | **2.98%** | **0.9344** | 0.23s |
| **CNN-LSTM** | 889.85 | 1,162.64 | **3.08%** | **0.9356** | 0.13s |
| **Persistence Baseline** | 8,409.51 | 9,719.04 | **29.94%** | **-3.4978** | 0.04s |


## Key Architectural Insights

1. Deep learning sequence models significantly outperform the persistence baseline, capturing non-linear meteorological elasticity and daily/weekly seasonal swings.
2. The best model achieves a target MAPE well under the 3.5% engineering threshold specified in the project requirements.
3. Serialized weights and scalers are ready for deployment in the FastAPI backend.
