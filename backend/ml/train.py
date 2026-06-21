"""
IntelliFix ML Training Script
Run: python ml/train.py
Trains:
  1. Department Classifier  (TF-IDF + Logistic Regression)
  2. Priority Classifier    (Random Forest)
"""
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib

MODELS_DIR = Path(__file__).parent / 'saved_models'
MODELS_DIR.mkdir(exist_ok=True)

# ── Training Data: Department Classifier ────────────────────────────────────
DEPT_DATA = [
    # Roads & Infrastructure
    ("Large pothole on main road causing accidents daily", "Roads & Infrastructure"),
    ("Street lights not working on highway for 2 weeks", "Roads & Infrastructure"),
    ("Bridge damaged and dangerous for vehicles", "Roads & Infrastructure"),
    ("Road blocked by construction for months", "Roads & Infrastructure"),
    ("Footpath broken making walking impossible", "Roads & Infrastructure"),
    ("Traffic signal not functioning at busy junction", "Roads & Infrastructure"),
    ("Road divider damaged causing accidents", "Roads & Infrastructure"),
    ("Speed bumps removed from school zone", "Roads & Infrastructure"),
    ("Drainage blocked causing road flooding", "Roads & Infrastructure"),
    ("Potholes everywhere on colony road", "Roads & Infrastructure"),
    ("Road repair pending for 6 months", "Roads & Infrastructure"),
    ("Manhole cover missing on main road", "Roads & Infrastructure"),

    # Water Supply
    ("No water supply in area for 3 days", "Water Supply"),
    ("Muddy water coming from taps", "Water Supply"),
    ("Water pipeline burst leaking on street", "Water Supply"),
    ("Low water pressure in morning hours", "Water Supply"),
    ("Foul smell in drinking water", "Water Supply"),
    ("Water meter not working", "Water Supply"),
    ("Wrong water bill amount received", "Water Supply"),
    ("Pipeline burst flooding the colony", "Water Supply"),
    ("No water since Monday affecting families", "Water Supply"),
    ("Water tank not cleaned for months", "Water Supply"),
    ("Sewage mixing with water supply", "Water Supply"),
    ("Tap water contaminated with dirt", "Water Supply"),

    # Electricity
    ("Power outage in colony since yesterday", "Electricity"),
    ("Electric pole leaning dangerously near school", "Electricity"),
    ("Electricity meter showing wrong readings", "Electricity"),
    ("Frequent power cuts affecting business", "Electricity"),
    ("High tension wire hanging low near building", "Electricity"),
    ("Transformer sparking and making loud noise", "Electricity"),
    ("No electricity connection given for new house", "Electricity"),
    ("Electric shock from street light post", "Electricity"),
    ("High electricity bill despite power cuts", "Electricity"),
    ("Voltage fluctuation damaging appliances", "Electricity"),
    ("Blackout lasting 10 hours every day", "Electricity"),
    ("Electric wire broken lying on road", "Electricity"),

    # Sanitation & Waste
    ("Garbage not collected for 5 days", "Sanitation & Waste"),
    ("Open drain near school emitting bad smell", "Sanitation & Waste"),
    ("Public toilet dirty and not maintained", "Sanitation & Waste"),
    ("Garbage dumped illegally on empty plot", "Sanitation & Waste"),
    ("Sewage overflow in residential colony", "Sanitation & Waste"),
    ("No dustbins provided in market area", "Sanitation & Waste"),
    ("Dead animal on road not removed", "Sanitation & Waste"),
    ("Drain blocked causing water logging", "Sanitation & Waste"),
    ("Garbage truck not coming regularly", "Sanitation & Waste"),
    ("Waste dumped near water body causing pollution", "Sanitation & Waste"),
    ("Overflowing garbage bin outside hospital", "Sanitation & Waste"),
    ("Sewage leaking into road", "Sanitation & Waste"),

    # Health & Medical
    ("Government hospital medicine shortage critical", "Health & Medical"),
    ("Doctor absent from primary health center", "Health & Medical"),
    ("Dengue outbreak spreading in our area", "Health & Medical"),
    ("Health camp cancelled without notice", "Health & Medical"),
    ("Ambulance not responding to emergency calls", "Health & Medical"),
    ("Hospital very dirty and unhygienic", "Health & Medical"),
    ("Vaccination drive not organized", "Health & Medical"),
    ("Food adulteration at local restaurant", "Health & Medical"),
    ("Mosquito breeding in stagnant water", "Health & Medical"),
    ("Medical waste dumped openly near colony", "Health & Medical"),
    ("No doctor available at night in hospital", "Health & Medical"),
    ("Expired medicines being sold in pharmacy", "Health & Medical"),

    # Education
    ("School building roof is leaking badly", "Education"),
    ("Teacher absent regularly disrupting studies", "Education"),
    ("Mid-day meal not provided to students", "Education"),
    ("Textbooks not distributed this semester", "Education"),
    ("No furniture or blackboard in classroom", "Education"),
    ("School toilet not functional for months", "Education"),
    ("Drinking water unavailable at school", "Education"),
    ("Teacher vacancy not filled for 6 months", "Education"),
    ("School admission denied to eligible child", "Education"),
    ("Scholarship not credited to students", "Education"),
    ("Playground in dangerous condition at school", "Education"),
    ("No electricity in school building", "Education"),

    # Parks & Recreation
    ("Park benches broken and unusable", "Parks & Recreation"),
    ("Children play equipment damaged in park", "Parks & Recreation"),
    ("Park lights not working at night", "Parks & Recreation"),
    ("Stray dogs attacking people in park", "Parks & Recreation"),
    ("Park full of garbage not cleaned", "Parks & Recreation"),
    ("Sports court in terrible condition", "Parks & Recreation"),
    ("Tree branches blocking path in park", "Parks & Recreation"),
    ("Unauthorized vendors occupying park space", "Parks & Recreation"),
    ("Pond in park full of waste", "Parks & Recreation"),
    ("No maintenance of public garden", "Parks & Recreation"),

    # Public Safety
    ("Chain snatching incidents increasing in area", "Public Safety"),
    ("Illegal liquor shop near school", "Public Safety"),
    ("Eve teasing and harassment at bus stop", "Public Safety"),
    ("Suspicious activity in abandoned building", "Public Safety"),
    ("Illegal parking blocking emergency vehicles", "Public Safety"),
    ("Theft happening regularly in colony", "Public Safety"),
    ("Drug peddling openly near market", "Public Safety"),
    ("CCTV cameras not working in area", "Public Safety"),
    ("Street harassment at night market", "Public Safety"),
    ("Robbery attempt reported near temple", "Public Safety"),

    # Revenue & Taxation
    ("Property tax assessment incorrect", "Revenue & Taxation"),
    ("Land records show wrong ownership", "Revenue & Taxation"),
    ("Building plan approval delayed 6 months", "Revenue & Taxation"),
    ("Trade license renewal not processed", "Revenue & Taxation"),
    ("Government land encroachment not removed", "Revenue & Taxation"),
    ("Birth certificate correction pending", "Revenue & Taxation"),
    ("Caste certificate application pending months", "Revenue & Taxation"),
    ("Wrong property tax demand notice received", "Revenue & Taxation"),
    ("Death certificate not issued despite application", "Revenue & Taxation"),
    ("House registration delayed at registrar office", "Revenue & Taxation"),
]


def train_department_classifier():
    print('\n=== Training Department Classifier (TF-IDF + Logistic Regression) ===')
    texts  = [d[0] for d in DEPT_DATA]
    labels = [d[1] for d in DEPT_DATA]

    le = LabelEncoder()
    y  = le.fit_transform(labels)

    tfidf = TfidfVectorizer(
        max_features  = 8000,
        ngram_range   = (1, 2),
        stop_words    = 'english',
        min_df        = 1,
        sublinear_tf  = True,
    )
    X = tfidf.fit_transform(texts)

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.15, random_state=42, stratify=y)

    clf = LogisticRegression(
        max_iter     = 1000,
        C            = 2.0,
        multi_class  = 'ovr',
        solver       = 'lbfgs',
        random_state = 42,
    )
    clf.fit(X_tr, y_tr)

    acc = accuracy_score(y_te, clf.predict(X_te))
    print(f'Accuracy: {acc:.3f}')
    print(classification_report(y_te, clf.predict(X_te), target_names=le.classes_))

    joblib.dump(tfidf, MODELS_DIR / 'tfidf_vectorizer.pkl')
    joblib.dump(clf,   MODELS_DIR / 'department_classifier.pkl')
    joblib.dump(le,    MODELS_DIR / 'dept_label_encoder.pkl')
    print(f'✓ Department classifier saved to {MODELS_DIR}')


def generate_priority_data(n=3000):
    """Synthetic training data for priority prediction."""
    np.random.seed(42)
    severity   = np.random.randint(1, 6, n)
    population = np.random.randint(1, 1001, n)
    frequency  = np.random.randint(0, 51, n)
    has_image  = np.random.randint(0, 2, n)

    labels = []
    for s, p, f, i in zip(severity, population, frequency, has_image):
        import math
        sev_s  = (s / 5.0) * 60
        pop_s  = math.log(p + 1) / math.log(1001) * 100
        freq_s = min(100, f * 8)
        img_s  = 80 if i else 20
        score  = sev_s * 0.40 + pop_s * 0.30 + freq_s * 0.20 + img_s * 0.10

        if score >= 75:   labels.append('critical')
        elif score >= 55: labels.append('high')
        elif score >= 35: labels.append('medium')
        else:             labels.append('low')

    return pd.DataFrame({
        'severity': severity, 'population': population,
        'frequency': frequency, 'has_image': has_image, 'priority': labels
    })


def train_priority_classifier():
    print('\n=== Training Priority Classifier (Random Forest) ===')
    df = generate_priority_data()
    X  = df[['severity', 'population', 'frequency', 'has_image']]
    le = LabelEncoder()
    y  = le.fit_transform(df['priority'])

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

    clf = RandomForestClassifier(
        n_estimators  = 150,
        max_depth     = 12,
        min_samples_split = 4,
        class_weight  = 'balanced',
        random_state  = 42,
        n_jobs        = -1,
    )
    clf.fit(X_tr, y_tr)

    acc = accuracy_score(y_te, clf.predict(X_te))
    print(f'Accuracy: {acc:.3f}')
    print(classification_report(y_te, clf.predict(X_te), target_names=le.classes_))
    print('Feature importances:')
    for feat, imp in zip(X.columns, clf.feature_importances_):
        print(f'  {feat}: {imp:.3f}')

    joblib.dump(clf, MODELS_DIR / 'priority_classifier.pkl')
    joblib.dump(le,  MODELS_DIR / 'priority_label_encoder.pkl')
    print(f'✓ Priority classifier saved to {MODELS_DIR}')


if __name__ == '__main__':
    train_department_classifier()
    train_priority_classifier()
    print('\n✅ All ML models trained and saved successfully!')
