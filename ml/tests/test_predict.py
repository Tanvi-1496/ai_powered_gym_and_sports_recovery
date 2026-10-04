import unittest

from ml.src.predict import (
    get_feature_columns,
    load_model,
    predict_recovery_score,
)


class TestRecoveryModel(unittest.TestCase):

    def setUp(self):
        self.sample_input = {
            "Age": 22,
            "Gender": "Male",
            "BMI": 21.5,
            "Sport_Type": "Team Sport",
            "Training_Type": "Training",
            "Training_Duration_Min": 60,
            "Training_Intensity": 70,
            "Training_Load": 4200,
            "Training_Load_7d_Avg": 4000,
            "ACWR": 1.05,
            "Fatigue_Index": 35,
            "Playing_Surface": 1,
            "Sleep_Duration_Hours": 7.5,
            "Sleep_Quality": 8,
            "Sleep_Deficit": 0.5,
            "Sleep_Duration_7d_Avg": 7.2,
            "Resting_Heart_Rate": 60,
            "Resting_HR_7d_Avg": 61,
            "Heart_Rate": 130,
            "HRV_ms": 55,
            "HRV_7d_Avg": 53,
            "Body_Temperature": 36.7,
            "Hydration_Level": 80,
            "Stress_Level": "Medium",
            "Stress_Index": 40,
            "Mood_Score": 7,
            "Muscle_Soreness": 25,
            "Energy_Level": 75,
            "Caffeine_Intake_mg": 100,
            "Training_to_Recovery_Ratio": 1.1,
            "Step_Count": 8000,
            "Muscle_Activity": 60,
            "Joint_Angles": 90,
            "Gait_Speed": 1.5,
            "Cadence": 170,
            "Jump_Height": 40,
            "Ground_Reaction_Force": 1500,
            "Range_Of_Motion": 80,
            "Ambient_Temperature": 25,
            "Humidity": 60,
            "Altitude": 20,
            "Source_Dataset": "D3_Multimodal",
        }

    def test_model_loads(self):
        model = load_model()

        self.assertIsNotNone(model)
        self.assertEqual(type(model).__name__, "Pipeline")

    def test_feature_count(self):
        features = get_feature_columns()

        self.assertEqual(len(features), 42)

    def test_prediction_returns_valid_score(self):
        prediction = predict_recovery_score(self.sample_input)

        self.assertIsInstance(prediction, float)
        self.assertGreaterEqual(prediction, 0.0)
        self.assertLessEqual(prediction, 100.0)


if __name__ == "__main__":
    unittest.main()