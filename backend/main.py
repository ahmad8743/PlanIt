from fastapi import FastAPI
from routers import filters, search
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PlanIt API",
    description="Intelligent Location Planning Platform API",
    version="1.0.0"
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend development server
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Include routers
app.include_router(filters.router, prefix="/api")
app.include_router(search.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "PlanIt API is running", "docs": "/docs"}