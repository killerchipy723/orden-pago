import os
from pathlib import Path
from dotenv import load_dotenv
import pymysql
from pymysql.cursors import DictCursor

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def get_connection():
    host = os.getenv("DB_HOST")
    port = int(os.getenv("DB_PORT", "3306"))
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD", "")
    database = os.getenv("DB_NAME")

    if not all([host, user, database]):
        raise RuntimeError("Faltan variables obligatorias en el archivo .env (DB_HOST, DB_USER, DB_NAME).")

    return pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=False,
    )