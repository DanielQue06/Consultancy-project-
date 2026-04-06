# ============================================================
# BorgWarner Cyber Dashboard - Configuration
# Updated to use NVD API + CISA KEV
# ============================================================

import os

# --- Paths ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, "shared", "borgwarner_threats.db")
REPORT_OUTPUT_DIR = os.path.join(BASE_DIR, "shared", "reports")

# --- NVD API ---
# Get a free API key here: https://nvd.nist.gov/developers/request-an-api-key
# Without a key: 6 second delay between requests
# With a key: 0.6 second delay (10x faster)
NVD_API_KEY = "77b84be1-0303-4b94-b49f-ff4bb4d143b4"

# --- CISA KEV ---
# Free JSON file of all confirmed exploited vulnerabilities
CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

# --- BorgWarner Product Keywords ---
KEYWORDS_PRODUCTS = [
    "YubiHSM", "TI C2000", "Infineon TriCore", "Atos CardOS",
    "Yubikey", "TLE9471", "Viper 2 XL", "VKMS", "VAG AR4",
    "HSM Vector", "vHSM", "Vector VAG AR4", "Viper 4 XL",
    "CycurHSM", "IMMO5", "TJA1145", "TC377", "PIC16F183",
    "Inverter", "MCU AXEV", "IDM146 AX",
    "SPC5777", "MPC5777", "Cobra 55", "NXP MC9S12",
    "Aurix TC387", "TJA1044", "MAX17841B", "MAX178",
    "S32K14", "SPC584B", "C3PS", "BQ7961",
    "P452", "P456", "SRS",
]

KEYWORDS_COMPANIES = [
    "BorgWarner", "Borgwarner",
    "Infineon", "Texas Instruments",
    "STMicroelectronics", "Hitex GmbH",
    "Yubico", "Atos",
    "NXP Semiconductors", "Vector Informatik",
]

KEYWORDS_TECHNOLOGIES = [
    "SHA-256", "RSA-2048", "AES-128",
    "Secure Hardware Extension",
    "Hardware Security Module", "HSM",
    "vector microsar",
    "Battery Management System", "BMS",
    "eMotor", "integrated drive module", "IDM",
    "Fault Handling Specification",
]

PRODUCT_KEYWORDS = KEYWORDS_PRODUCTS + KEYWORDS_COMPANIES + KEYWORDS_TECHNOLOGIES

# --- NVD Search Keywords ---
# These are the keywords we send to the NVD API
# Keep them specific enough to get relevant results
# Generic ones like "HSM" or "Inverter" are paired with company names
NVD_SEARCH_KEYWORDS = [
    # Companies — broad searches
    "BorgWarner",
    "Infineon",
    "NXP Semiconductors",
    "STMicroelectronics",
    "Texas Instruments",
    "Yubico",
    # Specific products — targeted searches
    "Infineon TriCore",
    "Aurix TC387",
    "TC377",
    "TJA1145",
    "TJA1044",
    "S32K14",
    "SPC5777",
    "MPC5777",
    "YubiHSM",
    "Yubikey",
    "CycurHSM",
    "TLE9471",
    "MAX17841B",
    "PIC16F183",
    "BQ7961",
    "NXP MC9S12",
    "vector microsar",
    "Atos CardOS",
]

# --- Special Search Pairs ---
PAIRED_KEYWORDS = {
    "SRS": "SRS BorgWarner",
    "Inverter": "Inverter BorgWarner",
    "HSM": "HSM BorgWarner",
    "IDM": "IDM BorgWarner",
    "BMS": "BMS BorgWarner",
}

# --- Severity Classification ---
SEVERITY_MAP = {
    "critical": [
        "inverter", "eMotor", "e-motor", "electric motor",
        "integrated drive module", "IDM", "IDM146",
        "MCU AXEV", "powertrain", "transmission",
        "battery management", "BMS", "BQ7961",
        "braking", "abs", "steering", "adas",
        "vehicle control", "can bus", "obd",
        "HSM", "Hardware Security Module", "vHSM", "CycurHSM",
        "YubiHSM", "HSM Vector", "IMMO5",
        "Secure Hardware Extension",
        "TC377", "Aurix TC387", "SPC5777", "MPC5777",
        "TI C2000", "Infineon TriCore",
        "S32K14", "SPC584B", "C3PS",
        "Cobra 55", "NXP MC9S12",
        "SHA-256", "RSA-2048", "AES-128",
    ],
    "high": [
        "TJA1145", "TJA1044",
        "MAX17841B", "MAX178",
        "TLE9471",
        "Yubikey", "Atos CardOS",
        "vector microsar",
        "VAG AR4", "Vector VAG AR4",
        "VKMS",
        "Viper 2 XL", "Viper 4 XL",
        "Infineon", "NXP Semiconductors",
        "STMicroelectronics", "Texas Instruments",
        "P452", "P456",
    ],
    "medium": [
        "PIC16F183",
        "Vector Informatik",
        "Hitex GmbH",
        "Atos",
        "Yubico",
        "Fault Handling Specification",
        "SRS",
        "sensor", "actuator",
    ],
    "low": [
        "lighting", "interior", "infotainment", "display",
        "seat", "window", "mirror", "cosmetic", "trim",
    ],
}

# --- Report Settings ---
REPORT_SCHEDULE_DAY = "monday"
REPORT_SCHEDULE_TIME = "15:40"

# --- Scraping Settings ---
SCRAPE_INTERVAL_HOURS = 24