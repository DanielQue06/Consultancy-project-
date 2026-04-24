# config.py
import os

#Paths that connects everything togather ( where the data is stored, report output)
# It is done so that it points to the correct path no matter where it runs from
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_PATH = os.path.join(BASE_DIR, "shared", "borgwarner_threats.db")
REPORT_OUTPUT_DIR = os.path.join(BASE_DIR, "shared", "reports")

# NVD API KEY - For scraping data form a specific website.used by nvd_scraper to query the official NVD vulnerabilities API.
# with API its 6 seconds faster as it increases rate limits
NVD_API_KEY = "77b84be1-0303-4b94-b49f-ff4bb4d143b4"

# It is the jason file that pull all known exploited vulnerabilities from CISA
CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"


# Product keywords used by the NVD and forum scraper to find relevant results.
KEYWORDS_PRODUCTS = [
    # Generic ECU / microcontroller often mentioned in tuning/hacking posts
    "ecu", "engine control unit",
    "tricore", "aurix",
    "tc17", "tc18", "tc19",
    "mc9s12", "s32k", "pic16", "c2000",

    # Tuning / flashing context
    "boot mode", "bootloader",
    "immo", "immobiliser", "immobilizer",
    "eeprom",

    # CAN / diagnostics
    "can bus", "obd",

    # Dani’s examples and your chips
    "sevcon", "sevcon gen 4",
    "TC377", "SPC5777", "MPC5777",
]
# Technologies security concepts related to the car
KEYWORDS_TECHNOLOGIES = [
    "SHA-256", "RSA-2048", "AES-128",
    "Secure Hardware Extension",
    "Hardware Security Module", "HSM",
    "Battery Management System", "BMS",
    "integrated drive module", "IDM",
    "Fault Handling Specification",
    "SRS",
]
# Combined list that it is used in the scraper
PRODUCT_KEYWORDS = KEYWORDS_PRODUCTS + KEYWORDS_TECHNOLOGIES


# Terms used when searching the NVD API
NVD_SEARCH_KEYWORDS = [
    # Hardware security / crypto modules
    "hardware security module",
    "HSM",
    "YubiHSM",
    "secure boot bypass",
    "secure boot vulnerability",

    # Automotive stacks / protocols
    "AUTOSAR",
    "UDS diagnostic",
    "Unified Diagnostic Services",
    "OBD diagnostic",
    "OBD vulnerability",
    "CAN bus injection",
    "CAN bus attack",
    "eeprom",

    # Battery / EV context
    "battery management system",
    "BMS vulnerability",
    "electric vehicle ECU",
]
#  Reserved for cases where a generic term only makes sense in a specific pairing,
# or it will give too many results. (currently not in use in the simplified matching logic
PAIRED_KEYWORDS = {
    "SRS": "SRS",
    "Inverter": "Inverter",
    "HSM": "HSM",
    "IDM": "IDM",
    "#BMS": "BMS",
}

# severity classification
SEVERITY_MAP = {
    # Any components that affect safety or drive
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
        "SHA-256", "RSA-2048", "AES-128", "sevcon" , "sevcon gen 4", "eeprom"
    ],
    "high": [
        # important support components - one step below critical
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
        # Tools/specs around the seystem
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
        #  comfort/appearance systems
        "lighting", "interior", "infotainment", "display",
        "seat", "window", "mirror", "cosmetic", "trim",
    ],
}
# Report generation
# Weekly Report, for the date and time need.

REPORT_SCHEDULE_DAY = "wednesday"
REPORT_SCHEDULE_TIME = "11:10"

# Scrapping interval
# scrapes all source once the given time is up
SCRAPE_INTERVAL_HOURS = 24