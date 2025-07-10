import asyncio
from clients.polygon import get_technical_indicators, get_date_range

async def main():
    ticker = "AAPL"
    indicators = await get_technical_indicators(ticker)
    sd, ed = get_date_range(500)
    print(f"DEBUG: Date range for {ticker}: {sd} to {ed}")
    if indicators:
        print("✅ Indicators retrieved:")
        for k, v in indicators.items():
            print(f"{k}: {v}")
    else:
        print("❌ Failed to fetch indicators.")

if __name__ == "__main__":
    asyncio.run(main())
