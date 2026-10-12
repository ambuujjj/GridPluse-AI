import os
import pandas as pd
import numpy as np

def clean_data():
    print("=== STARTING PHASE 3: DATA CLEANING ===")
    
    energy_path = os.path.join("archive (1)", "energy_dataset.csv")
    weather_path = os.path.join("archive (1)", "weather_features.csv")
    output_dir = os.path.join("data", "processed")
    os.makedirs(output_dir, exist_ok=True)
    cleaned_file_path = os.path.join(output_dir, "cleaned_dataset.csv")
    
    # ----------------------------------------------------
    # 1. LOAD & CLEAN ENERGY DATASET
    # ----------------------------------------------------
    print("\n[Step 1/5] Processing energy dataset...")
    df_energy = pd.read_csv(energy_path)
    initial_energy_rows = len(df_energy)
    
    # Standardize time to UTC datetime
    df_energy['time_dt'] = pd.to_datetime(df_energy['time'], utc=True)
    df_energy = df_energy.sort_values('time_dt').reset_index(drop=True)
    
    # Drop 100% missing columns
    empty_cols = ['generation hydro pumped storage aggregated', 'forecast wind offshore eday ahead']
    df_energy = df_energy.drop(columns=[col for col in empty_cols if col in df_energy.columns])
    print(f"Dropped 100% empty columns: {empty_cols}")
    
    # Impute missing values in target: total load actual (36 missing)
    load_nulls_before = df_energy['total load actual'].isnull().sum()
    df_energy['total load actual'] = df_energy['total load actual'].interpolate(method='linear', limit_direction='both')
    print(f"Imputed 'total load actual' missing values ({load_nulls_before} -> {df_energy['total load actual'].isnull().sum()})")
    
    # Forward-fill then backward-fill remaining generation & price columns
    numeric_energy_cols = df_energy.select_dtypes(include=[np.number]).columns
    for col in numeric_energy_cols:
        if df_energy[col].isnull().sum() > 0:
            df_energy[col] = df_energy[col].interpolate(method='linear').bfill().ffill()
            
    energy_remaining_nulls = df_energy.isnull().sum().sum()
    print(f"Energy dataset cleaned: {len(df_energy)} rows, 0 nulls remaining (verified: {energy_remaining_nulls})")

    # ----------------------------------------------------
    # 2. LOAD & CLEAN WEATHER DATASET
    # ----------------------------------------------------
    print("\n[Step 2/5] Processing weather dataset...")
    df_weather = pd.read_csv(weather_path)
    
    # Standardize time
    df_weather['time_dt'] = pd.to_datetime(df_weather['dt_iso'], utc=True)
    
    # Strip whitespace from city names (fixes ' Barcelona' bug)
    df_weather['city_name'] = df_weather['city_name'].str.strip()
    unique_cities = sorted(df_weather['city_name'].unique().tolist())
    print(f"Cleaned city names: {unique_cities}")
    
    # Drop exact duplicate rows
    dups_before = df_weather.duplicated().sum()
    df_weather = df_weather.drop_duplicates().reset_index(drop=True)
    print(f"Dropped {dups_before} exact duplicate rows.")
    
    # Convert temperatures from Kelvin to Celsius
    temp_cols = ['temp', 'temp_min', 'temp_max']
    for col in temp_cols:
        df_weather[col] = df_weather[col] - 273.15
    print("Converted temperatures from Kelvin to Celsius (°C = K - 273.15).")
    
    # Handle physical anomalies
    # Pressure: standard atmospheric pressure is ~1013 hPa. Values outside [900, 1080] are invalid sensor glitches.
    invalid_pressure = ((df_weather['pressure'] < 900) | (df_weather['pressure'] > 1080))
    print(f"Detected {invalid_pressure.sum()} invalid pressure anomalies (e.g., 0 or 1,008,371 hPa).")
    df_weather.loc[invalid_pressure, 'pressure'] = np.nan
    
    # Wind speed: values > 35 m/s (~126 km/h) are severe anomalies/glitches
    invalid_wind = df_weather['wind_speed'] > 35
    print(f"Detected {invalid_wind.sum()} wind speed anomalies (> 35 m/s).")
    df_weather.loc[invalid_wind, 'wind_speed'] = np.nan
    
    # Deduplicate by (time_dt, city_name) by taking the mean of numerical values
    weather_numeric = ['temp', 'temp_min', 'temp_max', 'pressure', 'humidity', 'wind_speed', 'wind_deg', 'rain_1h', 'rain_3h', 'snow_3h', 'clouds_all']
    weather_grouped = df_weather.groupby(['time_dt', 'city_name'])[weather_numeric].mean().reset_index()
    
    # Interpolate any NaNs created by outlier clipping per city
    weather_clean_list = []
    for city in unique_cities:
        city_sub = weather_grouped[weather_grouped['city_name'] == city].sort_values('time_dt')
        city_sub[weather_numeric] = city_sub[weather_numeric].interpolate(method='linear').bfill().ffill()
        weather_clean_list.append(city_sub)
    weather_grouped = pd.concat(weather_clean_list, axis=0).reset_index(drop=True)
    print(f"Weather dataset deduplicated and interpolated per city: {weather_grouped.shape}")
    print(f"Weather dataset deduplicated and interpolated per city: {weather_grouped.shape}")

    # ----------------------------------------------------
    # 3. PIVOT WEATHER AND COMPUTE NATIONWIDE MACRO FEATURES
    # ----------------------------------------------------
    print("\n[Step 3/5] Pivoting multi-city features and creating national averages...")
    # Nationwide macro weather average
    macro_weather = weather_grouped.groupby('time_dt')[['temp', 'humidity', 'wind_speed', 'clouds_all', 'pressure', 'rain_1h']].mean().reset_index()
    macro_weather.columns = ['time_dt'] + [f"{c}_spain_avg" for c in ['temp', 'humidity', 'wind_speed', 'clouds_all', 'pressure', 'rain_1h']]
    
    # Pivot per-city core features
    pivot_features = ['temp', 'humidity', 'wind_speed', 'clouds_all', 'pressure']
    weather_pivoted = weather_grouped.pivot(index='time_dt', columns='city_name', values=pivot_features)
    weather_pivoted.columns = [f"{feat}_{city.lower()}" for feat, city in weather_pivoted.columns]
    weather_pivoted = weather_pivoted.reset_index()

    # Combine macro + city-specific features
    weather_final = pd.merge(weather_pivoted, macro_weather, on='time_dt', how='inner')
    print(f"Weather features matrix shape: {weather_final.shape}")

    # ----------------------------------------------------
    # 4. MERGE DATASETS ON TIMESTAMP
    # ----------------------------------------------------
    print("\n[Step 4/5] Merging energy and weather datasets...")
    df_merged = pd.merge(df_energy, weather_final, on='time_dt', how='inner')
    
    # Set time as formatted ISO string
    df_merged['timestamp'] = df_merged['time_dt'].dt.strftime('%Y-%m-%d %H:%M:%S+00:00')
    df_merged = df_merged.drop(columns=['time', 'time_dt'])
    
    # Place timestamp and target at the front
    front_cols = ['timestamp', 'total load actual']
    other_cols = [c for c in df_merged.columns if c not in front_cols]
    df_merged = df_merged[front_cols + other_cols]
    
    total_nulls = df_merged.isnull().sum().sum()
    print(f"Merged Dataset: {df_merged.shape[0]} rows, {df_merged.shape[1]} columns. Total nulls: {total_nulls}")
    assert total_nulls == 0, f"Error: Found {total_nulls} null values in merged dataset!"
    assert len(df_merged) == 35064, f"Error: Expected 35,064 rows but got {len(df_merged)}"

    # ----------------------------------------------------
    # 5. SAVE CLEANED DATASET
    # ----------------------------------------------------
    print("\n[Step 5/5] Saving cleaned dataset to disk...")
    df_merged.to_csv(cleaned_file_path, index=False)
    print(f"Cleaned dataset successfully saved to: {cleaned_file_path}")
    print(f"File size: {os.path.getsize(cleaned_file_path) / (1024*1024):.2f} MB")
    
    # Generate cleaning documentation
    doc_path = os.path.join("docs", "phase3_data_cleaning_log.md")
    with open(doc_path, "w", encoding="utf-8") as f:
        f.write("# Phase 3: Data Cleaning Log\n\n")
        f.write(f"- **Input Energy Rows:** {initial_energy_rows}\n")
        f.write(f"- **Final Cleaned Rows:** {len(df_merged)}\n")
        f.write(f"- **Final Columns:** {df_merged.shape[1]}\n")
        f.write(f"- **Target Variable:** `total load actual` (0 nulls remaining)\n")
        f.write(f"- **Dropped Columns:** {empty_cols}\n")
        f.write(f"- **Temperature Unit:** Converted to Celsius (°C)\n")
        f.write(f"- **Outliers Addressed:** Filtered sensor glitches in pressure (<900 or >1080 hPa) and wind speed (>35 m/s)\n")
        f.write(f"- **City Alignment:** 5 Spanish cities (Madrid, Barcelona, Valencia, Seville, Bilbao) deduplicated, pivoted, and aggregated into Spain-wide macro indices.\n")
        f.write(f"- **Final Output File:** `{cleaned_file_path}`\n")
        f.write(f"- **Null Check:** 0 null values across all {len(df_merged)} rows and {df_merged.shape[1]} columns.\n")
    print(f"Cleaning log saved to: {doc_path}")
    print("\n=== PHASE 3 DATA CLEANING COMPLETED SUCCESSFULLY! ===")

if __name__ == '__main__':
    clean_data()
