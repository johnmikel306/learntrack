import json
import sys
from typing import Any
import requests

BASE = "http://127.0.0.1:8000"
API_BASE = "http://127.0.0.1:8000/api/v1"
TIMEOUT = 10


def check(method: str, path: str, use_api_base: bool = True, **kwargs) -> tuple[int, Any]:
    base_url = API_BASE if use_api_base else BASE
    url = f"{base_url}{path}"
    try:
        resp = requests.request(method, url, timeout=TIMEOUT, **kwargs)
        ct = resp.headers.get("content-type", "")
        data = resp.json() if "json" in ct else resp.text
        print(f"{method} {path} -> {resp.status_code}")
        if isinstance(data, dict):
            print(json.dumps({k: data.get(k) for k in list(data)[:5]}, indent=2))
        else:
            print(str(data)[:200])
        return resp.status_code, data
    except Exception as e:
        print(f"ERROR {method} {path}: {e}")
        return 0, None


def main():
    ok = True

    # Health
    code, _ = check("GET", "/health", use_api_base=False)
    ok &= code == 200

    # Students list
    code, students = check("GET", "/students/")
    ok &= code == 200

    # Create a student (minimal fields)
    payload = {"name": "Dev Student", "email": "dev.student@example.com"}
    code, created = check("POST", "/students/", json=payload)
    ok &= code in (200, 201)

    sid = created.get("id") if isinstance(created, dict) else None

    # Get student by id
    if sid:
        code, _ = check("GET", f"/students/{sid}")
        ok &= code == 200

        # Update
        code, _ = check("PUT", f"/students/{sid}", json={"phone": "+1-555-0000"})
        ok &= code == 200

        # Delete
        code, _ = check("DELETE", f"/students/{sid}")
        ok &= code in (200, 204)

    # Files list
    check("GET", "/files/")

    # Assignments list
    check("GET", "/assignments/")

    # Subjects list
    check("GET", "/subjects/")

    # Questions list
    check("GET", "/questions/")

    print("\nRESULT:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

