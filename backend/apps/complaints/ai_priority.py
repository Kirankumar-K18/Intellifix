from apps.complaints.models import Complaint


# -------------------------------
# Severity Prediction
# -------------------------------

def predict_severity(description):
    """
    Temporary rule-based severity prediction.
    Later this will be replaced by an NLP model.
    """

    text = description.lower()

    critical_keywords = [
        "death",
        "dead",
        "collapse",
        "fire",
        "electrocution",
        "accident",
        "flood"
    ]

    high_keywords = [
        "dengue",
        "outbreak",
        "large pothole",
        "major leak",
        "garbage everywhere",
        "transformer",
        "overflow"
    ]

    medium_keywords = [
        "streetlight",
        "water leakage",
        "drain",
        "broken road",
        "garbage",
        "noise"
    ]

    for word in critical_keywords:
        if word in text:
            return 5

    for word in high_keywords:
        if word in text:
            return 4

    for word in medium_keywords:
        if word in text:
            return 3

    return 2


# -------------------------------
# Population Score
# -------------------------------

def get_population_score(location):

    text = location.lower()

    metro = [
        "mg road",
        "majestic",
        "whitefield",
        "electronic city",
        "marathahalli"
    ]

    town = [
        "tumkur",
        "mysore",
        "mandya",
        "belgaum"
    ]

    village = [
        "village",
        "halli"
    ]

    if any(x in text for x in metro):
        return 5

    if any(x in text for x in town):
        return 3

    if any(x in text for x in village):
        return 1

    return 2


# -------------------------------
# Complaint Frequency
# -------------------------------

def get_frequency_score(location):

    count = Complaint.objects.filter(
        location__icontains=location
    ).count()

    if count >= 20:
        return 5

    elif count >= 10:
        return 4

    elif count >= 5:
        return 3

    elif count >= 2:
        return 2

    return 1


# -------------------------------
# Final Priority
# -------------------------------

def calculate_priority(severity, population, frequency):

    score = (
        severity * 0.5 +
        population * 0.3 +
        frequency * 0.2
    )

    if score >= 4.5:
        return "critical"

    elif score >= 3.5:
        return "high"

    elif score >= 2.5:
        return "medium"

    return "low"