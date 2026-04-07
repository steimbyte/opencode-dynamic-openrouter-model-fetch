#!/usr/bin/env python3
"""
Import Models from models.json into opencode.json
"""

import json
import sys
from pathlib import Path

OPENCODE_CONFIG_PATH = Path.home() / ".config" / "opencode" / "opencode.json"
MODELS_JSON_PATH = Path.home() / ".config" / "opencode" / "models.json"


def load_models_json():
    """Load models from models.json"""
    try:
        with open(MODELS_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("models", {})
    except FileNotFoundError:
        print(f"Error: models.json not found at {MODELS_JSON_PATH}")
        print("Please run /fetch-models first to download models.")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing models.json: {e}")
        sys.exit(1)
    except IOError as e:
        print(f"Error reading models.json: {e}")
        sys.exit(1)


def load_opencode_config():
    """Load current opencode.json configuration"""
    try:
        with open(OPENCODE_CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, IOError) as e:
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
    print(f"[INFO] Importing models from models.json")
    print(f"   Source: {MODELS_JSON_PATH}")
    print(f"   Target: {OPENCODE_CONFIG_PATH}")
    
    # Load models
    models = load_models_json()
    if not models:
        print("[ERROR] No models found in models.json")
        sys.exit(1)
    
    print(f"[INFO] Loaded {len(models)} models from models.json")
    
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
    for model_id, model_data in models.items():
        if model_id not in existing:
            existing[model_id] = model_data
            added += 1
    
    print(f"[INFO] Added {added} new models to opencode.json")
    print(f"[INFO] Total models in opencode.json: {len(existing)}")
    
    # Save config
    if save_opencode_config(config):
        print(f"[OK] opencode.json updated successfully")
        print(f"\n[OK] Import completed! {added} models added.")
        sys.exit(0)
    else:
        print(f"[ERROR] Failed to save opencode.json")
        sys.exit(1)


if __name__ == "__main__":
    main()