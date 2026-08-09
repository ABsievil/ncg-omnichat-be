#!/usr/bin/env python3
"""
Test Zalo admin APIs (JWT required — global JwtAuthGuard):
  - SSE QR login  GET  /api/v1/admin/zalo/login-qr
  - Get session   GET  /api/v1/admin/zalo/sessions
  - Send message  POST /api/v1/admin/zalo/send

Usage:
  pip install -r scripts/requirements-zalo.txt
  python scripts/zalo_login_qr.py --token <accessToken>
  python scripts/zalo_login_qr.py --token <accessToken> --login-only
  set ACCESS_TOKEN=<accessToken>   # PowerShell: $env:ACCESS_TOKEN="..."
  python scripts/zalo_login_qr.py
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import webbrowser
from pathlib import Path
from typing import Any, Iterator, Optional, Union
from urllib.parse import urlencode

try:
    import requests
except ImportError:
    print("Missing dependency: requests")
    print("  pip install -r scripts/requirements-zalo.txt")
    sys.exit(1)

try:
    from PIL import Image

    HAS_PIL = True
except ImportError:
    HAS_PIL = False


DEFAULT_BASE_URL = "http://localhost:8090"
DEFAULT_ACCOUNT_LABEL = "default"
API_PREFIX = "/api/v1/admin/zalo"
TMP_DIR = Path(__file__).resolve().parent / ".tmp"


def log(msg: str, *, level: str = "INFO") -> None:
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] [{level}] {msg}", flush=True)


def pretty(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)


def api_url(base_url: str, path: str) -> str:
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}"


def normalize_token(token: str) -> str:
    token = token.strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    return token


def auth_headers(token: str, extra: Optional[dict[str, str]] = None) -> dict[str, str]:
    headers = {
        "Authorization": f"Bearer {normalize_token(token)}",
        "Accept": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers


def resolve_token(cli_token: Optional[str]) -> str:
    token = (
        cli_token
        or os.environ.get("ACCESS_TOKEN")
        or os.environ.get("ZALO_JWT")
        or os.environ.get("JWT_TOKEN")
    )
    if not token:
        token = input("JWT accessToken (Bearer): ").strip()
    token = normalize_token(token or "")
    if not token:
        log("JWT token is required (header Authorization: Bearer <token>)", level="ERROR")
        raise SystemExit(2)
    return token


def save_and_show_qr(image_b64: str, *, open_viewer: bool = True) -> Path:
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    out = TMP_DIR / "zalo-login-qr.png"
    raw = base64.b64decode(image_b64)
    out.write_bytes(raw)
    log(f"QR saved: {out}")

    if HAS_PIL:
        try:
            print_ascii_qr(out)
        except Exception as exc:  # noqa: BLE001
            log(f"ASCII preview failed: {exc}", level="WARN")

    if open_viewer:
        try:
            if sys.platform == "win32":
                os.startfile(out)  # type: ignore[attr-defined]
            elif sys.platform == "darwin":
                os.system(f'open "{out}"')
            else:
                os.system(f'xdg-open "{out}"')
            log("Opened QR image in default viewer — scan with Zalo app")
        except Exception:
            # Fallback: open via browser (file://)
            webbrowser.open(out.as_uri())
            log("Opened QR image in browser — scan with Zalo app")

    return out


def print_ascii_qr(path: Path, max_width: int = 48) -> None:
    """Rough terminal preview of the PNG QR (scan the opened image for real login)."""
    img = Image.open(path).convert("L")
    w, h = img.size
    scale = max(1, w // max_width)
    img = img.resize((w // scale, h // scale))
    pixels = img.load()
    assert pixels is not None
    print("\n----- QR preview (terminal) -----")
    for y in range(img.height):
        row = []
        for x in range(img.width):
            row.append("██" if pixels[x, y] < 128 else "  ")
        print("".join(row))
    print("----- end preview -----\n", flush=True)


def iter_sse(response: requests.Response) -> Iterator[tuple[Optional[str], str]]:
    """Yield (event_name, data_str) from an SSE response body."""
    event_name: Optional[str] = None
    data_lines: list[str] = []

    for raw in response.iter_lines(decode_unicode=True):
        if raw is None:
            continue
        line = raw.rstrip("\r")
        if line == "":
            if data_lines:
                yield event_name, "\n".join(data_lines)
            event_name = None
            data_lines = []
            continue
        if line.startswith(":"):
            continue
        if line.startswith("event:"):
            event_name = line[6:].strip()
            continue
        if line.startswith("data:"):
            data_lines.append(line[5:].lstrip())
            continue

    if data_lines:
        yield event_name, "\n".join(data_lines)


def login_qr(
    base_url: str,
    *,
    token: str,
    account_label: str,
    proxy: Optional[str] = None,
    open_viewer: bool = True,
) -> bool:
    params: dict[str, str] = {"accountLabel": account_label}
    if proxy:
        params["proxy"] = proxy

    url = api_url(base_url, f"{API_PREFIX}/login-qr?{urlencode(params)}")
    log(f"Connecting SSE: {url}")

    success = False
    with requests.get(
        url,
        headers=auth_headers(
            token,
            {
                "Accept": "text/event-stream",
                "Cache-Control": "no-cache",
            },
        ),
        stream=True,
        timeout=(10, None),
    ) as resp:
        if resp.status_code != 200:
            log(f"HTTP {resp.status_code}: {resp.text}", level="ERROR")
            return False

        content_type = resp.headers.get("Content-Type", "")
        if "text/event-stream" not in content_type and "text/plain" not in content_type:
            log(f"Unexpected Content-Type: {content_type}", level="WARN")

        for event, data_str in iter_sse(resp):
            try:
                data = json.loads(data_str) if data_str else {}
            except json.JSONDecodeError:
                data = {"raw": data_str}

            name = event or "message"
            log(f"event={name}")

            if name == "qr":
                image = data.get("image")
                if not image:
                    log("QR event without image", level="WARN")
                    continue
                save_and_show_qr(image, open_viewer=open_viewer)
                log("Waiting for you to scan the QR with Zalo...")
            elif name == "scanned":
                log(
                    f"Scanned by: {data.get('displayName')} "
                    f"(avatar={bool(data.get('avatar'))})"
                )
                log("Confirm login on your phone...")
            elif name == "declined":
                log(f"Login declined: {pretty(data)}", level="ERROR")
            elif name == "expired":
                log(f"QR expired: {pretty(data)}", level="WARN")
            elif name == "got_login_info":
                log(f"Got login info: {pretty(data)}")
            elif name == "login_success":
                success = True
                log("LOGIN SUCCESS", level="OK")
                print(pretty(data))
            elif name == "error":
                log(f"Error: {pretty(data)}", level="ERROR")
            else:
                log(f"{name}: {pretty(data)}")

    return success


def get_session(
    base_url: str,
    *,
    token: str,
    account_label: str,
) -> Optional[dict[str, Any]]:
    url = api_url(base_url, f"{API_PREFIX}/sessions")
    log(f"GET {url}?accountLabel={account_label}")
    resp = requests.get(
        url,
        params={"accountLabel": account_label},
        headers=auth_headers(token),
        timeout=30,
    )
    print(f"HTTP {resp.status_code}")
    try:
        body = resp.json()
    except Exception:  # noqa: BLE001
        print(resp.text)
        return None
    print(pretty(body))
    return body if resp.ok else None


THREAD_TYPE_MAP = {"USER": 0, "GROUP": 1, "0": 0, "1": 1}


def send_message(
    base_url: str,
    *,
    token: str,
    thread_id: str,
    message: str,
    thread_type: Union[str, int] = "USER",
) -> Optional[dict[str, Any]]:
    url = api_url(base_url, f"{API_PREFIX}/send")
    if isinstance(thread_type, int):
        type_value = thread_type
    else:
        key = str(thread_type).strip().upper()
        if key not in THREAD_TYPE_MAP:
            log(f"Invalid thread type: {thread_type} (use USER/GROUP or 0/1)", level="ERROR")
            return None
        type_value = THREAD_TYPE_MAP[key]
    payload = {
        "threadId": thread_id,
        "message": message,
        "type": type_value,
    }
    log(f"POST {url}")
    print(pretty(payload))
    resp = requests.post(
        url,
        json=payload,
        headers=auth_headers(token),
        timeout=60,
    )
    print(f"HTTP {resp.status_code}")
    try:
        body = resp.json()
    except Exception:  # noqa: BLE001
        print(resp.text)
        return None
    print(pretty(body))
    return body if resp.ok else None


def interactive_menu(base_url: str, token: str, account_label: str) -> None:
    while True:
        print(
            "\n=== Zalo test menu ===\n"
            "1) Login QR (SSE)\n"
            "2) Get session\n"
            "3) Send message\n"
            "q) Quit\n"
        )
        choice = input("> ").strip().lower()
        if choice in {"q", "quit", "exit"}:
            break
        if choice == "1":
            proxy = input("proxy (optional, Enter to skip): ").strip() or None
            login_qr(
                base_url,
                token=token,
                account_label=account_label,
                proxy=proxy,
            )
        elif choice == "2":
            get_session(base_url, token=token, account_label=account_label)
        elif choice == "3":
            thread_id = input("threadId: ").strip()
            message = input("message: ").strip()
            thread_type = input("type [USER=0 / GROUP=1] (default USER): ").strip() or "USER"
            if not thread_id or not message:
                log("threadId and message are required", level="ERROR")
                continue
            send_message(
                base_url,
                token=token,
                thread_id=thread_id,
                message=message,
                thread_type=thread_type,
            )
        else:
            log("Unknown option", level="WARN")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Zalo QR login + API tester")
    p.add_argument(
        "--base-url",
        default=os.environ.get("ZALO_API_BASE_URL", DEFAULT_BASE_URL),
        help=f"API base URL (default: {DEFAULT_BASE_URL})",
    )
    p.add_argument(
        "--token",
        default=None,
        help="JWT accessToken (or env ACCESS_TOKEN / ZALO_JWT). Sent as Authorization: Bearer ...",
    )
    p.add_argument(
        "--account-label",
        default=os.environ.get("ZALO_ACCOUNT_LABEL", DEFAULT_ACCOUNT_LABEL),
        help=f"accountLabel query (default: {DEFAULT_ACCOUNT_LABEL})",
    )
    p.add_argument("--proxy", default=None, help="HTTP proxy for Zalo login")
    p.add_argument(
        "--no-open",
        action="store_true",
        help="Do not open the QR image in an external viewer",
    )
    p.add_argument(
        "--login-only",
        action="store_true",
        help="Only run QR login then exit",
    )
    p.add_argument(
        "--session-only",
        action="store_true",
        help="Only GET /sessions then exit",
    )
    p.add_argument(
        "--send",
        action="store_true",
        help="Send a message (requires --thread-id and --message)",
    )
    p.add_argument("--thread-id", default=None)
    p.add_argument("--message", default=None)
    p.add_argument(
        "--type",
        dest="thread_type",
        default="USER",
        choices=["USER", "GROUP"],
    )
    return p


def main() -> int:
    args = build_parser().parse_args()
    base_url = args.base_url
    account_label = args.account_label
    token = resolve_token(args.token)

    log(f"base_url={base_url} accountLabel={account_label} auth=Bearer")

    if args.session_only:
        ok = (
            get_session(base_url, token=token, account_label=account_label)
            is not None
        )
        return 0 if ok else 1

    if args.send:
        if not args.thread_id or not args.message:
            log("--send requires --thread-id and --message", level="ERROR")
            return 2
        ok = (
            send_message(
                base_url,
                token=token,
                thread_id=args.thread_id,
                message=args.message,
                thread_type=args.thread_type,
            )
            is not None
        )
        return 0 if ok else 1

    if args.login_only:
        ok = login_qr(
            base_url,
            token=token,
            account_label=account_label,
            proxy=args.proxy,
            open_viewer=not args.no_open,
        )
        return 0 if ok else 1

    # Default: login first, then interactive menu
    login_qr(
        base_url,
        token=token,
        account_label=account_label,
        proxy=args.proxy,
        open_viewer=not args.no_open,
    )
    interactive_menu(base_url, token, account_label)
    return 0


if __name__ == "__main__":
    # Allow custom log level label "OK"
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nInterrupted.")
        raise SystemExit(130)
