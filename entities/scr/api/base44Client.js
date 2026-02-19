{
  "name": "PrintProject",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Name of the print project"
    },
    "spool_id": {
      "type": "string",
      "description": "ID of the filament spool used"
    },
    "printer_id": {
      "type": "string",
      "description": "ID of the printer used"
    },
    "spool_name": {
      "type": "string",
      "description": "Name of the spool used (denormalized for display)"
    },
    "material": {
      "type": "string",
      "description": "Filament material used"
    },
    "filament_used_g": {
      "type": "number",
      "description": "Amount of filament used in grams"
    },
    "filament_cost": {
      "type": "number",
      "description": "Cost of filament used"
    },
    "print_time_minutes": {
      "type": "number",
      "description": "Estimated or actual print time in minutes"
    },
    "layer_height_mm": {
      "type": "number",
      "description": "Layer height in mm"
    },
    "infill_percent": {
      "type": "number",
      "description": "Infill density percentage"
    },
    "print_speed_mm_s": {
      "type": "number",
      "description": "Print speed in mm/s"
    },
    "nozzle_temp": {
      "type": "number",
      "description": "Nozzle temperature \u00b0C"
    },
    "bed_temp": {
      "type": "number",
      "description": "Bed temperature \u00b0C"
    },
    "supports": {
      "type": "boolean",
 