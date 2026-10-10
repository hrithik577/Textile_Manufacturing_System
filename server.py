from fastapi import FastAPI
from demo_rescue_flow import run_demo
import io
import sys
from fastapi.responses import PlainTextResponse

app = FastAPI(title="Everest Textile OS - Member 3 Simulator API")

@app.get("/")
def read_root():
    return {"message": "Welcome to Everest Textile OS Simulator & Intelligence Engine (Member 3 API)"}

@app.get("/demo", response_class=PlainTextResponse)
def run_simulation_demo():
    """Runs the full simulation demo and returns the terminal output."""
    # Capture the output of run_demo
    old_stdout = sys.stdout
    new_stdout = io.StringIO()
    sys.stdout = new_stdout
    try:
        run_demo()
    finally:
        sys.stdout = old_stdout
    
    return new_stdout.getvalue()

@app.get("/health")
def health_check():
    return {"status": "ok"}
