#!/usr/bin/env python3
"""
Fetch OpenRouter Models and Write to models.json
"""

import json
import requests
import sys
from pathlib import Path
from datetime import datetime

OPENROUTER_API = "https://openrouter.ai/api/v1/models"
MODELS_JSON_PATH = Path.home() / ".config" / "opencode" / "models.json"


def fetch_openrouter_models():
    """Fetch all models from OpenRouter API"""
    try:
        response = requests.get(OPENROUTER_API, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching models from OpenRouter: {e}")
        sys.exit(1)


def detect_reasoning_mode(model_data):
    supported = model_data.get("supported_parameters", [])
    return "reasoning" in supported


def detect_input_modalities(model_data):
    architecture = model_data.get("architecture", {})
    input_modalities = architecture.get("input_modalities", ["text"])
    opencode_supported = ["text", "image", "pdf"]
    supported = [m for m in input_modalities if m in opencode_supported]
    return supported if supported else ["text"]


def format_for_opencode(models_data):
    formatted_models = {}
    for model in models_data.get("data", []):
        model_id = model.get("id")
        if not model_id:
            continue
        name = model.get("name", model_id)
        reasoning = detect_reasoning_mode(model)
        input_modalities = detect_input_modalities(model)
        entry = {"name": name}
        if reasoning:
            entry["reasoning"] = True
        if input_modalities != ["text"]:
            entry["modalities"] = {"input": input_modalities, "output": ["text"]}
        formatted_models[model_id] = entry
    return formatted_models


def write_models_json(models):
    try:
        models_data = {
            "version": "1.0",
            "fetched_at": datetime.now().isoformat(),
            "count": len(models),
            "models": models
        }
        with open(MODELS_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(models_data, f, indent=2)
        return True
    except IOError as e:
        print(f"Error writing models.json: {e}")
        return False


def main():
    print(f"[INFO] Fetching models from OpenRouter API")
    print(f"   API: {OPENROUTER_API}")
    
    models_data = fetch_openrouter_models()
    total_count = len(models_data.get("data", []))
    print(f"[INFO] Fetched {total_count} models from OpenRouter")
    
    formatted = format_for_opencode(models_data)
    print(f"[INFO] Formatted {len(formatted)} models for OpenCode")
    
    if write_models_json(formatted):
        print(f"[OK] Wrote {len(formatted)} models to: {MODELS_JSON_PATH}")
        print(f"\n[OK] Fetch completed! Run /import-models to load into opencode.json")
        sys.exit(0)
    else:
        print(f"[ERROR] Failed to write models.json")
        sys.exit(1)


if __name__ == "__main__":
    main()