"""Generate the per-page narration (Egyptian female voice) into ../audio.

Voice: ar-EG-SalmaNeural (Microsoft Edge online TTS, Egyptian Arabic, female).

Usage:
    pip install edge-tts
    python tools/make_audio.py

The narration text is read straight from index.html (the `pages` array),
so audio always matches the on-screen lesson text.
"""

import asyncio
import json
import pathlib
import re
import sys

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOICE = "ar-EG-SalmaNeural"
RATE = "-4%"
PITCH = "+4Hz"


async def make(index: int, text: str, outdir: pathlib.Path) -> None:
    out = outdir / f"page-{index:02d}.mp3"
    if out.exists() and out.stat().st_size > 1000:
        print("skip", out.name)
        return
    for attempt in range(1, 4):
        try:
            await edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(str(out))
            print("made", out.name, out.stat().st_size)
            return
        except Exception as exc:  # noqa: BLE001
            print(f"retry {attempt} page {index}: {exc}")
            await asyncio.sleep(2)
    print("FAILED page", index, file=sys.stderr)


async def main() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    match = re.search(r"const pages=(\[.*?\]);let idx", html, re.S)
    if not match:
        raise SystemExit("Could not find the pages array in index.html")
    pages = json.loads(match.group(1))
    outdir = ROOT / "audio"
    outdir.mkdir(exist_ok=True)
    for index, page in enumerate(pages, 1):
        await make(index, page["speech"], outdir)


if __name__ == "__main__":
    asyncio.run(main())
