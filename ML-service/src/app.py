from fastapi import FastAPI
from pydantic import BaseModel

from src.predict import predict_cardio


app = FastAPI(
    title="LifePredict ML API",
    description="Cardiovascular risk prediction API",
    version="1.0.0"
)


class UserData(BaseModel):
    gender: int
    weight: float
    ap_hi: float
    ap_lo: float
    cholesterol: int
    gluc: int
    smoke: int
    alco: int
    active: int
    age_years: float
    height_m: float
    BMI: float


@app.get("/")
def home():
    return {
        "message": "LifePredict ML API is running"
    }


@app.post("/predict")
def predict(data: UserData):

    user_data = data.model_dump()

    result = predict_cardio(user_data)

    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )