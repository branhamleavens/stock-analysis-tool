import os
import httpx
import pandas as pd
import pandas_ta as ta
from dotenv import load_dotenv
from datetime import datetime, timedelta
from aws_lambda_powertools import Logger  # <-- Added
from aiolimiter import AsyncLimiter

logger = Logger(service="polygon_service")  # <-- Added

load_dotenv()
POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")
BASE_URL = "https://api.polygon.io"

# Create a limiter: 5 requests per 60 seconds
polygon_limiter = AsyncLimiter(5, 60)

# Format: YYYY-MM-DD
def get_date_range(days: int):
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=days)
    return start_date.isoformat(), today.isoformat()

async def get_price_data(ticker: str, days: int = 60):
    start_date, end_date = get_date_range(days)
    url = f"{BASE_URL}/v2/aggs/ticker/{ticker.upper()}/range/1/day/{start_date}/{end_date}"
    logger.debug(f"URL Request: {url}")
    params = {
        "adjusted": "true",
        "sort": "asc",
        "limit": 5000,
        "apiKey": POLYGON_API_KEY,
    }

    async with polygon_limiter:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            logger.debug(f"Polygon API response for {ticker}: {data}")
            results = data.get("results", [])
            if not results:
                logger.warning(f"No results in Polygon response for {ticker}")
                return None

            df = pd.DataFrame(results)
            logger.debug(f"Initial DataFrame head for {ticker}:\n{df.head()}")
            df["t"] = pd.to_datetime(df["t"], unit="ms")
            df.set_index("t", inplace=True)
            df.rename(columns={"c": "close"}, inplace=True)

            logger.debug(f"DataFrame after index and rename:\n{df.head()}")

            return df[["close"]]

async def get_technical_indicators(ticker: str):
    df = await fetch_all_price_data(ticker, days=1000)
    if df is None or len(df) < 50:
        logger.warning(f"Insufficient data for {ticker} (rows: {0 if df is None else len(df)})")
        return None

    logger.debug(f"Data before indicators:\n{df.tail()}")

    df["rsi"] = ta.rsi(df["close"], length=14)
    logger.debug(f"RSI head:\n{df['rsi'].head(20)}")

    macd = ta.macd(df["close"])
    df["macd"] = macd["MACD_12_26_9"]
    df["macd_hist"] = macd["MACDh_12_26_9"]
    logger.debug(f"MACD head:\n{df[['macd', 'macd_hist']].head(20)}")

    df["sma_50"] = ta.sma(df["close"], length=50)
    df["sma_200"] = ta.sma(df["close"], length=200)

    logger.debug(f"SMA 50/200 head:\n{df[['sma_50', 'sma_200']].head(60)}")

    df.dropna(inplace=True)

    logger.debug(f"Data after dropna, rows remaining: {len(df)}")
    if df.empty:
        logger.warning(f"No valid indicator data for {ticker} after dropping NaNs")
        return None

    latest = df.iloc[-1]
    logger.debug(f"Latest indicators for {ticker} on {latest.name.date()}:\n{latest}")

    return {
        "ticker": ticker.upper(),
        "close": round(latest["close"], 2),
        "rsi_14": round(latest["rsi"], 2),
        "macd": round(latest["macd"], 2),
        "macd_hist": round(latest["macd_hist"], 2),
        "sma_50": round(latest["sma_50"], 2),
        "sma_200": round(latest["sma_200"], 2),
        "date": latest.name.strftime("%Y-%m-%d"),
    }

async def fetch_all_price_data(ticker: str, days: int = 1000):
    """
    Fetches all daily bars for the past `days` calendar days,
    following pagination via next_url, and returns a DataFrame.
    """
    start_date, end_date = get_date_range(days)
    # initial URL (we’ll append apiKey manually when following next_url)
    url = (
        f"{BASE_URL}/v2/aggs/ticker/{ticker.upper()}"
        f"/range/1/day/{start_date}/{end_date}"
        f"?adjusted=true&sort=asc&limit=120&apiKey={POLYGON_API_KEY}"
    )

    all_results = []
    async with httpx.AsyncClient() as client:
        while url:
            resp = await client.get(url)
            resp.raise_for_status()
            page = resp.json()
            logger.debug(f"fetched {len(page.get('results', []))} rows for {ticker}")
            all_results.extend(page.get("results", []))

            # follow pagination
            next_url = page.get("next_url")
            if next_url:
                url = f"{next_url}&apiKey={POLYGON_API_KEY}"
            else:
                url = None

    if not all_results:
        return None

    # build DataFrame
    df = pd.DataFrame(all_results)
    df["t"] = pd.to_datetime(df["t"], unit="ms")
    df.set_index("t", inplace=True)
    df.rename(columns={"c": "close"}, inplace=True)

    logger.debug(f"combined DataFrame rows for {ticker}: {len(df)}")
    return df[["close"]]
