# Tournament Planning App (AI-Powered)

An intelligent tournament management system that leverages a hybrid Artificial Intelligence architecture to optimize match scheduling.

## 🧠 Technology Stack

*   **Frontend:** React + Vite
*   **Backend:** Express + JSON DB
*   **Intelligent Planner:**
    *   **Natural Language Processing:** `spaCy`, `scikit-learn` (TF-IDF)
    *   **Predictive AI:** `scikit-learn` (RandomForest, LinearSVC, LogisticRegression), `TensorFlow/Keras` (Deep Learning)
    *   **Explainable AI (XAI):** `SHAP`, `LIME`
    *   **Data Processing:** `Pandas`, `NumPy`, `Matplotlib`, `Seaborn`
    *   **Prescriptive AI:** Google OR-Tools (Constraint Programming / CP-SAT)

## 💻 Local development

- Install all dependencies: `npm install`
- Run backend server: `npm run dev:back`
- Run frontend development server: `npm run dev:front`

## 🏗️ Production build

- Build frontend assets: `npm run build:front`
- Run server (serves API + built frontend): `npm run start:back`

## 🚀 Deployment

See `DEPLOY.md` for full deployment strategy and provider instructions. You can also run the application seamlessly via Docker using `docker-compose up -d --build`.

## 📸 Preview

![me](https://raw.githubusercontent.com/katja-droid/tournament-planner/main/1.gif)
![me](https://raw.githubusercontent.com/katja-droid/tournament-planner/main/2.gif)
![me](https://raw.githubusercontent.com/katja-droid/tournament-planner/main/3.gif)
