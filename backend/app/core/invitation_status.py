"""Patient invitation lifecycle statuses."""

PENDING = "pending"
ACCEPTED = "accepted"
EXPIRED = "expired"
CANCELLED = "cancelled"

ALL = frozenset({PENDING, ACCEPTED, EXPIRED, CANCELLED})
