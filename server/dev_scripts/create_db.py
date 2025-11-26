import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os

# Connect to default 'postgres' database
conn = psycopg2.connect(
    dbname="postgres",
    user="postgres",
    password="123",
    host="localhost",
    port="5432"
)

conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cur = conn.cursor()

try:
    cur.execute("CREATE DATABASE vocab_db;")
    print("Database 'vocab_db' created successfully.")
except psycopg2.errors.DuplicateDatabase:
    print("Database 'vocab_db' already exists.")
except Exception as e:
    print(f"Error creating database: {e}")
finally:
    cur.close()
    conn.close()
