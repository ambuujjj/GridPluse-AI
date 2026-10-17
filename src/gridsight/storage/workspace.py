import os
import re
import shutil
from typing import List, Optional

import pandas as pd


class WorkspaceStorage:
    """
    Manages isolated per-user and per-project disk storage.
    Enforces Parquet persistence, path traversal protection, and formula injection sanitization.
    """

    CATEGORIES = ("raw", "processed", "features", "models", "forecasts", "reports")

    def __init__(self, workspace_root: Optional[str] = None):
        self.workspace_root = os.path.abspath(workspace_root or "workspace")
        os.makedirs(self.workspace_root, exist_ok=True)

    def _sanitize_identifier(self, identifier: str) -> str:
        """
        Sanitizes user_id and project_id to prevent path traversal.
        Allows only alphanumeric characters, dashes, and underscores.
        """
        if not identifier or not isinstance(identifier, str):
            raise ValueError("Identifier must be a non-empty string.")

        # Strict alphanumeric + dash/underscore check
        cleaned = re.sub(r"[^a-zA-Z0-9_\-]", "", identifier)
        if not cleaned or ".." in identifier or "/" in identifier or "\\" in identifier:
            raise ValueError(f"Invalid path identifier detected: '{identifier}'")
        return cleaned

    def _sanitize_filename(self, filename: str) -> str:
        """Sanitizes file names to prevent directory traversal and special control characters."""
        if not filename or not isinstance(filename, str):
            raise ValueError("Filename must be a non-empty string.")
        if ".." in filename or "/" in filename or "\\" in filename:
            raise ValueError(f"Path traversal detected in filename: '{filename}'")
        cleaned = re.sub(r"[^\w\.\-]", "_", filename)
        if not cleaned:
            raise ValueError(f"Invalid or unsafe filename: '{filename}'")
        return cleaned

    def get_project_dir(self, user_id: str, project_id: str) -> str:
        """Returns the isolated root directory for a project and ensures subfolders exist."""
        clean_user = self._sanitize_identifier(user_id)
        clean_project = self._sanitize_identifier(project_id)

        project_dir = os.path.join(self.workspace_root, clean_user, clean_project)
        for cat in self.CATEGORIES:
            os.makedirs(os.path.join(project_dir, cat), exist_ok=True)
        return project_dir

    def get_category_path(self, user_id: str, project_id: str, category: str) -> str:
        if category not in self.CATEGORIES:
            raise ValueError(f"Invalid category: '{category}'. Must be one of {self.CATEGORIES}")
        project_dir = self.get_project_dir(user_id, project_id)
        return os.path.join(project_dir, category)

    def save_raw_file(self, user_id: str, project_id: str, filename: str, content: bytes) -> str:
        """Saves uploaded raw file into the project's raw/ directory with traversal protection."""
        cat_dir = self.get_category_path(user_id, project_id, "raw")
        safe_name = self._sanitize_filename(filename)
        target_path = os.path.join(cat_dir, safe_name)

        with open(target_path, "wb") as f:
            f.write(content)
        return target_path

    def save_parquet(
        self,
        user_id: str,
        project_id: str,
        category: str,
        filename: str,
        df: pd.DataFrame,
        compression: str = "snappy",
    ) -> str:
        """Saves a Pandas DataFrame to Parquet format for fast, typed columnar storage."""
        cat_dir = self.get_category_path(user_id, project_id, category)
        safe_name = self._sanitize_filename(filename)
        if not safe_name.endswith(".parquet"):
            safe_name += ".parquet"
        target_path = os.path.join(cat_dir, safe_name)

        df.to_parquet(target_path, engine="pyarrow", compression=compression, index=False)
        return target_path

    def load_parquet(self, user_id: str, project_id: str, category: str, filename: str) -> pd.DataFrame:
        """Loads a Pandas DataFrame from an isolated Parquet file."""
        cat_dir = self.get_category_path(user_id, project_id, category)
        safe_name = self._sanitize_filename(filename)
        if not safe_name.endswith(".parquet"):
            safe_name += ".parquet"
        target_path = os.path.join(cat_dir, safe_name)

        if not os.path.exists(target_path):
            raise FileNotFoundError(f"Parquet file not found at: {target_path}")

        return pd.read_parquet(target_path, engine="pyarrow")

    def save_sanitized_csv(
        self,
        user_id: str,
        project_id: str,
        category: str,
        filename: str,
        df: pd.DataFrame,
    ) -> str:
        """
        Exports a CSV file protected against CSV/Excel formula injection.
        Any string cell beginning with '=', '+', '-', or '@' is prefixed with a single quote.
        """
        cat_dir = self.get_category_path(user_id, project_id, category)
        safe_name = self._sanitize_filename(filename)
        if not safe_name.endswith(".csv"):
            safe_name += ".csv"
        target_path = os.path.join(cat_dir, safe_name)

        # Defense-in-depth: formula injection escape
        df_safe = df.copy()
        for col in df_safe.select_dtypes(include=["object", "string"]).columns:
            df_safe[col] = df_safe[col].apply(
                lambda val: f"'{val}" if isinstance(val, str) and val.startswith(("=", "+", "-", "@")) else val
            )

        df_safe.to_csv(target_path, index=False)
        return target_path

    def delete_project_storage(self, user_id: str, project_id: str) -> bool:
        """Recursively removes a project's storage directory."""
        clean_user = self._sanitize_identifier(user_id)
        clean_project = self._sanitize_identifier(project_id)
        project_dir = os.path.join(self.workspace_root, clean_user, clean_project)

        if os.path.exists(project_dir):
            shutil.rmtree(project_dir)
            return True
        return False

    def list_files(self, user_id: str, project_id: str, category: str) -> List[str]:
        cat_dir = self.get_category_path(user_id, project_id, category)
        if os.path.exists(cat_dir):
            return os.listdir(cat_dir)
        return []
