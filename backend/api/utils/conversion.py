# utils/conversion.py

# Define conversion factors relative to a base unit for each category:
# For weight, the base is "kg"; for volume, the base is "l".
CONVERSION_FACTORS = {
    "Weight": {
         "kg": 1.0,
         "g": 1000.0,    # 1 kg = 1000 g
         "mg": 1000000.0,
    },
    "Volume": {
         "l": 1.0,
         "ml": 1000.0,   # 1 liter = 1000 ml
    }
}

def convert_value(value: float, from_unit: str, to_unit: str, category: str) -> float:
    """
    Convert a given value from one unit to another within the same category.
    
    - `from_unit` and `to_unit` are the unit names (e.g. "kg", "g", "l", "ml").
    - `category` is either "weight" or "volume".
    
    The conversion works by:
      1. Converting the original value to the base unit (kg or liter).
      2. Converting from the base unit to the target unit.
    """
    factors = CONVERSION_FACTORS.get(category)
    if factors is None:
        raise ValueError(f"Unsupported category: {category}")
    if from_unit not in factors or to_unit not in factors:
        raise ValueError("Conversion factors not found for provided units")
    
    # Convert to base unit
    value_in_base = value / factors[from_unit]
    # Then convert from base to target unit
    value_in_target = value_in_base * factors[to_unit]
    return value_in_target
