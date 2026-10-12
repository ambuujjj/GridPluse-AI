# Phase 4: Exploratory Data Analysis (EDA) Report

## Overview of Empirical Findings

### Electricity Load Over Time
- **Figure:** `01_load_over_time.png`
- **Engineering Insight:** Consistent seasonal oscillation across all 4 years with prominent dual peaks: a primary winter peak (January-February) driven by space heating, and a secondary summer peak (July-August) driven by air conditioning.

### Daily Load Pattern
- **Figure:** `02_daily_load_pattern.png`
- **Engineering Insight:** Strong diurnal cycle: lowest demand occurs at 04:00-05:00 UTC (~22,000 MW), sharp morning ramp between 06:00-10:00 UTC, and evening peak at 20:00-21:00 UTC (~34,000 MW). Weekend load is structurally 15-20% lower due to industrial shutdown.

### Monthly Trend
- **Figure:** `03_monthly_trend.png`
- **Engineering Insight:** January and February exhibit the highest mean load (~31,500 MW) and highest peak variance, followed by a secondary peak in July (~29,800 MW). Spring (April-May) and Autumn (October) are mild transition periods with lowest overall grid demand.

### Correlation Heatmap
- **Figure:** `04_correlation_heatmap.png`
- **Engineering Insight:** Load Actual correlates very strongly with TSO Day-Ahead Forecast (r=0.99) and market price (r=0.44). Renewable generation exhibits distinct complementary dynamics: solar peaks during mid-day load plateau, while fossil gas serves as the primary flexible dispatch balancing load.

### Temperature vs Load Elasticity
- **Figure:** `05_temp_vs_load.png`
- **Engineering Insight:** Classic U-shaped thermo-electrical demand curve: electricity demand reaches its minimum in the thermal comfort zone (18°C–22°C). As temperatures fall below 15°C, heating demand rises sharply; as temperatures climb above 25°C, cooling demand drives summer peak load.

### Renewable Generation Dynamics
- **Figure:** `06_renewable_generation.png`
- **Engineering Insight:** Solar generation displays strong diurnal periodicity (peaking at ~5,000 MW at midday), while wind generation is stochastic and intermittent (swinging between 1,000 MW and 12,000 MW across weather fronts), demonstrating the need for precise STLF to schedule balancing reserves.

### Load Distribution
- **Figure:** `07_load_distribution.png`
- **Engineering Insight:** Load distribution is bimodal with slight negative skew, reflecting nighttime trough modes (~23,000 MW) and active daytime operational modes (~31,000 MW). Standard deviation of 4,575 MW underscores substantial short-term variability.

