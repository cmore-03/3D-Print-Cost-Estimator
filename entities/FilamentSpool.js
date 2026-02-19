{
  "name": "FilamentSpool",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Custom name for the spool (e.g., 'Blue PLA - Hatchbox')"
    },
    "brand": {
      "type": "string",
      "description": "Filament brand name"
    },
    "material": {
      "type": "string",
      "enum": [
        "PLA",
        "ABS",
        "PETG",
        "TPU",
        "Nylon",
        "ASA",
        "PC",
        "PVA",
        "HIPS",
        "Wood",
        "Carbon Fiber",
        "Other"
      ],
      "description": "Filament material type"
    },
    "color": {
      "type": "string",
      "description": "Filament color"
    },
    "color_hex": {
      "type": "string",
      "description": "Hex color code for visual representation"
    },
    "total_weight_g": {
      "type": "number",
      "description": "Total spool weight in grams (e.g., 1000 for 1kg spool)"
    },
    "remaining_weight_g": {
      "type": "number",
      "description": "Remaining filament weight in grams"
    },
    "cost_per_spool": {
      "type": "number",
      "description": "Total cost paid for the spool"
    },
    "currency": {
      "type": "string",
      "enum": [
        "USD",
        "EUR",
        "GBP",
        "CAD",
        "AUD",
        "JPY",
        "CNY",
        "INR",
        "BRL",
        "Other"
      ],
      "default": "USD",
      "description": "Currency for cost"
    },
    "diameter_mm": {
      "type": "number",
      "enum": [
        1.75,
        2.85
      ],
      "default": 1.75,
      "description": "Filament diameter in mm"
    },
    "density_g_cm3": {
      "type": "number",
      "description": "Material density in g/cm\u00b3"
    },
    "print_temp_min": {
      "type": "number",
      "description": "Minimum recommended print temperature \u00b0C"
    },
    "print_temp_max": {
      "type": "number",
      "description": "Maximum recommended print temperature \u00b0C"
    },
    "bed_temp_min": {
      "type": "number",
      "description": "Minimum recommended bed temperature \u00b0C"
    },
    "bed_temp_max": {
      "type": "number",
      "description": "Maximum recommended bed temperature \u00b0C"
    },
    "status": {
      "type": "string",
      "enum": [
        "active",
        "low",
        "empty",
        "archived"
      ],
      "default": "active",
      "description": "Current spool status"
    },
    "notes": {
      "type": "string",
      "description": "Additional notes about the spool"
    },
    "purchase_date": {
      "type": "string",
      "format": "date",
      "description": "Date when the spool was purchased"
    },
    "purchase_url": {
      "type": "string",
      "description": "URL where the spool was purchased"
    }
  },
  "required": [
    "name",
    "material",
    "total_weight_g",
    "remaining_weight_g",
    "cost_per_spool"
  ]
}
