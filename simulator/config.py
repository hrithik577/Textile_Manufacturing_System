"""Configuration for the Everest Textile OS Virtual Factory Simulator.

Defines configurable production stages, standard operating rates,
shift configurations, and simulation clock parameters.
"""

from typing import Dict, List
from pydantic import BaseModel, Field


class StageConfig(BaseModel):
    """Configuration for a single production stage in the textile mill."""
    stage_id: str
    name: str
    description: str
    default_unit: str
    is_active: bool = True
    typical_duration_hours_per_1000m: float = 2.0


class FactoryConfig(BaseModel):
    """Factory-wide operating parameters and configurable workflow."""
    mill_name: str = "Everest Textile Mills - Unit 1"
    simulation_tick_minutes: int = 15
    data_source_label: str = "simulator"
    
    # Configurable production stages
    active_stages: List[str] = Field(
        default_factory=lambda: [
            "raw_material_prep",
            "weaving",
            "dyeing_finishing",
            "inspection",
            "roll_creation",
        ]
    )
    
    stage_definitions: Dict[str, StageConfig] = Field(
        default_factory=lambda: {
            "raw_material_prep": StageConfig(
                stage_id="raw_material_prep",
                name="Raw Material Preparation & Yarn Sizing",
                description="Yarn warping, sizing, and preparation for weaving/knitting",
                default_unit="kg",
                typical_duration_hours_per_1000m=1.0,
            ),
            "spinning": StageConfig(
                stage_id="spinning",
                name="Ring Spinning",
                description="Converting raw fiber into yarn cones",
                default_unit="kg",
                typical_duration_hours_per_1000m=3.0,
            ),
            "weaving": StageConfig(
                stage_id="weaving",
                name="Air-Jet / Rapier Weaving",
                description="Interlacing warp and weft yarns to produce greige fabric",
                default_unit="meters",
                typical_duration_hours_per_1000m=2.5,
            ),
            "knitting": StageConfig(
                stage_id="knitting",
                name="Circular Knitting",
                description="Knitted fabric production",
                default_unit="meters",
                typical_duration_hours_per_1000m=2.0,
            ),
            "dyeing_finishing": StageConfig(
                stage_id="dyeing_finishing",
                name="Dyeing, Stentering & Chemical Finishing",
                description="Coloration, heat-setting, and functional chemical finishes",
                default_unit="meters",
                typical_duration_hours_per_1000m=3.0,
            ),
            "inspection": StageConfig(
                stage_id="inspection",
                name="Fabric 4-Point Defect Inspection",
                description="Automated and visual grading of fabric rolls",
                default_unit="meters",
                typical_duration_hours_per_1000m=0.8,
            ),
            "roll_creation": StageConfig(
                stage_id="roll_creation",
                name="Packaging & Roll Batching",
                description="Winding, labelling, and palletizing finished rolls",
                default_unit="rolls",
                typical_duration_hours_per_1000m=0.5,
            ),
        }
    )

    # Standard roll length in meters
    standard_roll_meters: float = 100.0

    # Defect thresholds
    warning_defect_rate_percent: float = 3.5
    critical_defect_rate_percent: float = 6.0


DEFAULT_CONFIG = FactoryConfig()
