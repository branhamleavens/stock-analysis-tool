# Stock‑MCP

A Python FastAPI service that fetches historical stock data from Polygon.io, computes key technical indicators (RSI, MACD, SMA), builds Jinja2 prompts, and returns LLM‑driven market analysis via OpenAI.

## Features

- Fetches and paginates Polygon.io daily bars  
- Computes RSI, MACD (and histogram), 50‑day & 200‑day SMA  
- Jinja2‑templated prompt generation  
- Async FastAPI endpoint (`GET /analyze?ticker=…`)  
- Pluggable LLM backends (OpenAI, Anthropic)  

## Installation

1. **Clone the repo**  
   ```bash
   git clone https://github.com/yourusername/stock-mcp.git
   cd stock-mcp
   ```

2. **Create & Activate Virtual Environment**  
   ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3. ***Install Dependencies***
    ```bash
    pipenv install
    ```

## Configuration

Use .env.example as template for .env file.  (Insert API Keys for Polygon & OpenAI)

https://polygon.io
https://platform.openai.com

## Usage

Run the development server locally:
```bash
uvicorn main:app --reload
```

Analyze a Ticker
```bash
curl "http://127.0.0.1:8000/analyze?ticker=AAPL"
```
