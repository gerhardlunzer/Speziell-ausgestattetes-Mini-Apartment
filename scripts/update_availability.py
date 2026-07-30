#!/usr/bin/env python3

"""
Liest einen Airbnb-iCalendar-Export ein und erzeugt eine öffentliche
JSON-Datei mit ausschließlich belegten Datumsbereichen.

Es werden keine Namen, Beschreibungen oder sonstigen Buchungsdetails
in die JSON-Datei übernommen.
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DATE_PATTERN = re.compile(r"^(\d{8})(?:T\d{6}Z?)?$")


def unfold_ical_lines(text: str) -> list[str]:
    """
    Verbindet gefaltete iCalendar-Zeilen.

    Laut iCalendar-Format kann eine lange Zeile in der nächsten Zeile
    fortgesetzt werden. Die Folgezeile beginnt dann mit einem Leerzeichen
    oder Tabulator.
    """
    raw_lines = (
        text.replace("\r\n", "\n")
        .replace("\r", "\n")
        .split("\n")
    )

    lines: list[str] = []

    for line in raw_lines:
        if line.startswith((" ", "\t")) and lines:
            lines[-1] += line[1:]
        else:
            lines.append(line)

    return lines


def extract_property_value(line: str) -> str | None:
    """Liest den Wert rechts vom ersten Doppelpunkt."""
    if ":" not in line:
        return None

    return line.split(":", 1)[1].strip()


def parse_ical_date(line: str) -> str | None:
    """
    Liest aus DTSTART oder DTEND ein Datum und gibt YYYY-MM-DD zurück.

    Unterstützte Beispiele:
    DTSTART;VALUE=DATE:20260805
    DTSTART:20260805T150000Z
    """
    value = extract_property_value(line)

    if not value:
        return None

    match = DATE_PATTERN.match(value)

    if not match:
        return None

    parsed = datetime.strptime(match.group(1), "%Y%m%d")
    return parsed.strftime("%Y-%m-%d")


def parse_event(lines: list[str]) -> dict[str, str] | None:
    """Extrahiert aus einem VEVENT nur Beginn und exklusives Ende."""
    start: str | None = None
    end_exclusive: str | None = None
    cancelled = False

    for line in lines:
        upper_line = line.upper()

        if upper_line.startswith("STATUS:"):
            status = extract_property_value(upper_line)
            cancelled = status == "CANCELLED"

        elif upper_line.startswith("DTSTART"):
            start = parse_ical_date(line)

        elif upper_line.startswith("DTEND"):
            end_exclusive = parse_ical_date(line)

    if cancelled or not start or not end_exclusive:
        return None

    if end_exclusive <= start:
        print(
            f"Warnung: Ungültiger Zeitraum übersprungen: "
            f"{start} bis {end_exclusive}",
            file=sys.stderr,
        )
        return None

    return {
        "start": start,
        "endExclusive": end_exclusive,
    }


def extract_booked_ranges(ical_text: str) -> list[dict[str, str]]:
    """Liest alle gültigen, nicht stornierten Ereignisse aus dem Kalender."""
    lines = unfold_ical_lines(ical_text)

    booked: list[dict[str, str]] = []
    current_event: list[str] = []
    inside_event = False

    for line in lines:
        stripped = line.strip()

        if stripped == "BEGIN:VEVENT":
            inside_event = True
            current_event = []
            continue

        if stripped == "END:VEVENT" and inside_event:
            event = parse_event(current_event)

            if event:
                booked.append(event)

            inside_event = False
            current_event = []
            continue

        if inside_event:
            current_event.append(line)

    booked.sort(
        key=lambda event: (
            event["start"],
            event["endExclusive"],
        )
    )

    return remove_duplicates(booked)


def remove_duplicates(
    ranges: list[dict[str, str]],
) -> list[dict[str, str]]:
    """Entfernt exakt doppelte Zeiträume."""
    unique: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()

    for item in ranges:
        key = (item["start"], item["endExclusive"])

        if key not in seen:
            seen.add(key)
            unique.append(item)

    return unique


def validate_calendar(text: str) -> None:
    """Prüft, ob die Eingabe grundsätzlich wie ein Kalender aussieht."""
    if "BEGIN:VCALENDAR" not in text:
        raise ValueError(
            "Die Eingabedatei enthält keinen gültigen iCalendar."
        )

    if "END:VCALENDAR" not in text:
        raise ValueError(
            "Der iCalendar ist unvollständig."
        )


def build_output(
    booked_ranges: list[dict[str, str]],
) -> dict[str, Any]:
    """Erstellt die öffentliche, datensparsame JSON-Struktur."""
    updated_at = (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )

    return {
        "updatedAt": updated_at,
        "booked": booked_ranges,
    }


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(
            "Verwendung:\n"
            "python scripts/update_availability.py "
            "<kalender.ics> <availability.json>"
        )

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    if not input_path.is_file():
        raise SystemExit(
            f"Die Eingabedatei wurde nicht gefunden: {input_path}"
        )

    try:
        ical_text = input_path.read_text(encoding="utf-8-sig")
        validate_calendar(ical_text)

        booked_ranges = extract_booked_ranges(ical_text)
        output = build_output(booked_ranges)

        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(
                output,
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )

    except (OSError, UnicodeError, ValueError) as error:
        raise SystemExit(f"Fehler: {error}") from error

    print(
        f"{len(booked_ranges)} belegte Zeiträume wurden in "
        f"{output_path} gespeichert."
    )


if __name__ == "__main__":
    main()