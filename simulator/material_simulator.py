"""Inventory management and raw material consumption simulation."""

from datetime import datetime
from typing import Dict, List, Optional
from simulator.event_generator import EventGenerator
from simulator.models import MaterialBatch, MaterialInventory


class MaterialSimulator:
    """Manages raw material stock, batch arrivals, and non-negative consumption."""

    def __init__(self, event_generator: EventGenerator):
        self.inventory: Dict[str, MaterialInventory] = {}
        self.events = event_generator

    def register_material(self, item: MaterialInventory) -> None:
        self.inventory[item.material_id] = item

    def get_material(self, material_id: str) -> Optional[MaterialInventory]:
        return self.inventory.get(material_id)

    def reserve_stock(self, material_id: str, quantity: float, order_id: str, timestamp: datetime) -> bool:
        """Reserves available stock for an order if sufficient unreserved stock exists."""
        item = self.inventory.get(material_id)
        if not item:
            return False

        if item.available_stock < quantity:
            self.events.create_event(
                event_type="material_shortage",
                timestamp=timestamp,
                production_order_id=order_id,
                details={
                    "material_id": material_id,
                    "material_name": item.name,
                    "requested_quantity": quantity,
                    "available_stock": item.available_stock,
                    "shortage_quantity": quantity - item.available_stock,
                    "unit": item.unit,
                },
            )
            return False

        item.reserved_stock += quantity
        return True

    def consume_material(
        self,
        material_id: str,
        quantity: float,
        order_id: str,
        timestamp: datetime,
    ) -> float:
        """Consumes material. Guarantees that stock never drops below 0.0."""
        item = self.inventory.get(material_id)
        if not item or quantity <= 0.0:
            return 0.0

        # Can only consume up to what is available in total stock
        actual_consumed = min(item.total_stock, quantity)
        item.total_stock -= actual_consumed

        # Deduct from reserved stock if previously reserved
        if item.reserved_stock > 0:
            item.reserved_stock = max(0.0, item.reserved_stock - actual_consumed)

        if actual_consumed < quantity:
            # Emitted if attempted consumption exceeded available stock
            self.events.create_event(
                event_type="material_shortage",
                timestamp=timestamp,
                production_order_id=order_id,
                details={
                    "material_id": material_id,
                    "material_name": item.name,
                    "demanded_quantity": quantity,
                    "actual_consumed": actual_consumed,
                    "shortage": quantity - actual_consumed,
                    "unit": item.unit,
                },
            )

        return actual_consumed

    def process_incoming_deliveries(self, current_time: datetime) -> List[MaterialBatch]:
        """Checks for shipments arriving at or before the current timestamp."""
        arrived_batches: List[MaterialBatch] = []
        for item in self.inventory.values():
            for batch in item.incoming_batches:
                if batch.status == "in_transit" and batch.expected_arrival <= current_time:
                    batch.status = "arrived"
                    item.total_stock += batch.quantity
                    arrived_batches.append(batch)
                    self.events.create_event(
                        event_type="shipment_arrived",
                        timestamp=current_time,
                        details={
                            "batch_id": batch.batch_id,
                            "material_id": batch.material_id,
                            "quantity": batch.quantity,
                            "unit": item.unit,
                        },
                    )
        return arrived_batches
