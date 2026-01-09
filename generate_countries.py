#!/usr/bin/env python3
"""
Script pour générer countries.json pour GeoBluff.
Combine REST Countries API et World Bank API.

Usage:
    python generate_countries.py

Crée countries.json avec ~195 pays contenant:
- nom, capitale, drapeau, population, superficie, PIB
"""

import json
import requests
import time
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
        "fields": "name,cca2,cca3,translations,capital,region,area,population",
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
        
        countries[iso3] = {
            "nom": name,
            "nom_en": name_en,
            "capitale": capital,
            "drapeau": get_flag_emoji(iso2),
            "iso2": iso2,
            "iso3": iso3,
            "region": country.get("region", ""),
            "superficie": country.get("area"),
            "population": country.get("population"),
            "pib": None,
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


def generate_countries_json(output: str = "countries.json"):
    """Génère le fichier countries.json."""
    print("🌍 Génération de countries.json pour GeoBluff\n")
    
    # 1. Données de base
    countries = fetch_rest_countries()
    
    # 2. Indicateurs World Bank
    population = fetch_world_bank("SP.POP.TOTL", "Population")
    gdp = fetch_world_bank("NY.GDP.MKTP.CD", "PIB")
    
    # 3. Fusionner
    print("\n🔄 Fusion des données...")
    
    for iso3, c in countries.items():
        # Population World Bank si disponible
        if iso3 in population:
            c["population"] = int(population[iso3])
        
        # PIB
        if iso3 in gdp:
            c["pib"] = int(gdp[iso3])
        
        # Capitale en français
        if iso3 in CAPITALES_FR:
            c["capitale_en"] = c["capitale"]
            c["capitale"] = CAPITALES_FR[iso3]
        else:
            c["capitale_en"] = c["capitale"]
        
        # Variantes de capitale
        cap = c["capitale"]
        variantes = [cap, c["capitale_en"]]
        if cap in CAPITALE_VARIANTES:
            variantes.extend(CAPITALE_VARIANTES[cap])
        c["capitale_variantes"] = list(set(v for v in variantes if v))
    
    # 4. Filtrer pays valides
    valid = [
        c for c in countries.values()
        if c["population"] and c["superficie"] and c["nom"]
    ]
    valid.sort(key=lambda x: x["nom"])
    
    # 5. Sauvegarder
    print(f"\n💾 Sauvegarde de {len(valid)} pays...")
    with open(output, "w", encoding="utf-8") as f:
        json.dump(valid, f, ensure_ascii=False, indent=2)
    
    # Stats
    with_gdp = sum(1 for c in valid if c["pib"])
    print(f"\n✅ {output} créé!")
    print(f"   - {len(valid)} pays")
    print(f"   - {with_gdp} avec PIB")
    
    return valid


def show_categories():
    """Affiche les catégories disponibles pour le jeu."""
    print("\n📊 Catégories disponibles pour GeoBluff:")
    print("   - population : Nombre d'habitants")
    print("   - superficie : Surface en km²")
    print("   - pib : Produit Intérieur Brut en $")


if __name__ == "__main__":
    countries = generate_countries_json()
    
    # Aperçu
    print("\n📋 Exemple (France):")
    france = next((c for c in countries if c["iso3"] == "FRA"), None)
    if france:
        print(json.dumps(france, ensure_ascii=False, indent=2))
    
    show_categories()
