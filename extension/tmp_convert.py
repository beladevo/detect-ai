from pathlib import Path
import cairosvg
svg_path = Path('assets/icon.svg')
out = Path('.plasmo/gen-assets')
out.mkdir(parents=True, exist_ok=True)
for size in (16, 32, 48, 64, 128):
    cairosvg.svg2png(url=str(svg_path), write_to=str(out / f'icon{size}.plasmo.png'), output_width=size, output_height=size)
