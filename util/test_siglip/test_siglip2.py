#test loading siglip2 model and do a forward pass

from feature_extractors import *

extractor = FeatureExtractorFactory.create_extractor(model_name="google/siglip2-base-patch16-512", device="cpu")
print(extractor)

text = "test text"
text_features = extractor.extract_text_features([text])
print(text_features)
