import os
import pandas as pd
import numpy as np

def test_merge_strategy():
    energy_path = os.path.join("archive (1)", "energy_dataset.csv")
    weather_path = os.path.join("archive (1)", "weather_features.csv")
    
    df_energy = pd.read_csv(energy_path)
    df_weather = pd.read_csv(weather_path)
    
    # Clean city names (strip whitespace)
    df_weather['city_name'] = df_weather['city_name'].str.strip()
    
    # Deduplicate weather by dt_iso and city_name (taking the mean for numericals or last observation)
    weather_numeric = ['temp', 'temp_min', 'temp_max', 'pressure', 'humidity', 'wind_speed', 'wind_deg', 'rain_1h', 'rain_3h', 'snow_3h', 'clouds_all']
    
    # Group by dt_iso and city_name, aggregate numeric columns by mean
    weather_grouped = df_weather.groupby(['dt_iso', 'city_name'])[weather_numeric].mean().reset_index()
    print(f"Weather after dedup by (dt_iso, city_name): {weather_grouped.shape}")
    
    # Pivot so each city has its own columns
    weather_pivoted = weather_grouped.pivot(index='dt_iso', columns='city_name', values=['temp', 'humidity', 'wind_speed', 'clouds_all', 'pressure'])
    # Flatten multi-level columns
    weather_pivoted.columns = [f"{col}_{city.lower()}" for col, city in weather_pivoted.columns]
    weather_pivoted = weather_pivoted.reset_index()
    print(f"Weather pivoted shape: {weather_pivoted.shape}")
    
    # Also calculate nationwide average weather features
    weather_macro = weather_grouped.groupby('dt_iso')[weather_numeric].mean().reset_index()
    weather_macro.columns = ['dt_iso'] + [f"{col}_macro" for col in weather_numeric]
    print(f"Weather macro shape: {weather_macro.shape}")
    
    # Merge with energy
    df_energy['time_dt'] = pd.to_datetime(df_energy['time'], utc=True)
    weather_pivoted['time_dt'] = pd.to_datetime(weather_pivoted['dt_iso'], utc=True)
    weather_macro['time_dt'] = pd.to_datetime(weather_macro['dt_iso'], utc=True)
    
    df_merged = pd.merge(df_energy, weather_macro, on='time_dt', how='inner')
    print(f"Merged with macro weather: {df_merged.shape}")
    
    df_merged_full = pd.merge(df_energy, weather_pivoted, on='time_dt', how='inner')
    print(f"Merged with pivoted city weather: {df_merged_full.shape}")
    
    return True

if __name__ == '__main__':
    test_merge_strategy()
