from openai import OpenAI
from apikeys import OpenAI_KEY

client = OpenAI(OpenAI_KEY)

response = client.responses.create(
    model="gpt-5",
    input="Write a one-sentence bedtime story about a unicorn."
)

print(response.output_text)

# def get_question_type(prompt):
#     client = OpenAI(api_key=OpenAI_KEY)
#     base_prompt = (
#         "You are a helpful assistant that classifies natural-language questions "
#         "as either 'yes/no' questions or 'scale' questions. A 'scale' question is one "
#         "that can be answered using a rating, such as 'How clean is this area?' "
#         "Only answer with 'yes/no' or 'scale'. Reject any other answers."
#     )
#     prompt = base_prompt + "\n\n" + prompt + "\n\n" + "Classify the question as either 'yes/no' or 'scale'."
#     response = client.responses.create(
#         model="gpt-4.1-nano",
#         input=prompt
#     )
#     return response.output_text