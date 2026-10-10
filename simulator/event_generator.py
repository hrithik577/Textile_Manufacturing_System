"""Deterministic event generation and deduplication for the Virtual Factory Simulator."""

from datetime import datetime
import hashlib
import json
from typing import Any, Dict, List, Optional, Set
from simulator.models import SimEvent


class EventGenerator:
    """Generates unique, deterministic, and replay-safe simulation events."""

    def __init__(self, prefix: str = "SIM-EVT"):
        self.prefix = prefix
        self._counter = 0
        self._emitted_events: List[SimEvent] = []
        self._seen_idempotency_keys: Set[str] = set()

    def generate_idempotency_key(
        self,
        event_type: str,
        machine_id: Optional[str],
        order_id: Optional[str],
        timestamp: datetime,
        details: Dict[str, Any],
    ) -> str:
        """Construct a stable fingerprint for an event to guarantee idempotency."""
        payload = {
            "type": event_type,
            "machine": machine_id,
            "order": order_id,
            "ts": timestamp.isoformat(),
            "details": details,
        }
        serialized = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]

    def create_event(
        self,
        event_type: str,
        timestamp: datetime,
        machine_id: Optional[str] = None,
        production_order_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        custom_idempotency_key: Optional[str] = None,
    ) -> Optional[SimEvent]:
        """Creates an event if not already emitted with the same idempotency key."""
        details_map = details or {}
        idempotency_key = custom_idempotency_key or self.generate_idempotency_key(
            event_type, machine_id, production_order_id, timestamp, details_map
        )

        if idempotency_key in self._seen_idempotency_keys:
            # Replay-safe: deduplicate silently
            return None

        self._counter += 1
        event_id = f"{self.prefix}-{self._counter:05d}"
        event = SimEvent(
            event_id=event_id,
            event_type=event_type,
            machine_id=machine_id,
            production_order_id=production_order_id,
            timestamp=timestamp,
            source="simulator",
            details=details_map,
            idempotency_key=idempotency_key,
        )

        self._seen_idempotency_keys.add(idempotency_key)
        self._emitted_events.append(event)
        return event

    def get_events(self) -> List[SimEvent]:
        """Return a copy of all emitted events in chronological order."""
        return list(self._emitted_events)

    def clear(self) -> None:
        """Reset the generator."""
        self._counter = 0
        self._emitted_events.clear()
        self._seen_idempotency_keys.clear()
