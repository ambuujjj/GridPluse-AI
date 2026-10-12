import csv
import os
import sys

def inspect_csv(file_path, sample_rows=5):
    print(f"\n==========================================")
    print(f"FILE: {file_path}")
    print(f"Size: {os.path.getsize(file_path):,} bytes")
    print(f"==========================================")
    
    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        header = next(reader)
        print(f"Total Columns ({len(header)}):")
        for i, col in enumerate(header):
            print(f"  [{i}] {col}")
            
        print(f"\nFirst {sample_rows} sample records:")
        for r_idx in range(sample_rows):
            try:
                row = next(reader)
                print(f"\nRow {r_idx+1}:")
                for c_idx, val in enumerate(row):
                    print(f"  {header[c_idx]}: {val}")
            except StopIteration:
                break

if __name__ == '__main__':
    energy_path = os.path.join("archive (1)", "energy_dataset.csv")
    weather_path = os.path.join("archive (1)", "weather_features.csv")
    
    if os.path.exists(energy_path):
        inspect_csv(energy_path, sample_rows=3)
    else:
        print(f"Error: {energy_path} not found")
        
    if os.path.exists(weather_path):
        inspect_csv(weather_path, sample_rows=3)
    else:
        print(f"Error: {weather_path} not found")
