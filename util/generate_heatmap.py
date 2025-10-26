from feature_extractors import *
import numpy as np
import pandas as pd
import sys
import os
sys.path.append(os.path.join(os.getcwd(), '..', 'creds'))
import creds

from pymilvus import MilvusClient


def softmax(x, temperature=1.0):
    x = np.array(x, dtype=float)
    x = x / temperature               # apply temperature
    e = np.exp(x - np.max(x))         # stability trick
    return e / np.sum(e)

def retrieve_embeddings():
    encoder = FeatureExtractorFactory.create_extractor(model_name="google/siglip2-base-patch16-224", device="cpu")
    prompt = ["School"]
    encoded_prompt = encoder.extract_text_features(prompt)
    encoded_prompt = encoded_prompt.squeeze(0).cpu().numpy()    


    client = MilvusClient(
        uri=creds.ZILLIZ_URI,
        token=creds.ZILLIZ_TOKEN
    )

    res = client.search(
        collection_name=creds.ZILLIZ_COLLECTION,
        data=[encoded_prompt],
        filter="",
        output_fields=["id", "embedding"],
        limit=10,
        offset=0
    )
    
    lats, longs, distances = [], [], []
    for result in res[0]:
        lat, long = result['id'].split('_')
        

     
    return res

def generate_heatmap():
    print(encoded_prompt.size())
    dataset_embeddings = retrieve_embeddings()

    lats, longs, embeds = [], [], []

    for file in dataset_embeddings:
        lat, long = file.split('_')
        lat = float(lat)
        long = float(long)

        lats.append(lat)
        longs.append(long)
        embeds.append(dataset_embeddings[file])

    df = pd.DataFrame(data = {
        'lats' : lats,
        'longs' : longs,
        'embeds' : embeds
    })

    embed_matrix = np.array(df["embeds"].tolist(), dtype=float)
    encoded_prompt = encoded_prompt.squeeze(0).cpu().numpy()           # shape (768,)
    normal_end_prompt = encoded_prompt / np.linalg.norm(encoded_prompt)
    similarity_score = embed_matrix @ normal_end_prompt
    print(similarity_score)

    df["similarity"] = similarity_score
    df_out = pd.DataFrame({
        "lat": df["lats"],
        "long": df["longs"],
        "weight": softmax(similarity_score, 0.1)
    })

    json_str = df_out.to_json(orient="records")
    with open("similarities.json", "w") as f:
        f.write(json_str)

def main():
    embeddings = retrieve_embeddings()
    import code; code.interact(local=dict(globals(), **locals()))


if __name__ == "__main__": 
    main()
