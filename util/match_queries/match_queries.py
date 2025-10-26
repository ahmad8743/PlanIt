# extract_filters.py
import json
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
from openai import OpenAI
from creds import OpenAI_KEY

# Initialize OpenAI client
client = OpenAI(api_key=OpenAI_KEY)

def extract_city_and_filters(prompt: str) -> dict:

    system_prompt = (
        "You are a helpful assistant that understands semantically rich filters from a user's geospatial"
        "search query. Only output JSON in this exact structure:\n\n"
        "{\n"
        "  \"filters\": {\n"
        "    \"category1\","
        "    \"category2\""
        "  }\n"
        "}\n\n"
        "Include filters even if the user does not give an exact distance. If a category is mentioned as being 'close', 'nearby', or 'within walking distance'. Use reasonable defaults if the user is vague."
        "Output semantically rich filters with descriptive keywords like 'residential suburban neighborhood' or 'public park greenspace' or '''school education communicty center'"
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