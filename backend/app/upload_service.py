"""
Upload & Auto-Analyze Service for GridSight v2
Processes user-uploaded CSVs and generates full EDA reports.
"""
import os
import json
import uuid
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

import numpy as np
import pandas as pd

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "uploads")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "reports")


def _ensure_dirs():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(REPORTS_DIR, exist_ok=True)


def _detect_datetime_col(df: pd.DataFrame) -> Optional[str]:
    """Auto-detect the best datetime column."""
    for col in df.columns:
        if df[col].dtype == "object":
            try:
                sample = df[col].dropna().head(50)
                parsed = pd.to_datetime(sample, infer_datetime_format=True)
                if parsed.notna().sum() > len(sample) * 0.8:
                    return col
            except (ValueError, TypeError):
                continue
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            return col
    return None


def _detect_target_col(df: pd.DataFrame, datetime_col: Optional[str]) -> Optional[str]:
    """Auto-detect the most likely target (load/demand) column."""
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    # Priority keywords for load/demand
    keywords = ["load", "demand", "consumption", "power", "energy", "mw", "kwh", "mwh"]
    for col in numeric_cols:
        for kw in keywords:
            if kw in col.lower():
                return col
    # Fallback: pick the numeric column with highest variance (most informative)
    if numeric_cols:
        variances = {c: df[c].var() for c in numeric_cols if c != datetime_col}
        if variances:
            return max(variances, key=variances.get)
    return numeric_cols[0] if numeric_cols else None


def _safe_float(val) -> Optional[float]:
    try:
        v = float(val)
        if np.isnan(v) or np.isinf(v):
            return None
        return round(v, 4)
    except (ValueError, TypeError):
        return None


def _generate_column_profiles(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Generate per-column statistical profiles."""
    profiles = []
    for col in df.columns:
        profile: Dict[str, Any] = {
            "name": col,
            "dtype": str(df[col].dtype),
            "non_null_count": int(df[col].notna().sum()),
            "null_count": int(df[col].isna().sum()),
            "null_percent": round(float(df[col].isna().mean()) * 100, 2),
            "unique_count": int(df[col].nunique()),
        }
        if pd.api.types.is_numeric_dtype(df[col]):
            desc = df[col].describe()
            profile.update({
                "mean": _safe_float(desc.get("mean")),
                "std": _safe_float(desc.get("std")),
                "min": _safe_float(desc.get("min")),
                "q25": _safe_float(desc.get("25%")),
                "median": _safe_float(desc.get("50%")),
                "q75": _safe_float(desc.get("75%")),
                "max": _safe_float(desc.get("max")),
                "skewness": _safe_float(df[col].skew()),
                "kurtosis": _safe_float(df[col].kurtosis()),
            })
        elif df[col].dtype == "object":
            top_values = df[col].value_counts().head(5).to_dict()
            profile["top_values"] = {str(k): int(v) for k, v in top_values.items()}
        profiles.append(profile)
    return profiles


def _generate_distribution_data(df: pd.DataFrame, numeric_cols: List[str]) -> Dict[str, Any]:
    """Generate histogram data for numeric columns (top 8)."""
    distributions = {}
    for col in numeric_cols[:8]:
        series = df[col].dropna()
        if len(series) < 10:
            continue
        try:
            counts, bin_edges = np.histogram(series, bins=30)
            distributions[col] = {
                "bins": [round(float(b), 2) for b in bin_edges[:-1]],
                "counts": [int(c) for c in counts],
                "bin_labels": [f"{round(float(bin_edges[i]), 1)}-{round(float(bin_edges[i+1]), 1)}" for i in range(len(counts))],
            }
        except Exception:
            continue
    return distributions


def _generate_correlation_matrix(df: pd.DataFrame, numeric_cols: List[str]) -> Dict[str, Dict[str, Optional[float]]]:
    """Correlation matrix for top numeric columns."""
    top_cols = numeric_cols[:12]
    if len(top_cols) < 2:
        return {}
    corr = df[top_cols].corr().round(4)
    result = {}
    for col in corr.columns:
        result[col] = {}
        for row in corr.index:
            val = corr.loc[row, col]
            result[col][row] = _safe_float(val)
    return result


def _generate_time_series_analytics(
    df: pd.DataFrame, datetime_col: str, target_col: str
) -> Dict[str, Any]:
    """Generate time-series specific analytics: trends, seasonality, patterns."""
    ts_data: Dict[str, Any] = {}

    try:
        df_ts = df[[datetime_col, target_col]].dropna().copy()
        df_ts[datetime_col] = pd.to_datetime(df_ts[datetime_col])
        df_ts = df_ts.sort_values(datetime_col)

        # Hourly profile
        if hasattr(df_ts[datetime_col].dt, "hour"):
            df_ts["hour"] = df_ts[datetime_col].dt.hour
            hourly = df_ts.groupby("hour")[target_col].mean().reset_index()
            ts_data["hourly_profile"] = [
                {"hour": int(r["hour"]), "avg_value": round(float(r[target_col]), 2)}
                for _, r in hourly.iterrows()
            ]

        # Daily of week
        if hasattr(df_ts[datetime_col].dt, "dayofweek"):
            df_ts["dow"] = df_ts[datetime_col].dt.dayofweek
            dow_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            daily = df_ts.groupby("dow")[target_col].mean().reset_index()
            ts_data["day_of_week_profile"] = [
                {
                    "day": dow_names[int(r["dow"])],
                    "avg_value": round(float(r[target_col]), 2),
                }
                for _, r in daily.iterrows()
            ]

        # Monthly trend
        if hasattr(df_ts[datetime_col].dt, "month"):
            df_ts["month"] = df_ts[datetime_col].dt.month
            month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            monthly = df_ts.groupby("month")[target_col].agg(["mean", "min", "max"]).reset_index()
            ts_data["monthly_trend"] = [
                {
                    "month": month_names[int(r["month"]) - 1],
                    "avg_value": round(float(r["mean"]), 2),
                    "min_value": round(float(r["min"]), 2),
                    "max_value": round(float(r["max"]), 2),
                }
                for _, r in monthly.iterrows()
            ]

        # Rolling mean (sampled for performance)
        step = max(1, len(df_ts) // 500)
        sampled = df_ts.iloc[::step].copy()
        window = min(24, len(sampled) // 10) or 1
        sampled["rolling_mean"] = sampled[target_col].rolling(window=window, center=True).mean()
        ts_data["time_series_trend"] = [
            {
                "timestamp": str(r[datetime_col]),
                "value": round(float(r[target_col]), 2),
                "rolling_mean": _safe_float(r["rolling_mean"]),
            }
            for _, r in sampled.iterrows()
        ]

    except Exception as e:
        ts_data["error"] = str(e)

    return ts_data


def _generate_outlier_analysis(df: pd.DataFrame, numeric_cols: List[str]) -> Dict[str, Any]:
    """Detect outliers using IQR method."""
    outliers = {}
    for col in numeric_cols[:8]:
        series = df[col].dropna()
        if len(series) < 20:
            continue
        q1, q3 = series.quantile(0.25), series.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        n_outliers = int(((series < lower) | (series > upper)).sum())
        outliers[col] = {
            "total_count": len(series),
            "outlier_count": n_outliers,
            "outlier_percent": round(n_outliers / len(series) * 100, 2),
            "lower_fence": round(float(lower), 2),
            "upper_fence": round(float(upper), 2),
            "q1": round(float(q1), 2),
            "q3": round(float(q3), 2),
            "iqr": round(float(iqr), 2),
        }
    return outliers


def _generate_missing_data_analysis(df: pd.DataFrame) -> Dict[str, Any]:
    """Missing data pattern analysis."""
    total = len(df)
    col_missing = []
    for col in df.columns:
        n_missing = int(df[col].isna().sum())
        col_missing.append({
            "column": col,
            "missing_count": n_missing,
            "missing_percent": round(n_missing / total * 100, 2) if total > 0 else 0,
        })
    # Sort by most missing
    col_missing.sort(key=lambda x: x["missing_count"], reverse=True)
    return {
        "total_rows": total,
        "total_columns": len(df.columns),
        "columns_with_missing": sum(1 for c in col_missing if c["missing_count"] > 0),
        "complete_rows": int(df.dropna().shape[0]),
        "complete_rows_percent": round(df.dropna().shape[0] / total * 100, 2) if total > 0 else 0,
        "per_column": col_missing,
    }


def _generate_pairwise_scatter_data(
    df: pd.DataFrame, target_col: str, numeric_cols: List[str]
) -> List[Dict[str, Any]]:
    """Generate scatter data for target vs top correlated features."""
    if target_col not in numeric_cols or len(numeric_cols) < 2:
        return []

    other_cols = [c for c in numeric_cols if c != target_col][:4]
    scatter_data = []
    for col in other_cols:
        sub = df[[target_col, col]].dropna()
        # Sample for performance
        if len(sub) > 300:
            sub = sub.sample(300, random_state=42)
        corr_val = _safe_float(df[target_col].corr(df[col]))
        scatter_data.append({
            "feature": col,
            "correlation": corr_val,
            "points": [
                {"x": round(float(r[col]), 2), "y": round(float(r[target_col]), 2)}
                for _, r in sub.iterrows()
            ],
        })
    return scatter_data


def process_uploaded_dataset(
    filepath: str,
    original_filename: str,
    datetime_col_override: Optional[str] = None,
    target_col_override: Optional[str] = None,
    report_id_override: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Main entry point: process an uploaded CSV and generate a comprehensive report.
    Returns a report_id and the full report data.
    """
    _ensure_dirs()

    # Generate unique report ID
    file_hash = hashlib.md5(open(filepath, "rb").read()[:10000]).hexdigest()[:8]
    report_id = report_id_override or f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file_hash}_{uuid.uuid4().hex[:6]}"

    # Read CSV
    try:
        df = pd.read_csv(filepath, low_memory=False)
    except Exception as e:
        return {"error": f"Failed to read CSV: {str(e)}", "report_id": report_id}

    if df.empty:
        return {"error": "Uploaded CSV is empty.", "report_id": report_id}

    # Auto-detect columns
    datetime_col = _detect_datetime_col(df) if datetime_col_override is None else datetime_col_override or None
    if datetime_col is not None and datetime_col not in df.columns:
        return {"error": f"Datetime column '{datetime_col}' was not found.", "report_id": report_id}
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    target_col = _detect_target_col(df, datetime_col) if target_col_override is None else target_col_override or None
    if target_col is not None and target_col not in df.columns:
        return {"error": f"Target column '{target_col}' was not found.", "report_id": report_id}
    if target_col is not None and not pd.api.types.is_numeric_dtype(df[target_col]):
        return {"error": f"Target column '{target_col}' must be numeric.", "report_id": report_id}

    # Parse datetime if found
    if datetime_col:
        parsed_dates = pd.to_datetime(df[datetime_col], errors="coerce")
        valid_date_ratio = float(parsed_dates.notna().mean())
        if valid_date_ratio < 0.8:
            return {"error": f"Datetime column '{datetime_col}' could not be parsed reliably ({valid_date_ratio:.0%} valid values).", "report_id": report_id}
        df[datetime_col] = parsed_dates

    # Build comprehensive report
    report: Dict[str, Any] = {
        "report_id": report_id,
        "filename": original_filename,
        "source_file": os.path.basename(filepath),
        "generated_at": datetime.now().isoformat(),
        "dataset_overview": {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "memory_usage_mb": round(df.memory_usage(deep=True).sum() / 1024 / 1024, 2),
            "datetime_column": datetime_col,
            "target_column": target_col,
            "numeric_columns": numeric_cols,
            "categorical_columns": df.select_dtypes(include=["object", "category"]).columns.tolist(),
            "column_names": df.columns.tolist(),
        },
    }

    if datetime_col:
        try:
            report["dataset_overview"]["date_range"] = {
                "start": str(df[datetime_col].min()),
                "end": str(df[datetime_col].max()),
            }
        except Exception:
            pass

    # Data Quality
    report["data_quality"] = _generate_missing_data_analysis(df)
    duplicate_rows = int(df.duplicated().sum())
    constant_columns = [str(col) for col in df.columns if df[col].nunique(dropna=True) <= 1]
    high_missing_columns = [str(col) for col in df.columns if float(df[col].isna().mean()) >= 0.2]
    missing_ratio = float(df.isna().sum().sum()) / max(1, int(df.shape[0] * df.shape[1]))
    duplicate_ratio = duplicate_rows / max(1, len(df))
    duplicate_timestamps = int(df[datetime_col].duplicated().sum()) if datetime_col else 0
    quality_score = round(max(0.0, min(100.0, 100 - missing_ratio * 45 - duplicate_ratio * 25 - len(constant_columns) / max(1, len(df.columns)) * 15)), 1)
    report["data_quality"].update({
        "duplicate_rows": duplicate_rows,
        "duplicate_rows_percent": round(duplicate_ratio * 100, 2),
        "constant_columns": constant_columns,
        "high_missing_columns": high_missing_columns,
        "quality_score": quality_score,
        "checks": [
            {"name": "Missing values", "status": "warning" if missing_ratio > 0.05 else "pass", "detail": f"{report['data_quality']['columns_with_missing']} columns contain nulls."},
            {"name": "Duplicate rows", "status": "warning" if duplicate_rows else "pass", "detail": f"{duplicate_rows:,} duplicate rows ({duplicate_ratio * 100:.2f}%)."},
            {"name": "Constant features", "status": "warning" if constant_columns else "pass", "detail": f"{len(constant_columns)} constant columns detected."},
            {"name": "Target suitability", "status": "pass" if target_col in numeric_cols else "warning", "detail": f"{target_col or 'No target selected'}"},
            {"name": "Temporal index", "status": "pass" if datetime_col else "info", "detail": f"{datetime_col or 'No datetime column selected'}"},
            {"name": "Duplicate timestamps", "status": "warning" if duplicate_timestamps else ("pass" if datetime_col else "info"), "detail": f"{duplicate_timestamps:,} repeated timestamps." if datetime_col else "No datetime column selected."},
        ],
    })

    # Column Profiles
    report["column_profiles"] = _generate_column_profiles(df)

    # Distributions
    report["distributions"] = _generate_distribution_data(df, numeric_cols)

    # Correlation Matrix
    report["correlation_matrix"] = _generate_correlation_matrix(df, numeric_cols)

    # Outlier Analysis
    report["outlier_analysis"] = _generate_outlier_analysis(df, numeric_cols)

    # Time Series Analytics (if datetime detected)
    if datetime_col and target_col:
        report["time_series_analytics"] = _generate_time_series_analytics(
            df, datetime_col, target_col
        )
    else:
        report["time_series_analytics"] = {}

    # Pairwise scatter data
    if target_col:
        report["scatter_analysis"] = _generate_pairwise_scatter_data(
            df, target_col, numeric_cols
        )
    else:
        report["scatter_analysis"] = []

    # Sample data (first 20 rows)
    sample = df.head(20)
    report["sample_data"] = {
        "columns": df.columns.tolist(),
        "rows": json.loads(sample.to_json(orient="records", date_format="iso", default_handler=str)),
    }

    # Save report JSON
    report_path = os.path.join(REPORTS_DIR, f"{report_id}.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, default=str)

    return report


def get_report(report_id: str) -> Optional[Dict[str, Any]]:
    """Load a saved report by ID."""
    _ensure_dirs()
    report_path = os.path.join(REPORTS_DIR, f"{report_id}.json")
    if os.path.exists(report_path):
        with open(report_path, "r") as f:
            return json.load(f)
    return None


def list_reports() -> List[Dict[str, str]]:
    """List all available reports."""
    _ensure_dirs()
    reports = []
    for fname in sorted(os.listdir(REPORTS_DIR), reverse=True):
        if fname.endswith(".json"):
            try:
                path = os.path.join(REPORTS_DIR, fname)
                with open(path, "r") as f:
                    data = json.load(f)
                reports.append({
                    "report_id": data.get("report_id", fname.replace(".json", "")),
                    "filename": data.get("filename", "Unknown"),
                    "generated_at": data.get("generated_at", ""),
                    "total_rows": data.get("dataset_overview", {}).get("total_rows", 0),
                    "total_columns": data.get("dataset_overview", {}).get("total_columns", 0),
                })
            except (json.JSONDecodeError, KeyError):
                continue
    return reports


def delete_report(report_id: str) -> bool:
    """Delete a report."""
    _ensure_dirs()
    report_path = os.path.join(REPORTS_DIR, f"{report_id}.json")
    if os.path.exists(report_path):
        try:
            with open(report_path, "r", encoding="utf-8") as f:
                report = json.load(f)
            source_file = os.path.basename(report.get("source_file", ""))
            if source_file:
                source_path = os.path.join(UPLOAD_DIR, source_file)
                if os.path.isfile(source_path):
                    os.remove(source_path)
        except (OSError, json.JSONDecodeError):
            pass
        os.remove(report_path)
        return True
    return False
