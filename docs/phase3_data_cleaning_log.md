# Phase 3: Data Cleaning Log

- **Input Energy Rows:** 35064
- **Final Cleaned Rows:** 35064
- **Final Columns:** 58
- **Target Variable:** `total load actual` (0 nulls remaining)
- **Dropped Columns:** ['generation hydro pumped storage aggregated', 'forecast wind offshore eday ahead']
- **Temperature Unit:** Converted to Celsius (°C)
- **Outliers Addressed:** Filtered sensor glitches in pressure (<900 or >1080 hPa) and wind speed (>35 m/s)
- **City Alignment:** 5 Spanish cities (Madrid, Barcelona, Valencia, Seville, Bilbao) deduplicated, pivoted, and aggregated into Spain-wide macro indices.
- **Final Output File:** `data\processed\cleaned_dataset.csv`
- **Null Check:** 0 null values across all 35064 rows and 58 columns.
