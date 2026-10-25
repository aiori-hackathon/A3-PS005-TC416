"""Extract authentic archival MRT BGP records from RIPE RIS archives into test fixtures.

Archives processed:
1. YouTube / Pakistan Telecom (2008-02-24 18:45 UTC):
   https://data.ris.ripe.net/rrc00/2008.02/updates.20080224.1845.gz
2. RTComm / Twitter Hijack (2022-03-28 12:05 UTC):
   https://data.ris.ripe.net/rrc00/2022.03/updates.20220328.1205.gz
3. Benign updates & withdrawals from rrc00.
"""

import gzip
import io
import json
import os
from pathlib import Path
import httpx
import mrtparse

fixtures_dir = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "mrt_incidents"
fixtures_dir.mkdir(parents=True, exist_ok=True)


def extract_youtube_fixtures():
    url_yt = "https://data.ris.ripe.net/rrc00/2008.02/updates.20080224.1845.gz"
    print(f"Fetching YouTube archive: {url_yt}...")
    resp = httpx.get(url_yt, timeout=30.0)
    gz_yt = gzip.GzipFile(fileobj=io.BytesIO(resp.content))
    reader_yt = mrtparse.Reader(gz_yt)

    yt_records = []
    benign_records = []
    withdrawal_records = []

    for entry in reader_yt:
        m = entry.data
        d_str = str(m)
        bgp = m.get("bgp_message", {})
        ts = list(m.get("timestamp", {}).keys())[0] if isinstance(m.get("timestamp"), dict) else m.get("timestamp")
        peer_ip = m.get("peer_ip")
        peer_as = m.get("peer_as")

        # Extract withdrawals
        withdrawn = bgp.get("withdrawn_routes", [])
        if withdrawn:
            for w in withdrawn:
                prefix_w = f"{w.get('prefix')}/{w.get('length')}"
                withdrawal_records.append({
                    "source_archive": url_yt,
                    "collector": "rrc00",
                    "timestamp": ts,
                    "peer_ip": peer_ip,
                    "peer_as": peer_as,
                    "type": "WITHDRAWAL",
                    "prefix": prefix_w,
                })

        # Check for YouTube prefix 208.65.153.0/24
        if "208.65.153." in d_str:
            nlri_list = [f"{n.get('prefix')}/{n.get('length')}" for n in bgp.get("nlri", [])]
            paths = [attr for attr in bgp.get("path_attributes", []) if attr.get("type") == {2: "AS_PATH"}]
            as_path = []
            if paths and paths[0].get("value"):
                for seg in paths[0]["value"]:
                    as_path.extend(seg.get("value", []))

            if as_path:
                yt_records.append({
                    "source_archive": url_yt,
                    "collector": "rrc00",
                    "timestamp": ts,
                    "peer_ip": peer_ip,
                    "peer_as": peer_as,
                    "type": "ANNOUNCEMENT",
                    "prefixes": nlri_list,
                    "as_path": as_path,
                    "origin_asn": as_path[-1],
                })
        elif len(benign_records) < 20 and bgp.get("nlri"):
            nlri_list = [f"{n.get('prefix')}/{n.get('length')}" for n in bgp.get("nlri", [])]
            paths = [attr for attr in bgp.get("path_attributes", []) if attr.get("type") == {2: "AS_PATH"}]
            as_path = []
            if paths and paths[0].get("value"):
                for seg in paths[0]["value"]:
                    as_path.extend(seg.get("value", []))
            if as_path:
                benign_records.append({
                    "source_archive": url_yt,
                    "collector": "rrc00",
                    "timestamp": ts,
                    "peer_ip": peer_ip,
                    "peer_as": peer_as,
                    "type": "ANNOUNCEMENT",
                    "prefixes": nlri_list,
                    "as_path": as_path,
                    "origin_asn": as_path[-1],
                })

    out_yt = fixtures_dir / "youtube_ptcl_2008_mrt_sample.json"
    with open(out_yt, "w", encoding="utf-8") as f:
        json.dump({
            "incident_id": "INC-2008-02-24-YOUTUBE-PTCL",
            "source_url": url_yt,
            "incident_class": "SUBPREFIX_HIJACK",
            "ground_truth": {
                "target_prefix": "208.65.153.0/24",
                "parent_baseline_prefix": "208.65.152.0/22",
                "authorized_origin": "AS36561",
                "rogue_origin": "AS17557",
            },
            "records_count": len(yt_records),
            "records": yt_records,
        }, f, indent=2)

    out_benign = fixtures_dir / "benign_controls_mrt_sample.json"
    with open(out_benign, "w", encoding="utf-8") as f:
        json.dump({
            "control_id": "CONTROL-NORMAL-BGP-UPDATES",
            "source_url": url_yt,
            "announcements_count": len(benign_records),
            "withdrawals_count": len(withdrawal_records[:15]),
            "announcements": benign_records,
            "withdrawals": withdrawal_records[:15],
        }, f, indent=2)

    print(f"YouTube records extracted: {len(yt_records)} -> {out_yt}")
    print(f"Benign records extracted: {len(benign_records)}, withdrawals: {len(withdrawal_records[:15])} -> {out_benign}")


def extract_twitter_fixtures():
    url_tw = "https://data.ris.ripe.net/rrc00/2022.03/updates.20220328.1205.gz"
    print(f"Fetching Twitter / RTComm archive: {url_tw}...")
    resp = httpx.get(url_tw, timeout=45.0)
    gz_tw = gzip.GzipFile(fileobj=io.BytesIO(resp.content))
    reader_tw = mrtparse.Reader(gz_tw)

    tw_records = []
    for entry in reader_tw:
        m = entry.data
        d_str = str(m)
        if "104.244.42." in d_str and "8342" in d_str:
            bgp = m.get("bgp_message", {})
            ts = list(m.get("timestamp", {}).keys())[0] if isinstance(m.get("timestamp"), dict) else m.get("timestamp")
            peer_ip = m.get("peer_ip")
            peer_as = m.get("peer_as")
            nlri_list = [f"{n.get('prefix')}/{n.get('length')}" for n in bgp.get("nlri", [])]
            paths = [attr for attr in bgp.get("path_attributes", []) if attr.get("type") == {2: "AS_PATH"}]
            as_path = []
            if paths and paths[0].get("value"):
                for seg in paths[0]["value"]:
                    as_path.extend(seg.get("value", []))

            if as_path:
                tw_records.append({
                    "source_archive": url_tw,
                    "collector": "rrc00",
                    "timestamp": ts,
                    "peer_ip": peer_ip,
                    "peer_as": peer_as,
                    "type": "ANNOUNCEMENT",
                    "prefixes": nlri_list,
                    "as_path": as_path,
                    "origin_asn": as_path[-1],
                })

    out_tw = fixtures_dir / "rtcomm_twitter_2022_mrt_sample.json"
    with open(out_tw, "w", encoding="utf-8") as f:
        json.dump({
            "incident_id": "INC-2022-03-28-RTCOMM-TWITTER-HIJACK",
            "source_url": url_tw,
            "incident_class": "ORIGIN_CONFLICT",
            "ground_truth": {
                "target_prefix": "104.244.42.0/24",
                "authorized_origin": "AS13414",
                "rogue_origin": "AS8342",
            },
            "records_count": len(tw_records),
            "records": tw_records,
        }, f, indent=2)

    print(f"Twitter/RTComm records extracted: {len(tw_records)} -> {out_tw}")


if __name__ == "__main__":
    extract_youtube_fixtures()
    extract_twitter_fixtures()
