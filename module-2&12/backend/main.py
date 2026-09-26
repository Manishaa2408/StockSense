import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from database.connection import DB_PATH
from database.seed_data import seed_database
from routers import dashboard, filters, suppliers

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and seed database if it doesn't exist
    if not os.path.exists(DB_PATH):
        print(f"[Startup] Database not found at {DB_PATH}. Seeding fresh database...")
        seed_database()
    else:
        print(f"[Startup] Database connected at {DB_PATH}")
    yield

app = FastAPI(
    title="StockSense — Modules 02 & 12 API",
    description="Operational analytics, warehouse metrics, and Supplier/Vendor management for StockSense IMS (Odoo Hackathon).",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration to allow local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(dashboard.router)
app.include_router(filters.router)
app.include_router(suppliers.router)

@app.get("/", tags=["Health"])
def root():
    return {
        "service": "Dashboard, Analytics & Supplier Management",
        "system": "StockSense Inventory Management System",
        "edition": "Enterprise",
        "status": "ONLINE",
        "documentation": "/docs"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "database": os.path.exists(DB_PATH)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
