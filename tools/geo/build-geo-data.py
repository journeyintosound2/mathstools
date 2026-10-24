#!/usr/bin/env python3
"""
Mills Maths Tools — build the school + suburb lookup files (2026-10-24).

Reads the raw downloads in tools/geo-source/ (never committed) and writes the
small JSON files the school picker and the admin map load:

    portal/shared/geo/schools-au.json   every school: id, name, suburb, state,
                                        postcode, sector, type, lat, lng
    portal/shared/geo/suburbs-au.json   every ABS suburb/locality: name, state, lat, lng

Standard library only (reads .xlsx itself), so it runs on any Mac with python3.

    python3 tools/geo/build-geo-data.py            # NSW public schools + ABS suburbs
    python3 tools/geo/build-geo-data.py --acara    # national ACARA list (all sectors)

Sources and licences
  * ACARA School Location / School Profile (all Australian schools, all sectors).
    Downloaded under the My School terms of use — only build with --acara once
    ACARA has given written permission to republish (copyright@acara.edu.au).
  * NSW DoE "Master dataset: NSW government school locations" — CC BY 4.0.
  * ABS ASGS Edition 3 (2021) Suburbs and Localities, centre points — CC BY 4.0.
Refresh once a year (new and renamed schools) by re-running the download command
in the project brief, then this script.
"""
import csv, glob, json, os, re, sys, zipfile, datetime
import xml.etree.ElementTree as ET

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "tools", "geo-source")
OUT = os.path.join(ROOT, "portal", "shared", "geo")
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
STATES = {"new south wales": "NSW", "victoria": "VIC", "queensland": "QLD", "south australia": "SA",
          "western australia": "WA", "tasmania": "TAS", "australian capital territory": "ACT",
          "northern territory": "NT", "nsw": "NSW", "vic": "VIC", "qld": "QLD", "sa": "SA", "wa": "WA",
          "tas": "TAS", "act": "ACT", "nt": "NT", "vic.": "VIC", "tas.": "TAS", "qld.": "QLD"}


def state_code(v):
    return STATES.get(str(v or "").strip().lower(), str(v or "").strip().upper())


# ---------------------------------------------------------------- xlsx reader
def col_index(ref):
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group(0):
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def xlsx_rows(path, sheet_hint=None):
    """Yield each row of the first (or best-named) sheet as a list of strings."""
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.parse(z.open("xl/sharedStrings.xml")).getroot().iter(NS + "si"):
            shared.append("".join(t.text or "" for t in si.iter(NS + "t")))
    wb = ET.parse(z.open("xl/workbook.xml")).getroot()
    rels = {r.get("Id"): r.get("Target") for r in ET.parse(z.open("xl/_rels/workbook.xml.rels")).getroot()}
    sheets = [(s.get("name"), rels[s.get(RNS + "id")]) for s in wb.iter(NS + "sheet")]
    name, target = sheets[0]
    if sheet_hint:
        for n, t in sheets:
            if sheet_hint.lower() in n.lower():
                name, target = n, t
                break
    target = target.lstrip("/")
    if not target.startswith("xl/"):
        target = "xl/" + target
    for _, row in ET.iterparse(z.open(target)):
        if row.tag != NS + "row":
            continue
        cells = {}
        for c in row.iter(NS + "c"):
            t = c.get("t")
            v = c.find(NS + "v")
            if t == "s" and v is not None:
                val = shared[int(v.text)]
            elif t == "inlineStr":
                val = "".join(x.text or "" for x in c.iter(NS + "t"))
            else:
                val = v.text if v is not None else ""
            cells[col_index(c.get("r"))] = val
        row.clear()
        if cells:
            yield [cells.get(i, "") for i in range(max(cells) + 1)]


def table(rows, must):
    """Find the header row (the first that contains every name in `must`), then dicts."""
    rows = iter(rows)
    for r in rows:
        low = [str(x).strip().lower() for x in r]
        if all(any(m in h for h in low) for m in must):
            header = low
            break
    else:
        raise SystemExit(f"Couldn't find a header row with {must}")
    for r in rows:
        if any(str(x).strip() for x in r):
            yield {header[i]: (r[i] if i < len(r) else "") for i in range(len(header))}


def pick(d, *names):
    for n in names:
        for k, v in d.items():
            if k == n:
                return str(v).strip()
    for n in names:
        for k, v in d.items():
            if n in k:
                return str(v).strip()
    return ""


def num(v):
    try:
        return round(float(v), 5)
    except (TypeError, ValueError):
        return None


TYPE_MAP = {"prim": "Primary", "sec": "Secondary", "comb": "Combined", "spec": "Special", "central": "Combined",
            "infants": "Primary", "high": "Secondary", "environmental": "Special", "schools for specific": "Special"}


def school_type(v):
    s = str(v or "").lower()
    for k, out in TYPE_MAP.items():
        if k in s:
            return out
    return str(v or "").strip()


# ---------------------------------------------------------------- schools
def acara_schools():
    loc = sorted(glob.glob(os.path.join(SRC, "school-location-*.xlsx")))
    if not loc:
        raise SystemExit("No school-location-*.xlsx in tools/geo-source/ — run the download command first.")
    profile = {}
    prof_files = sorted(glob.glob(os.path.join(SRC, "school-profile-*.xlsx")))
    if prof_files:
        for d in table(xlsx_rows(prof_files[-1]), ["acara sml id", "school name"]):
            profile[pick(d, "acara sml id")] = d
    out, seen = [], set()
    for d in table(xlsx_rows(loc[-1]), ["acara sml id", "latitude"]):
        sid = pick(d, "acara sml id")
        if not sid or sid in seen:
            continue
        p = profile.get(sid, {})
        name = pick(d, "school name") or pick(p, "school name")
        lat, lng = num(pick(d, "latitude")), num(pick(d, "longitude"))
        if not name or lat is None or lng is None:
            continue
        seen.add(sid)
        out.append([sid, name,
                    pick(d, "suburb") or pick(p, "suburb"),
                    state_code(pick(d, "state") or pick(p, "state")),
                    pick(d, "postcode") or pick(p, "postcode"),
                    pick(d, "school sector") or pick(p, "school sector"),
                    school_type(pick(d, "school type") or pick(p, "school type")),
                    lat, lng])
    return out, "ACARA School Location " + re.search(r"(\d{4})", os.path.basename(loc[-1])).group(1)


def nsw_schools():
    path = os.path.join(SRC, "nsw-public-schools.csv")
    if not os.path.exists(path):
        raise SystemExit("No nsw-public-schools.csv in tools/geo-source/ — run the download command first.")
    with open(path, newline="", encoding="utf-8-sig", errors="replace") as f:
        rows = list(csv.reader(f))
    out = []
    for d in table(rows, ["school_name", "latitude"]):
        name = pick(d, "school_name")
        lat, lng = num(pick(d, "latitude")), num(pick(d, "longitude"))
        if not name or lat is None or lng is None:
            continue
        out.append(["NSW-" + pick(d, "school_code"), name, pick(d, "town_suburb").title(), "NSW",
                    pick(d, "postcode"), "Government", school_type(pick(d, "level_of_schooling")), lat, lng])
    return out, "NSW DoE public schools master dataset"


# ---------------------------------------------------------------- suburbs
JUNK = re.compile(r"^(no usual address|migratory|outside australia)", re.I)
STATE_TOKENS = r"(?:NSW|Vic\.?|Qld\.?|SA|WA|Tas\.?|NT|ACT|OT)"


def clean_suburb(name):
    m = re.match(r"^(.*?)\s*\(([^)]*)\)\s*$", name)
    if not m:
        return name.strip()
    base, inner = m.group(1), m.group(2)
    inner = re.sub(r"\s*-?\s*\b" + STATE_TOKENS + r"\s*$", "", inner).strip(" -")
    return f"{base} ({inner})" if inner else base


def abs_suburbs():
    files = sorted(glob.glob(os.path.join(SRC, "sal-*.geojson")), key=lambda p: int(re.search(r"(\d+)", os.path.basename(p)).group(1)))
    if not files:
        raise SystemExit("No sal-*.geojson in tools/geo-source/ — run the download command first.")
    out, seen = [], set()
    for path in files:
        data = json.load(open(path, encoding="utf-8"))
        for ft in data.get("features", []):
            pr = ft.get("properties") or {}
            raw = str(pr.get("sal_name_2021") or "").strip()
            code = pr.get("sal_code_2021")
            if not raw or JUNK.match(raw) or code in seen:
                continue
            g = ft.get("geometry") or {}
            c = g.get("coordinates")
            if g.get("type") == "MultiPoint" and c:
                c = c[0]
            if not c or len(c) < 2:
                continue
            seen.add(code)
            out.append([clean_suburb(raw), state_code(pr.get("state_name_2021")), round(c[1], 5), round(c[0], 5)])
    out.sort(key=lambda r: (r[0].lower(), r[1]))
    return out


def write(name, payload):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  wrote {os.path.relpath(path, ROOT)}  ({os.path.getsize(path)/1024:.0f} KB, {len(payload['rows'])} rows)")


def main():
    today = datetime.date.today().isoformat()
    use_acara = "--acara" in sys.argv
    schools, source = acara_schools() if use_acara else nsw_schools()
    schools.sort(key=lambda r: (r[1].lower(), r[3]))
    sectors = {}
    for r in schools:
        sectors[r[5] or "(blank)"] = sectors.get(r[5] or "(blank)", 0) + 1
    print(f"Schools from {source}: {len(schools)}  by sector: {sectors}")
    write("schools-au.json", {"v": 1, "source": source, "built": today,
                              "fields": ["id", "name", "suburb", "state", "postcode", "sector", "type", "lat", "lng"],
                              "rows": schools})
    suburbs = abs_suburbs()
    print(f"Suburbs from ABS ASGS 2021: {len(suburbs)}")
    write("suburbs-au.json", {"v": 1, "source": "ABS ASGS Edition 3 (2021) Suburbs and Localities", "built": today,
                              "fields": ["name", "state", "lat", "lng"], "rows": suburbs})


if __name__ == "__main__":
    main()
