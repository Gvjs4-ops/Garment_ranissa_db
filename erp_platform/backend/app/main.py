from fastapi import FastAPI

from app.core.config import settings
from app.api.sales import router as sales_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.products import router as products_router
from app.api.inventory import router as inventory_router
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
)
origins = (
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://musical-waddle-v6r4xvwqp76vfw9jr-5173.app.github.dev"
        );
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(sales_router)
app.include_router(products_router)
app.include_router(inventory_router)
@app.get("/")
def root():
    return {
        "application": settings.APP_NAME,
        "status": "Running",
        "version": "1.0.0",
    }
