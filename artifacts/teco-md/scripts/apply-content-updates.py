"""Reviewed, reversible public content updates. Dry run unless --apply is given."""
import json
import sys
import urllib.request
from pathlib import Path

updates = json.loads(Path(__file__).with_name("content-updates-20260929.json").read_text())
apply = "--apply" in sys.argv
rollback = "--rollback" in sys.argv
api = "https://teco.md/api"


def request(path, body=None, method="GET"):
    data = json.dumps(body, ensure_ascii=False).encode() if body is not None else None
    req = urllib.request.Request(api + path, data=data, method=method,
        headers={"User-Agent": "TECO SEO content update", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=25) as response:
        return json.load(response)


blogs = request("/blog-posts")["data"]
products = request("/products")["data"]
prepared = []
for change in updates:
    rows = blogs if change["kind"] == "blog" else products
    row = next((item for item in rows if item["id"] == change["id"] and item["slug"] == change["slug"]), None)
    if row is None:
        raise RuntimeError("Record missing: " + change["slug"])
    source, target = (change["after"], change["before"]) if rollback else (change["before"], change["after"])
    if all(row.get(key) == value for key, value in target.items()):
        continue
    if not all(row.get(key) == value for key, value in source.items()):
        raise RuntimeError("Content changed since review; refusing to overwrite: " + change["slug"])
    prepared.append((change, {**row, **target}))

for change, body in prepared:
    if apply:
        request("/blog-posts" if change["kind"] == "blog" else "/products/" + str(change["id"]),
            body, "POST" if change["kind"] == "blog" else "PUT")
    print(("updated: " if apply else "preview: ") + change["slug"])
print(f"{len(prepared)} " + ("records updated." if apply else "reviewed changes; use --apply to publish."))
