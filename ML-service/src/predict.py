from pathlib import Path

import joblib
import pandas as pd


# Load trained model and scaler

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"

model = joblib.load(MODEL_DIR / "lifepredict_random_forest.pkl")
scaler = joblib.load(MODEL_DIR / "lifepredict_scaler.pkl")


# Prediction function

def predict_cardio(user_data):
    """
    Takes user health and lifestyle data
    and returns cardio prediction with probabilities.
    """

    # Convert user input into DataFrame
    input_data = pd.DataFrame([user_data])

    # Scale input using the same scaler used during training
    input_scaled = scaler.transform(input_data)

    # Make prediction
    prediction = model.predict(input_scaled)[0]

    # Get prediction probabilities
    probabilities = model.predict_proba(input_scaled)[0]

    # Return result
    return {
        "prediction": int(prediction),
        "probability_no_cardio": float(probabilities[0]),
        "probability_cardio": float(probabilities[1])
    }


# Test the prediction service


if __name__ == "__main__":

    sample_user = {
        "gender": 1,
        "weight": 70,
        "ap_hi": 120,
        "ap_lo": 80,
        "cholesterol": 1,
        "gluc": 1,
        "smoke": 0,
        "alco": 0,
        "active": 1,
        "age_years": 25,
        "height_m": 1.65,
        "BMI": 25.71
    }


    result = predict_cardio(sample_user)

    print("Prediction Result:")
    print(result)

    