"""
把两个开源字体切成「固定文案」与「常用字」两套，供按需加载。

用法（在项目根目录，用 .venv 里的解释器）：
    .venv/Scripts/python scripts/subset-fonts.py

前置：
    node scripts/collect-ui-chars.mjs     # 生成 .fonts/ui-chars.txt
    .venv/Scripts/pip install fonttools brotli

源字体（OFL，需自备）：
    assets/fonts/NotoSerifSC.ttf            https://github.com/google/fonts/raw/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf
    assets/fonts/LXGWWenKaiScreen.ttf       https://github.com/lxgw/LxgwWenKai-Screen/releases

    node scripts/fetch-fonts.mjs  # 会从 .fonts 复制，或从上游下载
"""

import io
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"   # 源字体
CHARS = ROOT / ".fonts"             # 字符表（collect-ui-chars.mjs 生成）
OUT = ROOT / "public" / "fonts" / "v1"


def gb2312_level1() -> str:
    """GB2312 一级字表 3755 字，覆盖现代汉语常用字的 99.7%。"""
    chars = []
    for hi in range(0xB0, 0xD8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.append(bytes([hi, lo]).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    return "".join(chars)


def subset(source: Path, text_file: Path, out: Path) -> None:
    subprocess.run(
        [
            sys.executable, "-m", "fontTools.subset", str(source),
            f"--text-file={text_file}",
            "--flavor=woff2",
            "--layout-features=*",
            f"--output-file={out}",
        ],
        check=True,
    )
    print(f"{out.name}: {out.stat().st_size // 1024} KB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    ui_chars = (CHARS / "ui-chars.txt").read_text(encoding="utf-8")
    text_chars = "".join(sorted(set(ui_chars + gb2312_level1())))
    (CHARS / "text-chars.txt").write_text(text_chars, encoding="utf-8")
    print(f"固定文案 {len(ui_chars)} 字 / 含常用字 {len(text_chars)} 字")

    subset(FONTS / "NotoSerifSC.ttf", CHARS / "ui-chars.txt", OUT / "ui-song.woff2")
    subset(FONTS / "LXGWWenKaiScreen.ttf", CHARS / "ui-chars.txt", OUT / "ui-kai.woff2")
    subset(FONTS / "NotoSerifSC.ttf", CHARS / "text-chars.txt", OUT / "text-song.woff2")
    subset(FONTS / "LXGWWenKaiScreen.ttf", CHARS / "text-chars.txt", OUT / "text-kai.woff2")


if __name__ == "__main__":
    main()
