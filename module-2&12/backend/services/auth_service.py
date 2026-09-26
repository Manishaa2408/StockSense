from typing import Optional, Dict, Any, List
from fastapi import Header, HTTPException, status
from database.connection import fetch_all, fetch_one

ROLE_ADMIN = "ADMIN"
ROLE_INVENTORY_MANAGER = "INVENTORY_MANAGER"
ROLE_WAREHOUSE_STAFF = "WAREHOUSE_STAFF"

# Permissions matrix cache
ROLE_DEFAULT_WAREHOUSE = {
    ROLE_ADMIN: None, # Can see all
    ROLE_INVENTORY_MANAGER: None, # Can see all
    ROLE_WAREHOUSE_STAFF: 1 # Defaults to Dallas Central Hub (id=1)
}

def get_current_role(
    x_user_role: Optional[str] = Header(default="ADMIN", alias="X-User-Role")
) -> str:
    """Extracts and validates current role from request header."""
    role = (x_user_role or "ADMIN").upper()
    if role not in [ROLE_ADMIN, ROLE_INVENTORY_MANAGER, ROLE_WAREHOUSE_STAFF]:
        role = ROLE_ADMIN
    return role

def get_role_context(role: str) -> Dict[str, Any]:
    """Returns permission context and restrictions for the role."""
    row = fetch_one("SELECT id, name, description FROM roles WHERE name = ?", (role,))
    if not row:
        row = {"id": 1, "name": "ADMIN", "description": "Administrator"}
    
    role_id = row["id"]
    perms = fetch_all("""
        SELECT p.code 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
    """, (role_id,))
    
    permission_codes = [p["code"] for p in perms]
    
    return {
        "role": role,
        "role_id": role_id,
        "description": row["description"],
        "permissions": permission_codes,
        "can_view_valuation": role in [ROLE_ADMIN, ROLE_INVENTORY_MANAGER],
        "can_view_audit_logs": role == ROLE_ADMIN,
        "warehouse_restriction": ROLE_DEFAULT_WAREHOUSE.get(role)
    }

def verify_permission(role: str, permission_code: str) -> bool:
    context = get_role_context(role)
    return permission_code in context["permissions"]

def check_permission(role: str, permission_code: str):
    if not verify_permission(role, permission_code):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"FORBIDDEN: Role '{role}' does not possess required permission '{permission_code}'."
        )
