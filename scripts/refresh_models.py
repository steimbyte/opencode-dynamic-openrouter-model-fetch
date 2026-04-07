#!/usr/bin/env python3
"""
Fetch OpenRouter models, write to models.json, and import into opencode.json
All in one operation
"""

import json
import requests
import sys
from pathlib import Path
from datetime import datetime

OPENROUTER_API = "https://openrouter.ai/api/v1/models"
OPENCODE_CONFIG_PATH = Path.home() / ".config" / "opencode" / "opencode.json"
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


def load_opencode_config():
    """Load current opencode.json configuration"""
    try:
        with open(OPENCODE_CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: opencode.json not found at {OPENCODE_CONFIG_PATH}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing opencode.json: {e}")
        sys.exit(1)
    except IOError as e:
        print(f"Error reading opencode.json: {e}")
        sys.exit(1)


def save_opencode_config(config):
    """Save opencode.json with proper formatting"""
    try:
        with open(OPENCODE_CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
        return True
    except IOError as e:
        print(f"Error writing opencode.json: {e}")
        return False


def main():
    print(f"[INFO] Fetching models from OpenRouter API")
    print(f"   API: {OPENROUTER_API}")
    
    # Fetch models
    models_data = fetch_openrouter_models()
    total_count = len(models_data.get("data", []))
    print(f"[INFO] Fetched {total_count} models from OpenRouter")
    
    # Format models
    formatted_models = format_for_opencode(models_data)
    print(f"[INFO] Formatted {len(formatted_models)} models for OpenCode")
    
    # Write to models.json
    if not write_models_json(formatted_models):
        print("[ERROR] Failed to write models.json")
        sys.exit(1)
    print(f"[OK] Wrote {len(formatted_models)} models to: {MODELS_JSON_PATH}")
    
    # Load opencode config
    config = load_opencode_config()
    
    # Update/ensure provider.openrouter.models exists
    if "provider" not in config:
        config["provider"] = {}
    if "openrouter" not in config["provider"]:
        config["provider"]["openrouter"] = {}
    if "models" not in config["provider"]["openrouter"]:
        config["provider"]["openrouter"]["models"] = {}
    
    # Merge: Add new models, keep existing ones that are not in the new list
    existing = config["provider"]["openrouter"]["models"]
    added = 0
    for model_id, model_data in formatted_models.items():
        if model_id not in existing:
            existing[model_id] = model_data
            added += 1
    
    print(f"[INFO] Added {added} new models to opencode.json")
    print(f"[INFO] Total models in opencode.json: {len(existing)}")
    
    # Save config
    if not save_opencode_config(config):
        print("[ERROR] Failed to save opencode.json")
        sys.exit(1)
    
    print(f"[OK] opencode.json updated successfully")
    print(f"\n[OK] Refresh completed! {added} models added.")
    print(f"   - models.json cached at: {MODELS_JSON_PATH}")
    print(f"   - opencode.json updated")
    
    sys.exit(0)


if __name__ == "__main__":
    main()