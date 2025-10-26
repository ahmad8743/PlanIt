# extract_filters.py
import json
from openai import OpenAI
from .apikeys import OpenAI_KEY

# Initialize OpenAI client
client = OpenAI(api_key=OpenAI_KEY)

def extract_city_and_filters(prompt: str) -> dict:
    """
    Extracts a JSON object with 'city' and 'filters' (amenities + distances)
    from a natural language query.
    
    Example prompt:
    "I want a house in Ferguson within 5 miles of a school and 3 miles of a park"
    Returns:
    {
        "city": "Ferguson",
        "filters": {
            "school": 5,
            "park": 3
        }
    }
    """
    system_prompt = (
        "You are a helpful assistant that extracts a city and amenities with distances "
        "from a user's request. Only output JSON in this exact structure:\n\n"
        "{\n"
        "  \"city\": \"CityName\",            // null if not mentioned\n"
        "  \"filters\": {\n"
        "    \"category1\": distance_in_miles,\n"
        "    \"category2\": distance_in_miles\n"
        "  }\n"
        "}\n\n"
        "Include filters even if the user does not give an exact distance. If a category is mentioned as being 'close', 'nearby', or 'within walking distance'. Use reasonable defaults if the user is vague."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )

        raw_content = response.choices[0].message.content.strip()

        # Parse JSON safely
        parsed = json.loads(raw_content)
        return parsed

    except Exception as e:
        print("❌ Error extracting filters:", e)
        return {"city": None, "filters": {}}


# -------------- ✅ Demo ---------------
if __name__ == "__main__":
    test_queries = [
       # "I want to live in Ferguson within 5 miles of a school and 3 miles of a park",
      #  "Show me apartments in Austin close to bars and restaurants within 2 miles",
       # "Looking for a home in Chicago near a gym (10 miles) and hospital (5 miles)",
        #"Safe neighborhood with good schools in Boston — schools within 7 miles",
        "I'm a single mom looking for a place in Clayton that is close to a school and a park with a grocery store"
    ]

    for query in test_queries:
        print(f"\n🟢 Query: {query}")
        result = extract_city_and_filters(query)
        print("🔎 Extracted:", json.dumps(result, indent=2))