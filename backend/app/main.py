from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import TextileAppException
from app.db.base import Base
from app.db.session import engine, get_db
from app.api.v1.router import api_router
# Import all models to ensure metadata registration
import app.models # noqa


import logging

logger = logging.getLogger("everest_os")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema lifecycle is strictly managed via Alembic migrations.
    # Run `alembic upgrade head` to apply database migrations.
    logger.info("Everest Textile OS backend initialized. Database schema governed by Alembic.")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
# Everest Textile OS — Backend API
Enterprise Textile Manufacturing & Factory Intelligence Operating System.

### Core Modules
* **Authentication & RBAC:** Role-based access for Owner, Manager, Production, Quality, Inventory, Dispatch, Finance, and Buyer.
* **Orders & Timeline:** Sales order management, item tracking, milestone timelines, and financial cost breakdowns.
* **Inventory Movement Ledger:** Transactional stock movements, lot tracking, strict unit checks, no-negative-stock validation.
* **Production & Live Telemetry:** Production orders, loom machine statuses, shift outputs, speed, downtime tracking.
* **Quality & 4-Point Grading:** Fabric rolls tracking, inspection defect recording, and complete roll genealogy trees.
* **Dispatch Safeguards:** Double-dispatch prevention and strict quality eligibility validation.
* **Virtual Factory Simulator Adapter:** Idempotent telemetry ingestion and automated alert triggering for Member 3.
* **Rescue & Intelligence Engine:** Structured recovery plans with authorization and execution workflows.
    """,
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration for Member 1 Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers
@app.exception_handler(TextileAppException)
async def textile_exception_handler(request: Request, exc: TextileAppException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        errors.append({
            "field": loc,
            "message": err.get("msg"),
            "type": err.get("type"),
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error_code": "VALIDATION_ERROR",
            "message": "Input validation failed for request payload.",
            "errors": errors,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    # In debug mode return message, in production keep safe
    error_msg = str(exc) if settings.DEBUG else "An unexpected server error occurred."
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": error_msg,
        },
    )


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    """Liveness probe to verify backend application process health."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
    }


@app.get("/ready", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/ready", tags=["Health"])
def readiness_check(db: Session = Depends(get_db)):
    """Readiness probe checking database connectivity and system operational state."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "service": settings.PROJECT_NAME,
            "version": "1.0.0",
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
            },
        )


# Include v1 API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

