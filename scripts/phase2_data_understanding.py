import os
import json
import pandas as pd
import numpy as np

def analyze_datasets():
    energy_path = os.path.join("archive (1)", "energy_dataset.csv")
    weather_path = os.path.join("archive (1)", "weather_features.csv")
    
    print("Loading energy dataset...")
    df_energy = pd.read_csv(energy_path)
    print(f"Energy shape: {df_energy.shape}")
    
    print("Loading weather dataset...")
    df_weather = pd.read_csv(weather_path)
    print(f"Weather shape: {df_weather.shape}")
    
    report = {}
    
    # 1. Energy Analysis
    report['energy'] = {
        'rows': int(df_energy.shape[0]),
        'cols': int(df_energy.shape[1]),
        'columns': list(df_energy.columns),
        'dtypes': {col: str(dtype) for col, dtype in df_energy.dtypes.items()},
        'missing_values': {col: int(val) for col, val in df_energy.isnull().sum().items() if val > 0},
        'duplicate_rows': int(df_energy.duplicated().sum()),
        'time_duplicates': int(df_energy['time'].duplicated().sum()) if 'time' in df_energy.columns else 0,
        'time_min': str(df_energy['time'].min()),
        'time_max': str(df_energy['time'].max()),
    }
    
    # Check target column
    target_col = 'total load actual'
    if target_col in df_energy.columns:
        desc = df_energy[target_col].describe()
        report['energy']['target_stats'] = {k: float(v) for k, v in desc.items()}
        report['energy']['target_nulls'] = int(df_energy[target_col].isnull().sum())
    
    # 2. Weather Analysis
    report['weather'] = {
        'rows': int(df_weather.shape[0]),
        'cols': int(df_weather.shape[1]),
        'columns': list(df_weather.columns),
        'dtypes': {col: str(dtype) for col, dtype in df_weather.dtypes.items()},
        'missing_values': {col: int(val) for col, val in df_weather.isnull().sum().items() if val > 0},
        'duplicate_rows': int(df_weather.duplicated().sum()),
        'dt_iso_duplicates': int(df_weather['dt_iso'].duplicated().sum()) if 'dt_iso' in df_weather.columns else 0,
        'time_min': str(df_weather['dt_iso'].min()),
        'time_max': str(df_weather['dt_iso'].max()),
    }
    
    # City analysis in weather
    if 'city_name' in df_weather.columns:
        city_counts = df_weather['city_name'].value_counts().to_dict()
        report['weather']['city_counts'] = {str(k): int(v) for k, v in city_counts.items()}
        
        # Check duplicates per city
        city_dups = df_weather.duplicated(subset=['dt_iso', 'city_name']).sum()
        report['weather']['city_time_duplicates'] = int(city_dups)
    
    # Weather stats
    num_weather_cols = ['temp', 'temp_min', 'temp_max', 'pressure', 'humidity', 'wind_speed', 'wind_deg', 'rain_1h', 'rain_3h', 'snow_3h', 'clouds_all']
    report['weather']['numeric_stats'] = {}
    for col in num_weather_cols:
        if col in df_weather.columns:
            desc = df_weather[col].describe()
            report['weather']['numeric_stats'][col] = {k: float(v) for k, v in desc.items()}
            
    # Weather categoricals
    cat_weather_cols = ['weather_main', 'weather_description', 'weather_icon']
    report['weather']['categoricals'] = {}
    for col in cat_weather_cols:
        if col in df_weather.columns:
            report['weather']['categoricals'][col] = {str(k): int(v) for k, v in df_weather[col].value_counts().head(10).items()}
            
    # 3. Merge Feasibility Analysis
    # Convert timestamps to compare overlap
    energy_times = set(pd.to_datetime(df_energy['time'], utc=True))
    weather_times = set(pd.to_datetime(df_weather['dt_iso'], utc=True))
    common_times = energy_times.intersection(weather_times)
    
    report['merge_analysis'] = {
        'energy_unique_timestamps': len(energy_times),
        'weather_unique_timestamps': len(weather_times),
        'common_timestamps': len(common_times),
        'energy_only_timestamps': len(energy_times - weather_times),
        'weather_only_timestamps': len(weather_times - energy_times),
    }
    
    # Save raw report to JSON
    os.makedirs("docs", exist_ok=True)
    with open(os.path.join("docs", "phase2_analysis.json"), "w") as f:
        json.dump(report, f, indent=2)
        
    print("\nPhase 2 analysis completed successfully and saved to docs/phase2_analysis.json!")
    return report

if __name__ == '__main__':
    analyze_datasets()
