import os

import psycopg2
from flask import Flask, jsonify
from flask import request

from psycopg2.extras import RealDictCursor

app = Flask(__name__)


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("PGHOST", "localhost"),
        database=os.getenv("PGDATABASE", "pmhr"),
        user=os.getenv("PGUSER", "postgres"),
        password=os.getenv("PGPASSWORD", "root"),
        port=int(os.getenv("PGPORT", "5432")),
    )


@app.route("/users")
def get_users():
    with get_db_connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, name, email
            FROM users
            ORDER BY id
            """
        )
        rows = cur.fetchall()

    return jsonify(rows)


@app.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    with get_db_connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            INSERT INTO users (name, email, password)
            VALUES (%s, %s, %s)
            """,
            (name, email, password),
        )
        conn.commit()
    return jsonify({'message': 'User registered successfully'})


@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    with get_db_connection() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, name, email
            FROM users
            WHERE email = %s AND password = %s
            """,
            (email, password),
        )
        rows = cur.fetchall()
        if rows:
            return jsonify({'message': 'User logged in successfully', 'email': email, 'password': password})
    return jsonify({'message': 'Invalid email or password'}), 401

    


if __name__ == "__main__":
    app.run(debug=True)
