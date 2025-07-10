import os
import openai
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def analyze_stock_with_llm(prompt: str, model: str = "gpt-4o"):
    response = await client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": "You are a helpful stock analyst."},
                  {"role": "user", "content": prompt}],
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()
