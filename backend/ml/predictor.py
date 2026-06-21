"""
IntelliFix ML Predictor
-----------------------
Model 1: Department Classifier  — TF-IDF + Logistic Regression
Model 2: Priority Predictor     — Random Forest Classifier
"""
import os
import sys
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent / 'saved_models'

# ── Lazy-loaded model objects ────────────────────────────────────────────────
_dept_tfidf = None
_dept_clf   = None
_dept_le    = None
_pri_clf    = None
_pri_le     = None


def _load_models():
    global _dept_tfidf, _dept_clf, _dept_le, _pri_clf, _pri_le
    if _dept_clf is not None:
        return True
    try:
        import joblib
        _dept_tfidf = joblib.load(MODELS_DIR / 'tfidf_vectorizer.pkl')
        _dept_clf   = joblib.load(MODELS_DIR / 'department_classifier.pkl')
        _dept_le    = joblib.load(MODELS_DIR / 'dept_label_encoder.pkl')
        _pri_clf    = joblib.load(MODELS_DIR / 'priority_classifier.pkl')
        _pri_le     = joblib.load(MODELS_DIR / 'priority_label_encoder.pkl')
        return True
    except FileNotFoundError:
        logger.warning('ML models not found. Run: python ml/train.py')
        return False
    except Exception as e:
        logger.error(f'Error loading ML models: {e}')
        return False


# ── Department keywords for rule-based fallback ──────────────────────────────
DEPT_KEYWORDS = {
    'Roads & Infrastructure': ['road','pothole','bridge','footpath','signal','highway','divider','street light','drainage','pavement'],
    'Water Supply':           ['water','pipe','pipeline','tap','supply','leak','sewage','drain','contaminated','pressure'],
    'Electricity':            ['electricity','power','electric','outage','voltage','transformer','pole','meter','blackout','short circuit'],
    'Sanitation & Waste':     ['garbage','waste','trash','sewage','smell','drain','toilet','hygiene','litter','compost'],
    'Health & Medical':       ['hospital','health','doctor','medicine','disease','ambulance','clinic','dengue','malaria','epidemic'],
    'Education':              ['school','teacher','student','book','class','midday meal','education','scholarship','college'],
    'Parks & Recreation':     ['park','garden','playground','bench','tree','grass','recreation','sports','field'],
    'Public Safety':          ['theft','crime','police','drug','harassment','accident','fight','safety','cctv','illegal'],
    'Revenue & Taxation':     ['tax','property','land','permit','certificate','license','registration','encroachment'],
}

SEVERITY_KEYWORDS = {
    'critical': ['collapse','explosion','fire','flood','emergency','outbreak','death','injury','accident','burst'],
    'high':     ['dangerous','hazard','contaminated','blocked','severe','critical','urgent','immediate','major'],
    'medium':   ['broken','damaged','leaking','not working','missing','dirty','overflowing','shortage'],
    'low':      ['minor','small','request','suggest','maintenance','routine'],
}


def predict_department(text: str, top_n: int = 3) -> list:
    """Returns list of {department, confidence} sorted by confidence desc."""
    if _load_models():
        try:
            import numpy as np
            X     = _dept_tfidf.transform([text])
            proba = _dept_clf.predict_proba(X)[0]
            top   = np.argsort(proba)[::-1][:top_n]
            return [
                {
                    'department': _dept_le.inverse_transform([i])[0],
                    'confidence': round(float(proba[i]) * 100, 1),
                }
                for i in top if proba[i] > 0.04
            ]
        except Exception as e:
            logger.error(f'Dept prediction error: {e}')

    # Rule-based fallback
    text_lower = text.lower()
    scores = {}
    for dept, keywords in DEPT_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[dept] = score
    if not scores:
        return [{'department': 'General', 'confidence': 50.0}]
    total = sum(scores.values())
    return sorted(
        [{'department': d, 'confidence': round(s/total*100, 1)} for d, s in scores.items()],
        key=lambda x: x['confidence'], reverse=True
    )[:top_n]


def predict_priority(description: str, severity: int, population_affected: int,
                     frequency: int, has_image: bool, department_name: str = '') -> dict:
    """
    Priority scoring formula:
      40% severity (keyword + user-rated)
      30% population affected
      20% complaint frequency
      10% image presence
    Returns: {priority, score, breakdown}
    """
    # Severity score (0-100)
    text_lower = description.lower()
    kw_boost   = 0
    for kw in SEVERITY_KEYWORDS['critical']:
        if kw in text_lower: kw_boost += 20
    for kw in SEVERITY_KEYWORDS['high']:
        if kw in text_lower: kw_boost += 10
    for kw in SEVERITY_KEYWORDS['medium']:
        if kw in text_lower: kw_boost += 5
    sev_score = min(100.0, ((severity / 5.0) * 60) + kw_boost)

    # Population score (0-100): log-scale
    import math
    pop_score  = min(100.0, math.log(max(1, population_affected) + 1) / math.log(10001) * 100)

    # Frequency score (0-100)
    freq_score = min(100.0, frequency * 8)

    # Image score
    img_score  = 80.0 if has_image else 20.0

    # Composite
    composite = (
        sev_score  * 0.40 +
        pop_score  * 0.30 +
        freq_score * 0.20 +
        img_score  * 0.10
    )

    # Use ML model if available
    if _load_models():
        try:
            import numpy as np
            features = np.array([[severity, population_affected, frequency, int(has_image)]])
            pred_idx = _pri_clf.predict(features)[0]
            ml_priority = _pri_le.inverse_transform([pred_idx])[0]
        except Exception:
            ml_priority = None
    else:
        ml_priority = None

    # Determine priority from composite score
    if composite >= 75:
        rule_priority = 'critical'
    elif composite >= 55:
        rule_priority = 'high'
    elif composite >= 35:
        rule_priority = 'medium'
    else:
        rule_priority = 'low'

    # ML overrides rule if available
    final_priority = ml_priority if ml_priority else rule_priority

    return {
        'priority': final_priority,
        'score':    round(composite, 2),
        'breakdown': {
            'severity_score':    round(sev_score, 1),
            'population_score':  round(pop_score, 1),
            'frequency_score':   round(freq_score, 1),
            'image_score':       round(img_score, 1),
        }
    }
