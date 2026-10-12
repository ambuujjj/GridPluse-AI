# Phase 2: Data Quality & Understanding Report

**Project:** AI-Based Short-Term Load Forecasting for Renewable Integrated Power System (Version 1 - MVP)  
**Author:** AI Technical Mentor & Engineering Team  
**Date:** October 2026  
**Status:** Completed — Pending Approval  

---

## 1. Executive Summary

This report delivers a thorough data profile and quality evaluation of the two source datasets provided for the Spanish Electrical Transmission System (REE - Red Eléctrica de España) and OpenWeatherMap hourly observations from 2015-01-01 to 2018-12-31:
- **`energy_dataset.csv`**: Contains hourly generation telemetry broken down by 14 energy sources (wind, solar, hydro, nuclear, fossil, biomass), wholesale day-ahead and actual market prices, and system-wide actual vs. forecast electrical demand.
- **`weather_features.csv`**: Contains hourly meteorological observations for Spain's 5 largest economic and population centers: Madrid, Barcelona, Valencia, Seville, and Bilbao.

Both datasets span exactly **4 full calendar years** (1,461 days = **35,064 consecutive hours**).

---

## 2. Dataset Overview & Dimensions

| Metric | `energy_dataset.csv` | `weather_features.csv` |
| :--- | :--- | :--- |
| **File Size** | 6.27 MB | 19.92 MB |
| **Total Rows** | 35,064 | 178,396 |
| **Total Columns** | 29 | 17 |
| **Temporal Frequency** | Hourly (1 hour intervals) | Hourly (per city) |
| **Start Timestamp** | `2015-01-01 00:00:00+01:00` | `2015-01-01 00:00:00+01:00` |
| **End Timestamp** | `2018-12-31 23:00:00+01:00` | `2018-12-31 23:00:00+01:00` |
| **Unique Timestamps** | 35,064 | 35,064 |
| **Exact Duplicate Rows** | 0 | 21 |
| **Target Variable** | `total load actual` (MW) | N/A (Exogenous Predictors) |

---

## 3. Schema & Data Types Breakdown

### 3.1 Energy Dataset (`energy_dataset.csv`)

| Column Name | Data Type | Non-Null Count | Missing (%) | Description / Domain Role |
| :--- | :---: | :---: | :---: | :--- |
| `time` | `object` (ISO-8601) | 35,064 | 0.00% | Hourly timestamp with UTC+01:00 offset |
| `generation biomass` | `float64` | 35,045 | 0.05% | Biomass generation (MW) |
| `generation fossil brown coal/lignite`| `float64` | 35,046 | 0.05% | Lignite generation (MW) |
| `generation fossil coal-derived gas` | `float64` | 35,046 | 0.05% | Coal gas generation (MW) |
| `generation fossil gas` | `float64` | 35,046 | 0.05% | Combined cycle natural gas (MW) |
| `generation fossil hard coal` | `float64` | 35,046 | 0.05% | Hard coal generation (MW) |
| `generation fossil oil` | `float64` | 35,045 | 0.05% | Oil-fired generation (MW) |
| `generation fossil oil shale` | `float64` | 35,046 | 0.05% | Oil shale generation (MW) |
| `generation fossil peat` | `float64` | 35,046 | 0.05% | Peat generation (MW) |
| `generation geothermal` | `float64` | 35,046 | 0.05% | Geothermal generation (MW) |
| `generation hydro pumped storage aggregated` | `float64` | 0 | **100.00%** | Empty column (0 non-null values) |
| `generation hydro pumped storage consumption` | `float64` | 35,045 | 0.05% | Pumped hydro storage demand (MW) |
| `generation hydro run-of-river and poundage` | `float64` | 35,045 | 0.05% | Run-of-river hydro (MW) |
| `generation hydro water reservoir` | `float64` | 35,046 | 0.05% | Dam reservoir hydro (MW) |
| `generation marine` | `float64` | 35,045 | 0.05% | Tidal/wave generation (MW) |
| `generation nuclear` | `float64` | 35,047 | 0.05% | Nuclear base-load (MW) |
| `generation other` | `float64` | 35,046 | 0.05% | Unclassified generation (MW) |
| `generation other renewable` | `float64` | 35,046 | 0.05% | Other renewables (MW) |
| `generation solar` | `float64` | 35,046 | 0.05% | Utility-scale solar PV (MW) |
| `generation waste` | `float64` | 35,045 | 0.05% | Waste-to-energy (MW) |
| `generation wind offshore` | `float64` | 35,046 | 0.05% | Offshore wind (MW) |
| `generation wind onshore` | `float64` | 35,046 | 0.05% | Onshore wind generation (MW) |
| `forecast solar day ahead` | `float64` | 35,064 | 0.00% | TSO Day-ahead solar forecast (MW) |
| `forecast wind offshore eday ahead` | `float64` | 0 | **100.00%** | Empty column (0 non-null values) |
| `forecast wind onshore day ahead` | `float64` | 35,064 | 0.00% | TSO Day-ahead onshore wind forecast |
| `total load forecast` | `float64` | 35,064 | 0.00% | TSO Day-ahead load forecast (MW) |
| `total load actual` | `float64` | 35,028 | **0.10%** | **Primary Prediction Target (MW)** |
| `price day ahead` | `float64` | 35,064 | 0.00% | Day-ahead spot price (€/MWh) |
| `price actual` | `float64` | 35,064 | 0.00% | Settlement market price (€/MWh) |

### 3.2 Weather Dataset (`weather_features.csv`)

| Column Name | Data Type | Non-Null Count | Missing (%) | Description / Domain Role |
| :--- | :---: | :---: | :---: | :--- |
| `dt_iso` | `object` (ISO-8601) | 178,396 | 0.00% | Hourly timestamp with UTC offset |
| `city_name` | `object` (String) | 178,396 | 0.00% | City identifier (5 Spanish cities) |
| `temp` | `float64` | 178,396 | 0.00% | Ambient dry-bulb temperature (Kelvin) |
| `temp_min` | `float64` | 178,396 | 0.00% | Minimum recorded hourly temp (Kelvin) |
| `temp_max` | `float64` | 178,396 | 0.00% | Maximum recorded hourly temp (Kelvin) |
| `pressure` | `int64` | 178,396 | 0.00% | Atmospheric sea-level pressure (hPa) |
| `humidity` | `int64` | 178,396 | 0.00% | Relative humidity percentage (0–100%) |
| `wind_speed` | `int64` | 178,396 | 0.00% | Horizontal wind speed (m/s) |
| `wind_deg` | `int64` | 178,396 | 0.00% | Wind direction in meteorological degrees (0–360°) |
| `rain_1h` | `float64` | 178,396 | 0.00% | Precipitation accumulation in last hour (mm) |
| `rain_3h` | `float64` | 178,396 | 0.00% | Precipitation accumulation in 3 hours (mm) |
| `snow_3h` | `float64` | 178,396 | 0.00% | Snowfall accumulation in 3 hours (mm) |
| `clouds_all` | `int64` | 178,396 | 0.00% | Cloud coverage fraction percentage (0–100%) |
| `weather_id` | `int64` | 178,396 | 0.00% | OpenWeather condition code |
| `weather_main` | `object` (String) | 178,396 | 0.00% | Weather category (Clear, Clouds, Rain, etc.) |
| `weather_description` | `object` (String) | 178,396 | 0.00% | Detailed description |
| `weather_icon` | `object` (String) | 178,396 | 0.00% | Icon identifier |

---

## 4. Missing Values & Duplicate Values Audit

### 4.1 Missing Values Analysis
1. **Completely Empty Columns (To Drop in Phase 3):**
   - `generation hydro pumped storage aggregated`: 35,064 nulls (100% missing).
   - `forecast wind offshore eday ahead`: 35,064 nulls (100% missing).
2. **Primary Target (`total load actual`):**
   - Exactly **36 missing values** out of 35,064 hours (0.10%).
   - These 36 nulls are isolated single-hour gaps or short runs that can be reliably imputed using linear interpolation without distorting intraday load shapes.
3. **Generation Features:**
   - 17 to 19 missing values across active generator types ($< 0.05\%$). Readily imputed using time-series forward-fill / linear interpolation.
4. **Weather Dataset:**
   - **0 missing values** across all 178,396 records.

### 4.2 Duplicate Values & City Discrepancies
1. **Exact Row Duplicates:**
   - `energy_dataset.csv`: **0** duplicate rows.
   - `weather_features.csv`: **21** exact identical duplicate rows.
2. **City-Level Breakdown & Whitespace Anomaly:**
   - `Madrid`: 36,267 rows
   - `Bilbao`: 35,951 rows
   - `Seville`: 35,557 rows
   - `' Barcelona'`: 35,476 rows (**CRITICAL NOTICE:** Contains leading whitespace!)
   - `Valencia`: 35,145 rows
3. **Temporal Duplicates per City:**
   - $35,064 \text{ hours} \times 5 \text{ cities} = 175,320 \text{ expected rows}$.
   - The weather file contains $178,396$ rows, indicating **3,076 redundant hourly observations** across cities.
   - Grouping by `(dt_iso, city_name)` and taking the mean/first observation yields exactly $175,320$ records, perfectly covering all 35,064 hours for all 5 cities.

---

## 5. Descriptive Statistics & Anomaly Detection

### 5.1 Primary Target: Electricity Load (`total load actual`)

| Statistic | Value (MW) | Engineering Interpretation |
| :--- | :--- | :--- |
| **Count** | 35,028 | 36 missing values |
| **Mean** | 28,696.94 MW | Baseline average national grid load |
| **Std Dev** | 4,574.99 MW | High variance driven by diurnal and seasonal swing |
| **Min** | 18,041.00 MW | Base-load night trough (typically 04:00–05:00 UTC) |
| **25th Percentile** | 24,807.75 MW | Off-peak shoulder hours |
| **50th Percentile (Median)** | 28,901.00 MW | Typical weekday load |
| **75th Percentile** | 32,192.00 MW | Daytime peak load |
| **Max** | 41,015.00 MW | Winter evening heating peak / Summer AC peak |

### 5.2 Meteorological Features & Physical Anomalies

| Feature | Units | Min | Mean | Max | Detected Anomalies & Actions |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `temp` | Kelvin | 262.24 K (-10.9°C) | 289.62 K (+16.5°C) | 315.60 K (+42.5°C) | Realistic Spanish temperature ranges. Must convert to Celsius ($T_{°C} = T_K - 273.15$). |
| `pressure` | hPa | **0.00 hPa** | 1,069.26 hPa | **1,008,371.00 hPa** | **Severe Sensor Malfunction:** Atmospheric pressure cannot be 0 or 1,000,000 hPa. Must clip or replace with median/interpolation (valid range: 950–1050 hPa). |
| `humidity` | % | 0.00 % | 68.42 % | 100.00 % | Physical range [0, 100] is valid. |
| `wind_speed` | m/s | 0.00 m/s | 2.47 m/s | **133.00 m/s** | **Severe Outlier:** 133 m/s (~478 km/h) exceeds hurricane force. Must clip to realistic upper bound ($\le 30\text{ m/s}$). |
| `clouds_all` | % | 0.00 % | 25.07 % | 100.00 % | Valid cloudiness scale. |
| `rain_1h` | mm | 0.00 mm | 0.08 mm | 12.00 mm | Valid precipitation distribution. |

---

## 6. Dataset Merging & Alignment Strategy

A naive `inner` merge on timestamps between `energy_dataset` (35,064 rows) and `weather_features` (178,396 rows) would multiply energy rows by 5, creating 175,000+ duplicate load targets and destroying the time-series sequence structure.

### Proven Merging Strategy:
1. **Clean Whitespace:** Strip city string labels (`' Barcelona'` $\to$ `'Barcelona'`).
2. **Deduplicate Weather:** Group by `(dt_iso, city_name)` and compute mean values for duplicate sensor readings, resulting in exactly $175,320$ rows ($35,064 \times 5$).
3. **Multi-City Feature Reshaping:** Pivot the 5 cities into dedicated regional columns:
   - Temperatures: `temp_madrid`, `temp_barcelona`, `temp_valencia`, `temp_seville`, `temp_bilbao`.
   - Wind speeds: `wind_speed_madrid`, `wind_speed_barcelona`, etc.
   - Cloud coverage: `clouds_all_madrid`, `clouds_all_barcelona`, etc.
4. **Macro Weather Synthesis:** Compute nationwide hourly composite averages (`temp_macro`, `humidity_macro`, `wind_speed_macro`, `clouds_all_macro`).
5. **Exact Temporal Join:** Merge `energy_dataset` (35,064 rows) with the pivoted/macro weather table (35,064 rows) on UTC timestamp.
   - **Result:** Exactly **35,064 rows** and **56 columns**, representing a continuous, uncorrupted hourly sequence.

---

## 7. Action Plan for Phase 3 (Data Cleaning)

Based on these verified findings, the concrete execution steps for Phase 3 are:
1. Drop the two 100% missing columns (`generation hydro pumped storage aggregated` and `forecast wind offshore eday ahead`).
2. Impute the 36 missing values in `total load actual` using cubic spline or linear time-series interpolation.
3. Impute minor generation missing values ($< 0.05\%$) using forward fill.
4. Clean city names in the weather dataset and deduplicate identical `(dt_iso, city_name)` pairs.
5. Convert all temperature readings (`temp`, `temp_min`, `temp_max`) from Kelvin to Celsius ($°C = K - 273.15$).
6. Filter/impute physical sensor anomalies (barometric pressure $< 900$ or $> 1100\text{ hPa}$; wind speed $> 35\text{ m/s}$).
7. Format all timestamps into unified UTC ISO-8601 strings and set as chronological index.
8. Merge the cleaned energy and multi-city pivoted weather features into `data/processed/cleaned_dataset.csv`.

---
*Data Quality & Understanding Report completed and ready for Phase 2 sign-off.*
