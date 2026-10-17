import os

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

# Database path in backend directory
DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
os.makedirs(DB_DIR, exist_ok=True)
SQLITE_DB_PATH = os.path.join(DB_DIR, "gridsight.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{SQLITE_DB_PATH}")

# Create engine with thread-safe settings for SQLite
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
)

# Enable SQLite WAL (Write-Ahead Logging) mode and busy timeout for concurrent safety
if "sqlite" in DATABASE_URL:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI dependency for database session injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
