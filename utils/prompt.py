import os
from jinja2 import Environment, FileSystemLoader

# Directory structure:
# project_root/
# ├── templates/
# │   └── analysis_prompt.txt.j2   <- content above
# └── utils/
#     └── prompt.py  <- this file

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")

env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    trim_blocks=True,
    lstrip_blocks=True,
)

def build_analysis_prompt(indicators: dict) -> str:
    """
    indicators should be the dict returned by get_technical_indicators, e.g.:
      {
        "ticker": "AAPL",
        "close": 210.01,
        "rsi_14": 60.08,
        "macd": 2.18,
        "macd_hist": 1.4,
        "sma_50": 203.86,
        "sma_200": 223.02,
        "date": "2025-07-08"
      }
    """
    template = env.get_template("analysis_prompt.txt.j2")
    return template.render(**indicators)