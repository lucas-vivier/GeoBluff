#!/usr/bin/env python3
"""
Script pour générer countries.json pour GeoBluff.
Combine REST Countries API et World Bank API.

Usage:
    python generate_countries.py

Crée countries.json avec ~195 pays contenant:
- name, capital, flag, population, area, gdp (+ autres catégories configurées)
"""

import json
import requests
import time
from pathlib import Path
from typing import Optional


def get_flag_emoji(iso2: str) -> str:
    """Convertit un code ISO2 en emoji drapeau."""
    if not iso2 or len(iso2) != 2:
        return "🏳️"
    return "".join(chr(0x1F1E6 + ord(c) - ord('A')) for c in iso2.upper())


def fetch_rest_countries() -> dict:
    """Récupère les données depuis REST Countries API."""
    print("📥 Récupération REST Countries API...")
    
    url = "https://restcountries.com/v3.1/all"
    params = {
        "fields": "name,cca2,cca3,translations,capital,region,area,population,latlng",
    }
    headers = {"User-Agent": "GeoBluff/1.0 (+https://restcountries.com)"}
    response = requests.get(url, params=params, headers=headers, timeout=60)
    if response.status_code == 400:
        response = requests.get(url, headers=headers, timeout=60)
    response.raise_for_status()
    data = response.json()
    
    countries = {}
    for country in data:
        iso3 = country.get("cca3")
        iso2 = country.get("cca2", "")
        if not iso3:
            continue
        
        # Nom français si disponible
        name_fr = country.get("translations", {}).get("fra", {}).get("common")
        name = name_fr or country.get("name", {}).get("common", "")
        name_en = country.get("name", {}).get("common", "")
        
        # Capitale
        capitals = country.get("capital", [])
        capital = capitals[0] if capitals else ""
        
        latlng = country.get("latlng") or []
        latitude = latlng[0] if len(latlng) > 0 else None
        longitude = latlng[1] if len(latlng) > 1 else None

        countries[iso3] = {
            "name": name,
            "name_en": name_en,
            "capital": capital,
            "flag": get_flag_emoji(iso2),
            "iso2": iso2,
            "iso3": iso3,
            "region": country.get("region", ""),
            "area": country.get("area"),
            "population": country.get("population"),
            "latitude": latitude,
            "longitude": longitude,
        }
    
    print(f"   ✓ {len(countries)} pays")
    return countries


def fetch_world_bank(indicator: str, name: str) -> dict:
    """Récupère un indicateur World Bank."""
    print(f"📥 Récupération {name} (World Bank)...")
    
    url = f"https://api.worldbank.org/v2/country/all/indicator/{indicator}"
    params = {"format": "json", "per_page": 1000, "mrnev": 1}
    
    result = {}
    page = 1
    
    while True:
        params["page"] = page
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if len(data) < 2 or not data[1]:
                break
            
            for item in data[1]:
                if item.get("value") is not None:
                    iso3 = item.get("countryiso3code")
                    if iso3 and iso3 not in result:
                        result[iso3] = item["value"]
            
            if page >= data[0].get("pages", 1):
                break
            page += 1
            time.sleep(0.1)
        except Exception as e:
            print(f"   ⚠ Erreur page {page}: {e}")
            break
    
    print(f"   ✓ {len(result)} valeurs")
    return result


# Capitales en français (principales traductions)
CAPITALES_FR = {
    "AFG": "Kaboul", "DEU": "Berlin", "SAU": "Riyad", "ARE": "Abou Dabi",
    "CHN": "Pékin", "JPN": "Tokyo", "KOR": "Séoul", "GBR": "Londres",
    "ESP": "Madrid", "ITA": "Rome", "FRA": "Paris", "BEL": "Bruxelles",
    "NLD": "Amsterdam", "CHE": "Berne", "AUT": "Vienne", "POL": "Varsovie",
    "CZE": "Prague", "HUN": "Budapest", "ROU": "Bucarest", "GRC": "Athènes",
    "TUR": "Ankara", "RUS": "Moscou", "UKR": "Kiev", "EGY": "Le Caire",
    "MAR": "Rabat", "DZA": "Alger", "TUN": "Tunis", "LBY": "Tripoli",
    "IRN": "Téhéran", "IRQ": "Bagdad", "LBN": "Beyrouth", "ISR": "Jérusalem",
    "IND": "New Delhi", "PAK": "Islamabad", "BGD": "Dacca", "NPL": "Katmandou",
    "VNM": "Hanoï", "THA": "Bangkok", "MYS": "Kuala Lumpur", "SGP": "Singapour",
    "IDN": "Jakarta", "PHL": "Manille", "TWN": "Taipei", "HKG": "Hong Kong",
    "AUS": "Canberra", "NZL": "Wellington", "USA": "Washington",
    "CAN": "Ottawa", "MEX": "Mexico", "BRA": "Brasilia", "ARG": "Buenos Aires",
    "CHL": "Santiago", "COL": "Bogota", "PER": "Lima", "VEN": "Caracas",
    "DNK": "Copenhague", "SWE": "Stockholm", "NOR": "Oslo", "FIN": "Helsinki",
    "PRT": "Lisbonne", "IRL": "Dublin", "ZAF": "Pretoria", "NGA": "Abuja",
    "KEN": "Nairobi", "ETH": "Addis-Abeba", "GHA": "Accra", "SEN": "Dakar",
    "CIV": "Yamoussoukro", "CMR": "Yaoundé", "AGO": "Luanda", "TZA": "Dodoma",
}

# Variantes acceptables des capitales (pour tolérance)
CAPITALE_VARIANTES = {
    "Pékin": ["Pekin", "Beijing"],
    "Séoul": ["Seoul"],
    "Le Caire": ["Cairo", "Caire"],
    "Athènes": ["Athenes", "Athens"],
    "Copenhague": ["Copenhagen", "Kobenhavn"],
    "Vienne": ["Vienna", "Wien"],
    "Varsovie": ["Warsaw", "Warszawa"],
    "Prague": ["Praha"],
    "Bucarest": ["Bucharest", "Bucuresti"],
    "Moscou": ["Moscow", "Moskva"],
    "Kiev": ["Kyiv"],
    "Téhéran": ["Tehran"],
    "Bagdad": ["Baghdad"],
    "Beyrouth": ["Beirut"],
    "Jérusalem": ["Jerusalem"],
    "Dacca": ["Dhaka"],
    "Katmandou": ["Kathmandu"],
    "Hanoï": ["Hanoi"],
    "Mexico": ["Mexico City", "Ciudad de Mexico"],
    "Brasilia": ["Brasília"],
    "Lisbonne": ["Lisbon", "Lisboa"],
    "Alger": ["Algiers"],
    "Addis-Abeba": ["Addis Ababa"],
}

DEFAULT_CATEGORIES = [
    {
        "id": "population",
        "label": "Population",
        "source": "rest",
        "field": "population",
    },
    {
        "id": "area",
        "label": "Superficie (km²)",
        "source": "rest",
        "field": "area",
    },
    {
        "id": "gdp",
        "label": "PIB ($)",
        "source": "wb",
        "indicator": "NY.GDP.MKTP.CD",
    },
]


def load_categories_config(config_path: Path) -> dict:
    if not config_path.exists():
        return {
            "enabled_categories": [c["id"] for c in DEFAULT_CATEGORIES],
            "categories": DEFAULT_CATEGORIES,
        }

    with open(config_path, encoding="utf-8") as f:
        return json.load(f)


def generate_countries_json(output: str = "countries.json"):
    """Génère le fichier countries.json."""
    print("🌍 Génération de countries.json pour GeoBluff\n")
    min_coverage = 150
    
    config_path = Path(__file__).parent / "categories_config.json"
    config = load_categories_config(config_path)
    categories = config.get("categories", DEFAULT_CATEGORIES)
    enabled = config.get("enabled_categories") or [c["id"] for c in categories]
    enabled_set = set(enabled)
    category_map = {c["id"]: c for c in categories if c["id"] in enabled_set}

    # 1. Données de base
    countries = fetch_rest_countries()
    
    # 2. Indicateurs World Bank
    wb_data = {}
    disabled = []
    for cat_id, cat in category_map.items():
        if cat.get("source") == "wb":
            indicator = cat.get("indicator")
            if indicator:
                wb_data[cat_id] = fetch_world_bank(indicator, cat.get("label", cat_id))
                if len(wb_data[cat_id]) == 0:
                    disabled.append(cat_id)
        elif cat.get("source") == "rest":
            field = cat.get("field")
            if field and not any(c.get(field) is not None for c in countries.values()):
                disabled.append(cat_id)

    if disabled:
        for cat_id in disabled:
            enabled_set.discard(cat_id)
            category_map.pop(cat_id, None)
            wb_data.pop(cat_id, None)
        print("   ⚠ Catégories ignorées (pas de données): " + ", ".join(disabled))
    
    # 3. Fusionner
    print("\n🔄 Fusion des données...")
    
    for iso3, c in countries.items():
        # Categories depuis World Bank
        for cat_id, values in wb_data.items():
            if iso3 in values:
                value = values[iso3]
                if cat_id == "gdp":
                    value = int(value)
                else:
                    value = float(value)
                c[cat_id] = value
        
        # Capitale en français
        if iso3 in CAPITALES_FR:
            c["capital_en"] = c["capital"]
            c["capital"] = CAPITALES_FR[iso3]
        else:
            c["capital_en"] = c["capital"]
        
        # Variantes de capitale
        cap = c["capital"]
        variantes = [cap, c["capital_en"]]
        if cap in CAPITALE_VARIANTES:
            variantes.extend(CAPITALE_VARIANTES[cap])
        c["capital_variants"] = list(set(v for v in variantes if v))
        
        # Categories depuis REST
        for cat_id, cat in category_map.items():
            if cat.get("source") == "rest":
                field = cat.get("field")
                if field and cat_id not in c:
                    c[cat_id] = c.get(field)
    
    # 4. Appliquer la tolérance de couverture par catégorie
    coverage = {
        cat_id: sum(1 for c in countries.values() if c.get(cat_id) is not None)
        for cat_id in enabled_set
    }
    low_coverage = [cat_id for cat_id, count in coverage.items() if count < min_coverage]
    if low_coverage:
        for cat_id in low_coverage:
            enabled_set.discard(cat_id)
            category_map.pop(cat_id, None)
            wb_data.pop(cat_id, None)
        print(
            f"   ⚠ Catégories ignorées (< {min_coverage} pays): "
            + ", ".join(low_coverage)
        )

    # 5. Filtrer pays valides
    valid = [
        c for c in countries.values()
        if c.get("name") and all(c.get(cat_id) is not None for cat_id in enabled_set)
    ]
    valid.sort(key=lambda x: x["name"])
    
    # 5. Sauvegarder
    print(f"\n💾 Sauvegarde de {len(valid)} pays...")
    with open(output, "w", encoding="utf-8") as f:
        json.dump(valid, f, ensure_ascii=False, indent=2)
    
    # Stats
    with_gdp = sum(1 for c in valid if c.get("gdp") is not None)
    print(f"\n✅ {output} créé!")
    print(f"   - {len(valid)} pays")
    if "gdp" in enabled_set:
        print(f"   - {with_gdp} avec PIB")
    
    return valid


def show_categories():
    """Affiche les catégories disponibles pour le jeu."""
    config_path = Path(__file__).parent / "categories_config.json"
    config = load_categories_config(config_path)
    categories = config.get("categories", DEFAULT_CATEGORIES)
    enabled = config.get("enabled_categories") or [c["id"] for c in categories]
    category_map = {c["id"]: c for c in categories if c["id"] in enabled}
    print("\n📊 Catégories disponibles pour GeoBluff:")
    for cat_id in enabled:
        label = category_map.get(cat_id, {}).get("label", cat_id)
        print(f"   - {cat_id} : {label}")


if __name__ == "__main__":
    countries = generate_countries_json()
    
    # Aperçu
    print("\n📋 Exemple (France):")
    france = next((c for c in countries if c["iso3"] == "FRA"), None)
    if france:
        print(json.dumps(france, ensure_ascii=False, indent=2))
    
    show_categories()
