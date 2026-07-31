#!/usr/bin/env python3

"""
Liest mehrere iCalendar-Dateien ein und erzeugt eine öffentliche
JSON-Datei mit ausschließlich belegten Datumsbereichen.

Es werden keine Namen, Beschreibungen oder sonstigen Buchungsdetails
übernommen.
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
    """Verbindet gefaltete iCalendar-Zeilen."""
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
    Liest ein Datum aus DTSTART oder DTEND
    und gibt YYYY-MM-DD zurück.
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
    """Extrahiert Beginn und exklusives Ende eines VEVENT."""
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


def extract_booked_ranges(
    ical_text: str,
) -> list[dict[str, str]]:
    """Liest alle gültigen Ereignisse aus einem Kalender."""
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

    return booked


def validate_calendar(text: str, path: Path) -> None:
    """Prüft, ob die Eingabe wie ein iCalendar aussieht."""
    if "BEGIN:VCALENDAR" not in text:
        raise ValueError(
            f"{path} enthält keinen gültigen iCalendar."
        )

    if "END:VCALENDAR" not in text:
        raise ValueError(
            f"{path} enthält einen unvollständigen iCalendar."
        )


def merge_ranges(
    ranges: list[dict[str, str]],
) -> list[dict[str, str]]:
    """
    Sortiert und vereinigt doppelte, überlappende
    oder direkt aneinandergrenzende Zeiträume.
    """
    if not ranges:
        return []

    sorted_ranges = sorted(
        ranges,
        key=lambda item: (
            item["start"],
            item["endExclusive"],
        ),
    )

    merged: list[dict[str, str]] = [
        dict(sorted_ranges[0])
    ]

    for current in sorted_ranges[1:]:
        previous = merged[-1]

        if current["start"] <= previous["endExclusive"]:
            if (
                current["endExclusive"]
                > previous["endExclusive"]
            ):
                previous["endExclusive"] = (
                    current["endExclusive"]
                )
        else:
            merged.append(dict(current))

    return merged


def build_output(
    booked_ranges: list[dict[str, str]],
) -> dict[str, Any]:
    """Erstellt die öffentliche JSON-Struktur."""
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
    if len(sys.argv) < 3:
        raise SystemExit(
            "Verwendung:\n"
            "python scripts/update_availability.py "
            "<kalender1.ics> [kalender2.ics ...] "
            "<availability.json>"
        )

    input_paths = [
        Path(value)
        for value in sys.argv[1:-1]
    ]

    output_path = Path(sys.argv[-1])

    all_booked_ranges: list[dict[str, str]] = []

    try:
        for input_path in input_paths:
            if not input_path.is_file():
                raise FileNotFoundError(
                    f"Kalenderdatei nicht gefunden: "
                    f"{input_path}"
                )

            ical_text = input_path.read_text(
                encoding="utf-8-sig"
            )

            validate_calendar(
                ical_text,
                input_path,
            )

            ranges = extract_booked_ranges(
                ical_text
            )

            print(
                f"{input_path.name}: "
                f"{len(ranges)} Zeiträume erkannt."
            )

            all_booked_ranges.extend(ranges)

        merged_ranges = merge_ranges(
            all_booked_ranges
        )

        output = build_output(
            merged_ranges
        )

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        output_path.write_text(
            json.dumps(
                output,
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )

    except (
        OSError,
        UnicodeError,
        ValueError,
    ) as error:
        raise SystemExit(
            f"Fehler: {error}"
        ) from error

    print(
        f"Insgesamt wurden "
        f"{len(merged_ranges)} zusammengeführte "
        f"Belegungszeiträume in "
        f"{output_path} gespeichert."
    )


if __name__ == "__main__":
    main()