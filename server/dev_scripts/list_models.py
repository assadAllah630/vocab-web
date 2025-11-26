import google.generativeai as genai
import os

# You need to set your API key here or as an environment variable
api_key = input("Enter your Gemini API Key: ")

genai.configure(api_key=api_key)

print("Listing available models...\n")

for model in genai.list_models():
    if 'generateContent' in model.supported_generation_methods:
        print(f"Model: {model.name}")
        print(f"  Display Name: {model.display_name}")
        print(f"  Description: {model.description}")
        print(f"  Supported methods: {model.supported_generation_methods}")
        print()
