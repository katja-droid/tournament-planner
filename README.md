# Tournament Planning App (AI-Powered)

An intelligent tournament management system that leverages a hybrid Artificial Intelligence architecture to optimize match scheduling.

## Technology Stack

*   **Frontend:** React + Vite
*   **Backend:** Express + JSON DB
*   **Intelligent Planner:**
    *   **Natural Language Processing:** `spaCy`, `scikit-learn` (TF-IDF)
    *   **Predictive AI:** `scikit-learn` (RandomForest, LinearSVC, LogisticRegression), `TensorFlow/Keras` (Deep Learning)
    *   **Explainable AI (XAI):** `SHAP`, `LIME`
    *   **Data Processing:** `Pandas`, `NumPy`, `Matplotlib`, `Seaborn`
    *   **Prescriptive AI:** Google OR-Tools (Constraint Programming / CP-SAT)

AI Matchmaking Engine (Hybrid Intelligence)
Unlike standard CP-SAT systems that minimize arbitrary numerical differences, this tournament planner features an intelligent matchmaking pipeline:
- **Open Source Data Training**: The ML models dynamically fetch and learn from the **ATP Men's Tennis Tour 2023 Open Dataset** (thousands of real professional matches).
- **NLP Vectorization**: Player names are processed using `scikit-learn`'s `TfidfVectorizer` (Character N-Grams) to extract hidden phonetic features.
- **Predictive Ensemble Models**: A `RandomForestRegressor`, `LinearSVC`, and a Multi-layer Perceptron (Deep Learning via `Keras`/`TensorFlow`) work together to predict **Match Quality** (expected duration in minutes) for every possible pairing.
- **Explainable AI (XAI)**: Integrated `SHAP` and `LIME` provide transparent insight into how the models evaluate player names to predict match lengths.
- **Fail-Safe Mechanism**: The Python solver gracefully falls back to synthetic data modeling if internet connectivity is lost during optimization.

## Local development

- Install all dependencies: `npm install`
- Run backend server: `npm run dev:back`
- Run frontend development server: `npm run dev:front`

## Production build

- Build frontend assets: `npm run build:front`
- Run server (serves API + built frontend): `npm run start:back`

## Deployment

See `DEPLOY.md` for full deployment strategy and provider instructions. You can also run the application seamlessly via Docker using `docker-compose up -d --build`.

## Preview

![me](https://raw.githubusercontent.com/katja-droid/tournament-planner/main/1.gif)
![me](https://raw.githubusercontent.com/katja-droid/tournament-planner/main/2.gif)
![me](https://raw.githubusercontent.com/katja-droid/tournament-planner/main/3.gif)
