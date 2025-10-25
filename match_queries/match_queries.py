# Purpose: Get formatted output of input to existing queries
from openai import OpenAI
from apikeys import OpenAI_KEY

def get_question_type(prompt):
    client = OpenAI(api_key=OpenAI_KEY)
    base_prompt = (
        "You are a helpful assistant that classifies natural-language questions "
        "as either 'yes/no' questions or 'scale' questions. A 'scale' question is one "
        "that can be answered using a rating, such as 'How clean is this area?' "
        "Only answer with 'yes/no' or 'scale'. Reject any other answers."
    )
    prompt = base_prompt + "\n\n" + prompt + "\n\n" + "Classify the question as either 'yes/no' or 'scale'."
    response = client.responses.create(
        model="gpt-5",
        input=prompt
    )
    return response.output_text

print(get_question_type("Is this a safe neighborhood?"))
print(get_question_type("How would you rate the cleanliness of this area on a scale from 1 to 5?"))

# categorize.py
from collections import defaultdict
import re
from typing import Dict, List, Tuple, Optional

# ---------- 1) Topic catalog ----------
# Add/trim as you like. Keywords should be lowercase.
TOPIC_KEYWORDS: Dict[str, List[str]] = {
    "parks": ["park", "parks", "playground", "dog park", "green space", "botanical", "garden", "picnic", "trail", "hike", "hiking"],
    "restaurants": ["restaurant", "restaurants", "food", "eat", "dining", "cuisine", "brunch", "dinner"],
    "cafes": ["cafe", "coffee", "espresso", "latte"],
    "bars": ["bar", "bars", "pub", "cocktail", "happy hour", "brewery"],
    "museums": ["museum", "museums", "exhibit", "gallery", "art museum", "science museum"],
    "attractions": ["attraction", "landmark", "tourist spot", "sightseeing", "points of interest"],
    "beaches": ["beach", "beaches", "shore", "coast"],
    "hiking": ["hike", "hiking", "trailhead", "trail", "nature walk"],
    "shopping": ["mall", "shopping", "boutique", "store", "market"],
    "gyms": ["gym", "fitness", "workout", "yoga", "pilates"],
    "schools": ["school", "schools", "elementary", "middle school", "high school", "university", "college"],
    "safety": ["safe", "crime", "dangerous", "safety"],
    "affordability": ["affordable", "cheap", "expensive", "cost of living", "rent", "prices"],
    "housing": ["apartment", "housing", "real estate", "condo", "house"],
    "weather": ["weather", "rain", "temperature", "climate"],
    "events": ["event", "events", "festival", "concert"],
    "transportation": ["transport", "transportation", "bus", "subway", "metro", "train", "station", "tram"],
    "traffic_parking": ["traffic", "parking", "congestion"],
    "healthcare": ["hospital", "clinic", "urgent care", "doctor", "healthcare", "pharmacy"],
    "pets": ["pet", "dog", "cat", "veterinary", "dog park", "pet store"],
    "nightlife": ["nightlife", "club", "late night", "dance"],
    "family_kids": ["family", "kid", "kids", "playground", "children"],
    "accessibility": ["accessible", "wheelchair", "ada"],
    "internet": ["internet", "wifi", "cell", "5g", "coverage"],
    "cleanliness": ["clean", "cleanliness", "dirty", "trash", "litter"],
    "noise": ["noise", "quiet", "loud"],
    "community": ["community", "neighbors", "friendly", "vibe"],
    "sports": ["stadium", "arena", "sports", "game", "field", "court"],
    "libraries": ["library", "libraries"],
    "markets": ["farmers market", "market", "street market"]
}

# Precompile regex for multi-word and single-word hits
TOPIC_PATTERNS: Dict[str, List[re.Pattern]] = {
    topic: [re.compile(rf"\b{re.escape(k)}\b", flags=re.IGNORECASE) for k in kws]
    for topic, kws in TOPIC_KEYWORDS.items()
}

def _keyword_score(question: str) -> List[Tuple[str, int]]:
    """Return [(topic, hits)] sorted by hits desc."""
    q = question.lower()
    scores = []
    for topic, patterns in TOPIC_PATTERNS.items():
        hits = sum(1 for p in patterns if p.search(q))
        if hits:
            scores.append((topic, hits))
    return sorted(scores, key=lambda x: x[1], reverse=True)

# ---------- 2) Heuristic classifier (fast, no API call) ----------
def classify_topic(question: str, min_hits: int = 1) -> Optional[str]:
    """Choose the best topic by keyword hits; None if no confident match."""
    scores = _keyword_score(question)
    if not scores:
        return None
    best, best_hits = scores[0]
    # If the top score is unique and >= min_hits, accept it.
    if best_hits >= min_hits and (len(scores) == 1 or best_hits > scores[1][1]):
        return best
    # Tie or weak evidence → return None to allow a fallback
    return None

# ---------- 3) Optional OpenAI fallback (when heuristic is unsure) ----------
# Requires: pip install openai and OPENAI_API_KEY set in env.

_client = OpenAI(api_key=OpenAI_KEY)

_ALLOWED = list(TOPIC_KEYWORDS.keys())

def llm_classify_topic(question: str) -> str:
    """Ask the model to pick a single topic from the allowed list (string match)."""
    system = (
        "You are a classifier. Return ONLY a JSON object with keys 'topic' and 'confidence'. "
        f"'topic' must be exactly one of: {', '.join(_ALLOWED)}. "
        "Use 'confidence' in [0,1]. If unsure, choose the closest topic."
    )
    user = f"Question: {question}\nReturn JSON only."
    resp = _client.responses.create(
        model="gpt-5",
        input=[{"role": "system", "content": system},
               {"role": "user", "content": user}]
    )
    text = resp.output_text.strip()
    # very small, safe parse (no external libs); fall back to string search if needed
    import json
    try:
        data = json.loads(text)
        topic = data.get("topic")
        if topic in TOPIC_KEYWORDS:
            return topic
    except Exception:
        pass
    # Fallback if JSON parse fails: pick highest keyword score or 'attractions'
    return classify_topic(question) or "attractions"

# ---------- 4) Public API ----------
def topic_for(question: str, use_llm_fallback: bool = True) -> str:
    """
    Returns a single topic string.
    - Tries keyword heuristic first.
    - If unsure and use_llm_fallback=True, asks OpenAI to choose.
    """
    t = classify_topic(question)
    if t is not None or not use_llm_fallback:
        return t or "attractions"  # a generic, safe default
    return llm_classify_topic(question)

def group_questions(questions: List[str], use_llm_fallback: bool = True) -> Dict[str, List[str]]:
    """Group a list of questions into a hashmap: {topic: [questions...]}"""
    buckets: Dict[str, List[str]] = defaultdict(list)
    for q in questions:
        t = topic_for(q, use_llm_fallback=use_llm_fallback)
        buckets[t].append(q)
    return dict(buckets)

# ---------- 5) Demo ----------

if __name__ == "__main__":
    sample = [
        "beautiful parks near me",
        "best coffee shops around here",
        "Is this a safe neighborhood?",
        "cheap apartments nearby",
        "family-friendly things to do",
        "How bad is traffic downtown?",
        "good museums for a rainy day",
        "Where can I hike with my dog?",
        "late-night bars with live music",
        "Which hospitals are closest?",
    ]
    buckets = group_questions(sample, use_llm_fallback=False)  # fast pass only
    for topic, qs in buckets.items():
        print(f"\n[{topic}]")
        for q in qs:
            print(" -", q)