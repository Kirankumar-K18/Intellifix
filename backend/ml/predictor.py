"""
IntelliFix ML Predictor
-----------------------

Model 1: Department Classifier
    TF-IDF + Logistic Regression

Model 2: Priority Predictor
    Random Forest Classifier

IMPORTANT:
Department prediction is restricted to departments that currently
exist and are ACTIVE in the database.
"""

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent / "saved_models"


# ============================================================
# LAZY-LOADED MODEL OBJECTS
# ============================================================

_dept_tfidf = None
_dept_clf = None
_dept_le = None

_pri_clf = None
_pri_le = None


# ============================================================
# LOAD MODELS
# ============================================================

def _load_models():

    global _dept_tfidf
    global _dept_clf
    global _dept_le
    global _pri_clf
    global _pri_le

    if _dept_clf is not None:
        return True

    try:

        import joblib

        _dept_tfidf = joblib.load(
            MODELS_DIR / "tfidf_vectorizer.pkl"
        )

        _dept_clf = joblib.load(
            MODELS_DIR / "department_classifier.pkl"
        )

        _dept_le = joblib.load(
            MODELS_DIR / "dept_label_encoder.pkl"
        )

        _pri_clf = joblib.load(
            MODELS_DIR / "priority_classifier.pkl"
        )

        _pri_le = joblib.load(
            MODELS_DIR / "priority_label_encoder.pkl"
        )

        return True

    except FileNotFoundError:

        logger.warning(
            "ML models not found. Run: python ml/train.py"
        )

        return False

    except Exception as e:

        logger.error(
            f"Error loading ML models: {e}"
        )

        return False


# ============================================================
# DEPARTMENT KEYWORDS
# ============================================================

DEPT_KEYWORDS = {

    "Roads & Transport": [
        "road",
        "pothole",
        "potholes",
        "highway",
        "footpath",
        "sidewalk",
        "pavement",
        "bridge",
        "divider",
        "street",
        "road damage",
        "road repair",
        "bus",
        "transport",
    ],

    "Electricity": [
        "electricity",
        "electric",
        "power",
        "outage",
        "blackout",
        "voltage",
        "transformer",
        "electric pole",
        "power pole",
        "meter",
        "short circuit",
        "wire",
        "wires",
        "street light",
        "streetlight",
    ],

    "Water & Drainage": [
        "water",
        "water supply",
        "tap",
        "pipeline",
        "pipe",
        "leak",
        "leakage",
        "drain",
        "drainage",
        "sewer",
        "sewage",
        "flood",
        "waterlogging",
        "contaminated water",
    ],

    "Waste Management": [
        "garbage",
        "waste",
        "trash",
        "litter",
        "dump",
        "dumping",
        "rubbish",
        "solid waste",
        "dirty",
        "cleaning",
        "collection",
        "garbage collection",
    ],

    "Parks & Public Spaces": [
        "park",
        "garden",
        "playground",
        "tree",
        "grass",
        "bench",
        "public space",
        "recreation",
        "sports ground",
        "open space",
    ],

    "Public Buildings & Facilities": [
        "building",
        "public building",
        "facility",
        "college",
        "school building",
        "government building",
        "office",
        "toilet",
        "classroom",
        "laboratory",
        "lab",
        "campus",
        "library",
        "community hall",
    ],

    "Traffic & Road Safety": [
        "traffic",
        "traffic signal",
        "signal",
        "accident",
        "road safety",
        "speed",
        "speeding",
        "zebra crossing",
        "crossing",
        "traffic light",
        "parking",
        "congestion",
        "unsafe driving",
        "helmet",
    ],

    "Animal Control": [
        "dog",
        "dogs",
        "stray dog",
        "stray dogs",
        "cat",
        "animal",
        "animals",
        "cow",
        "cattle",
        "monkey",
        "snake",
        "animal bite",
        "stray animal",
    ],
}


# ============================================================
# SEVERITY KEYWORDS
# ============================================================

SEVERITY_KEYWORDS = {

    "critical": [
        "collapse",
        "explosion",
        "fire",
        "flood",
        "emergency",
        "outbreak",
        "death",
        "injury",
        "accident",
        "burst",
    ],

    "high": [
        "dangerous",
        "hazard",
        "contaminated",
        "blocked",
        "severe",
        "critical",
        "urgent",
        "immediate",
        "major",
    ],

    "medium": [
        "broken",
        "damaged",
        "leaking",
        "not working",
        "missing",
        "dirty",
        "overflowing",
        "shortage",
    ],

    "low": [
        "minor",
        "small",
        "request",
        "suggest",
        "maintenance",
        "routine",
    ],
}


# ============================================================
# NORMALIZE DEPARTMENT NAME
# ============================================================

def _normalize_department_name(name):

    if not name:
        return ""

    return (
        str(name)
        .strip()
        .lower()
        .replace("&", "and")
        .replace("-", " ")
        .replace("_", " ")
    )


# ============================================================
# FIND MATCHING ACTIVE DEPARTMENT
# ============================================================

def _match_allowed_department(
    predicted_name,
    allowed_departments
):

    if not predicted_name:
        return None

    predicted_normalized = _normalize_department_name(
        predicted_name
    )

    # --------------------------------------------------------
    # Exact normalized match
    # --------------------------------------------------------

    for department in allowed_departments:

        if (
            _normalize_department_name(department)
            == predicted_normalized
        ):
            return department

    # --------------------------------------------------------
    # Partial matching
    # --------------------------------------------------------

    predicted_words = set(
        predicted_normalized.split()
    )

    best_match = None
    best_score = 0

    for department in allowed_departments:

        dept_normalized = _normalize_department_name(
            department
        )

        dept_words = set(
            dept_normalized.split()
        )

        if not dept_words:
            continue

        overlap = predicted_words.intersection(
            dept_words
        )

        score = len(overlap)

        if score > best_score:

            best_score = score
            best_match = department

    return best_match


# ============================================================
# RULE-BASED DEPARTMENT SCORING
# ============================================================

def _keyword_department_predictions(
    text,
    allowed_departments,
    top_n=3
):

    text_lower = str(text).lower()

    scores = {}

    # --------------------------------------------------------
    # Only consider departments currently in DB
    # --------------------------------------------------------

    for department in allowed_departments:

        keywords = DEPT_KEYWORDS.get(
            department,
            []
        )

        score = 0

        for keyword in keywords:

            if keyword.lower() in text_lower:

                # Multi-word keywords are more specific.
                if " " in keyword:

                    score += 2

                else:

                    score += 1

        if score > 0:

            scores[department] = score

    if not scores:
        return []

    # --------------------------------------------------------
    # Sort by score
    # --------------------------------------------------------

    sorted_scores = sorted(
        scores.items(),
        key=lambda x: x[1],
        reverse=True
    )[:top_n]

    total = sum(
        score
        for _, score in sorted_scores
    )

    results = []

    for department, score in sorted_scores:

        confidence = (
            score / total * 100
        )

        results.append({
            "department": department,
            "confidence": round(
                confidence,
                1
            ),
        })

    return results


# ============================================================
# DEPARTMENT PREDICTION
# ============================================================

def predict_department(
    text: str,
    top_n: int = 3,
    allowed_departments=None
):

    """
    Predict departments from complaint description.

    IMPORTANT:
    If allowed_departments is supplied, predictions are
    restricted ONLY to those departments.

    Example:

        allowed_departments = [
            "Roads & Transport",
            "Electricity",
            "Water & Drainage"
        ]

    The function will NEVER return a department outside
    this list.
    """

    if not text:
        return []

    # --------------------------------------------------------
    # Clean allowed department list
    # --------------------------------------------------------

    if allowed_departments is None:

        allowed_departments = list(
            DEPT_KEYWORDS.keys()
        )

    allowed_departments = [
        str(dept).strip()
        for dept in allowed_departments
        if str(dept).strip()
    ]

    if not allowed_departments:
        return []

    # ========================================================
    # FIRST: RULE-BASED RELEVANCE
    # ========================================================

    keyword_predictions = (
        _keyword_department_predictions(
            text,
            allowed_departments,
            top_n=top_n
        )
    )

    # ========================================================
    # ML PREDICTION
    # ========================================================

    ml_predictions = []

    if _load_models():

        try:

            import numpy as np

            X = _dept_tfidf.transform(
                [text]
            )

            proba = _dept_clf.predict_proba(
                X
            )[0]

            top_indexes = np.argsort(
                proba
            )[::-1]

            for index in top_indexes:

                if proba[index] <= 0.01:
                    continue

                predicted_department = (
                    _dept_le.inverse_transform(
                        [index]
                    )[0]
                )

                # ------------------------------------------------
                # CRITICAL:
                # Ignore ML departments which do not currently
                # exist in the database.
                # ------------------------------------------------

                matched_department = (
                    _match_allowed_department(
                        predicted_department,
                        allowed_departments
                    )
                )

                if not matched_department:
                    continue

                ml_predictions.append({
                    "department":
                        matched_department,

                    "confidence":
                        round(
                            float(proba[index]) * 100,
                            1
                        ),
                })

                if len(ml_predictions) >= top_n:
                    break

        except Exception as e:

            logger.error(
                f"Dept prediction error: {e}"
            )

    # ========================================================
    # COMBINE ML + KEYWORD RESULTS
    # ========================================================

    combined = {}

    # --------------------------------------------------------
    # Add ML predictions
    # --------------------------------------------------------

    for prediction in ml_predictions:

        department = prediction[
            "department"
        ]

        combined[department] = (
            prediction["confidence"] * 0.60
        )

    # --------------------------------------------------------
    # Add keyword relevance
    # --------------------------------------------------------

    for prediction in keyword_predictions:

        department = prediction[
            "department"
        ]

        keyword_score = (
            prediction["confidence"]
        )

        if department in combined:

            combined[department] += (
                keyword_score * 0.40
            )

        else:

            combined[department] = (
                keyword_score
            )

    # ========================================================
    # IF NOTHING FROM ML OR KEYWORDS
    # ========================================================

    if not combined:

        # No relevant department found.
        # Do NOT invent "General" or another department.

        return []

    # ========================================================
    # SORT FINAL RESULTS
    # ========================================================

    sorted_results = sorted(
        combined.items(),
        key=lambda x: x[1],
        reverse=True
    )

    sorted_results = sorted_results[:top_n]

    # --------------------------------------------------------
    # Normalize confidence to 100
    # --------------------------------------------------------

    total_score = sum(
        score
        for _, score in sorted_results
    )

    if total_score <= 0:

        return []

    results = []

    for department, score in sorted_results:

        confidence = (
            score / total_score * 100
        )

        results.append({
            "department":
                department,

            "confidence":
                round(
                    confidence,
                    1
                ),
        })

    return results


# ============================================================
# PRIORITY PREDICTION
# ============================================================

def predict_priority(
    description: str,
    severity: int,
    population_affected: int,
    frequency: int,
    has_image: bool,
    department_name: str = ""
):

    """
    Priority scoring formula:

        40% severity
        30% population affected
        20% complaint frequency
        10% image presence

    Returns:

        {
            priority,
            score,
            breakdown
        }
    """

    import math

    # ========================================================
    # SEVERITY SCORE
    # ========================================================

    text_lower = (
        description or ""
    ).lower()

    kw_boost = 0

    for keyword in SEVERITY_KEYWORDS[
        "critical"
    ]:

        if keyword in text_lower:

            kw_boost += 20

    for keyword in SEVERITY_KEYWORDS[
        "high"
    ]:

        if keyword in text_lower:

            kw_boost += 10

    for keyword in SEVERITY_KEYWORDS[
        "medium"
    ]:

        if keyword in text_lower:

            kw_boost += 5

    sev_score = min(
        100.0,
        ((severity / 5.0) * 60)
        + kw_boost
    )

    # ========================================================
    # POPULATION SCORE
    # ========================================================

    pop_score = min(
        100.0,
        math.log(
            max(
                1,
                population_affected
            ) + 1
        )
        / math.log(10001)
        * 100
    )

    # ========================================================
    # FREQUENCY SCORE
    # ========================================================

    freq_score = min(
        100.0,
        frequency * 8
    )

    # ========================================================
    # IMAGE SCORE
    # ========================================================

    img_score = (
        80.0
        if has_image
        else 20.0
    )

    # ========================================================
    # COMPOSITE SCORE
    # ========================================================

    composite = (
        sev_score * 0.40
        + pop_score * 0.30
        + freq_score * 0.20
        + img_score * 0.10
    )

    # ========================================================
    # ML PRIORITY
    # ========================================================

    ml_priority = None

    if _load_models():

        try:

            import numpy as np

            features = np.array([
                [
                    severity,
                    population_affected,
                    frequency,
                    int(has_image)
                ]
            ])

            pred_idx = _pri_clf.predict(
                features
            )[0]

            ml_priority = (
                _pri_le.inverse_transform(
                    [pred_idx]
                )[0]
            )

        except Exception as e:

            logger.error(
                f"Priority ML prediction error: {e}"
            )

            ml_priority = None

    # ========================================================
    # RULE-BASED PRIORITY
    # ========================================================

    if composite >= 75:

        rule_priority = "critical"

    elif composite >= 55:

        rule_priority = "high"

    elif composite >= 35:

        rule_priority = "medium"

    else:

        rule_priority = "low"

    # ========================================================
    # FINAL PRIORITY
    # ========================================================

    final_priority = (
        ml_priority
        if ml_priority
        else rule_priority
    )

    return {

        "priority":
            final_priority,

        "score":
            round(
                composite,
                2
            ),

        "breakdown": {

            "severity_score":
                round(
                    sev_score,
                    1
                ),

            "population_score":
                round(
                    pop_score,
                    1
                ),

            "frequency_score":
                round(
                    freq_score,
                    1
                ),

            "image_score":
                round(
                    img_score,
                    1
                ),
        }
    }