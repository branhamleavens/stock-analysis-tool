from http.client import HTTPException
from fastapi import FastAPI, Query
from clients.polygon import get_technical_indicators
from llm.llm import analyze_stock_with_llm
from utils.prompt import build_analysis_prompt
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/analyze")
async def analyze(ticker: str = Query(..., min_length=1, description="Ticker symbol to analyze")):
    """
    Example: GET /analyze?ticker=AAPL
    """
    indicators = await get_technical_indicators(ticker)
    if not indicators:
        raise HTTPException(status_code=400, detail=f"Could not retrieve indicators for {ticker}")

    prompt = build_analysis_prompt(indicators)
    analysis = await analyze_stock_with_llm(prompt)
    return {"ticker": ticker.upper(), "analysis": analysis, "indicators": indicators}