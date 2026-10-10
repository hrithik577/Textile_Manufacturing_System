from typing import Any, Optional, Dict
from fastapi import HTTPException, status


class TextileAppException(HTTPException):
    """Base application exception with error code and structured detail."""
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str = "ERROR",
        extra: Optional[Dict[str, Any]] = None,
    ):
        payload = {
            "error_code": error_code,
            "message": detail,
        }
        if extra:
            payload["extra"] = extra
        super().__init__(status_code=status_code, detail=payload)


class NotFoundException(TextileAppException):
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} with ID '{identifier}' was not found.",
            error_code="RESOURCE_NOT_FOUND",
            extra={"resource": resource, "id": str(identifier)},
        )


class ConflictException(TextileAppException):
    def __init__(self, detail: str, extra: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="RESOURCE_CONFLICT",
            extra=extra,
        )


class InsufficientStockException(TextileAppException):
    def __init__(self, material_name: str, requested: float, available: float, unit: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock for '{material_name}'. Requested: {requested} {unit}, Available: {available} {unit}.",
            error_code="INSUFFICIENT_STOCK",
            extra={
                "material": material_name,
                "requested": requested,
                "available": available,
                "unit": unit,
            },
        )


class IneligibleRollDispatchException(TextileAppException):
    def __init__(self, roll_code: str, current_status: str, reason: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Roll '{roll_code}' cannot be dispatched (Status: {current_status}). Reason: {reason}",
            error_code="INELIGIBLE_ROLL_DISPATCH",
            extra={
                "roll_code": roll_code,
                "current_status": current_status,
                "reason": reason,
            },
        )


class DuplicateDispatchException(TextileAppException):
    def __init__(self, roll_code: str, previous_shipment_id: Any):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Roll '{roll_code}' has already been dispatched in shipment #{previous_shipment_id}.",
            error_code="DUPLICATE_ROLL_DISPATCH",
            extra={
                "roll_code": roll_code,
                "previous_shipment_id": str(previous_shipment_id),
            },
        )


class UnauthorizedAccessException(TextileAppException):
    def __init__(self, detail: str = "Not authorized to access this resource."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="FORBIDDEN_ACCESS",
        )


class UnauthenticatedException(TextileAppException):
    def __init__(self, detail: str = "Authentication credentials were not provided or are invalid."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="UNAUTHENTICATED",
        )
