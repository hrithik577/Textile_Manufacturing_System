from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    dashboard,
    customers,
    orders,
    inventory,
    production,
    machines,
    quality,
    rolls,
    dispatch,
    workforce,
    finance,
    alerts,
    recovery_plans,
    rescue_engine,
    integrations,
    yarniq,
    system,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(customers.router)
api_router.include_router(orders.router)
api_router.include_router(inventory.router)
api_router.include_router(production.router)
api_router.include_router(machines.router)
api_router.include_router(quality.router)
api_router.include_router(rolls.router)
api_router.include_router(dispatch.router)
api_router.include_router(workforce.router)
api_router.include_router(finance.router)
api_router.include_router(alerts.router)
api_router.include_router(recovery_plans.router)
api_router.include_router(rescue_engine.router)
api_router.include_router(integrations.router)
api_router.include_router(yarniq.router)
api_router.include_router(system.router)

