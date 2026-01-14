import argparse
from pathlib import Path

import torch
from PIL import Image
from transformers import AutoImageProcessor, SiglipForImageClassification

MODEL_ID = "Ateeqq/ai-vs-human-image-detector"


def main() -> None:
    parser = argparse.ArgumentParser(description="Export SigLIP model to ONNX.")
    parser.add_argument("--output", default="public/models/onnx")
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "model.onnx"

    processor = AutoImageProcessor.from_pretrained(MODEL_ID)
    model = SiglipForImageClassification.from_pretrained(MODEL_ID)
    model.eval()

    size = processor.size
    height = size["height"] if isinstance(size, dict) else 224
    width = size["width"] if isinstance(size, dict) else 224

    dummy_image = Image.new("RGB", (width, height), color=(127, 127, 127))
    inputs = processor(images=dummy_image, return_tensors="pt")
    pixel_values = inputs["pixel_values"]

    torch.onnx.export(
        model,
        (pixel_values,),
        str(output_path),
        input_names=["pixel_values"],
        output_names=["logits"],
        dynamic_axes={"pixel_values": {0: "batch"}},
        opset_version=17,
        do_constant_folding=True,
    )

    print(f"Exported ONNX to {output_path}")


if __name__ == "__main__":
    main()
