#!/usr/bin/env python3
"""
ONNX Model Converter
====================
Converts various model formats to ONNX.

Supported formats:
- PyTorch (.pt, .pth, .bin)
- TensorFlow SavedModel (directory)
- TensorFlow/Keras (.h5, .keras)
- Hugging Face model ID (e.g., "umm-maybe/AI-image-detector")

Usage:
    python convert_to_onnx.py --modelPath ./model.pt --output model.onnx
    python convert_to_onnx.py --modelPath ./saved_model/ --output model.onnx
    python convert_to_onnx.py --modelPath "umm-maybe/AI-image-detector" --output model.onnx
    python convert_to_onnx.py --modelPath ./model.pt --output model.onnx --quantize int8
"""

import argparse
import os
import sys
from pathlib import Path


def check_dependencies():
    """Check and report missing dependencies."""
    missing = []

    try:
        import onnx
    except ImportError:
        missing.append("onnx")

    try:
        import numpy
    except ImportError:
        missing.append("numpy")

    if missing:
        print(f"Error: Missing required packages: {', '.join(missing)}")
        print(f"Install with: pip install {' '.join(missing)}")
        sys.exit(1)


def detect_model_type(model_path: str) -> str:
    """Detect the model type based on path/extension."""

    # Check if it's a Hugging Face model ID (contains /)
    if "/" in model_path and not os.path.exists(model_path):
        return "huggingface"

    path = Path(model_path)

    # Check if it's a directory (TensorFlow SavedModel)
    if path.is_dir():
        if (path / "saved_model.pb").exists():
            return "tensorflow_saved_model"
        elif (path / "model.safetensors").exists() or (path / "pytorch_model.bin").exists():
            return "huggingface_local"
        else:
            print(f"Warning: Directory detected but format unclear. Trying as SavedModel...")
            return "tensorflow_saved_model"

    # Check file extension
    ext = path.suffix.lower()

    if ext in [".pt", ".pth", ".bin"]:
        return "pytorch"
    elif ext in [".h5", ".keras"]:
        return "keras"
    elif ext == ".onnx":
        print("Model is already in ONNX format!")
        sys.exit(0)
    elif ext == ".safetensors":
        return "safetensors"
    else:
        print(f"Warning: Unknown extension '{ext}'. Trying as PyTorch...")
        return "pytorch"


def convert_pytorch(model_path: str, output_path: str, input_size: tuple = (1, 3, 224, 224)):
    """Convert PyTorch model to ONNX."""
    try:
        import torch
        import torch.onnx
    except ImportError:
        print("Error: PyTorch not installed. Install with: pip install torch")
        sys.exit(1)

    print(f"Loading PyTorch model from: {model_path}")

    try:
        # Try loading as full model
        model = torch.load(model_path, map_location="cpu")

        # If it's a state dict, we can't convert without the model architecture
        if isinstance(model, dict):
            if "state_dict" in model:
                print("Error: This file contains only weights (state_dict), not the full model.")
                print("You need the model architecture to convert. Try using Hugging Face format instead.")
                sys.exit(1)
            elif "model" in model:
                model = model["model"]
    except Exception as e:
        print(f"Error loading model: {e}")
        sys.exit(1)

    model.eval()

    # Create dummy input
    dummy_input = torch.randn(*input_size)

    print(f"Converting to ONNX with input shape: {input_size}")

    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "output": {0: "batch_size"}
        },
        opset_version=14,
        do_constant_folding=True,
    )

    print(f"Successfully converted to: {output_path}")


def convert_huggingface(model_id: str, output_path: str):
    """Convert Hugging Face model to ONNX."""
    try:
        from transformers import AutoModelForImageClassification, AutoConfig
        import torch
    except ImportError:
        print("Error: transformers not installed. Install with: pip install transformers torch")
        sys.exit(1)

    print(f"Loading Hugging Face model: {model_id}")

    try:
        # Load model
        model = AutoModelForImageClassification.from_pretrained(model_id)
        config = AutoConfig.from_pretrained(model_id)
        model.eval()

        # Get input size from config or use default
        image_size = getattr(config, "image_size", 224)
        if isinstance(image_size, (list, tuple)):
            image_size = image_size[0]

        input_size = (1, 3, image_size, image_size)
        dummy_input = torch.randn(*input_size)

        print(f"Converting to ONNX with input shape: {input_size}")

        torch.onnx.export(
            model,
            dummy_input,
            output_path,
            input_names=["input"],
            output_names=["output"],
            dynamic_axes={
                "input": {0: "batch_size"},
                "output": {0: "batch_size"}
            },
            opset_version=14,
            do_constant_folding=True,
        )

        # Print label info if available
        if hasattr(config, "id2label"):
            print(f"\nModel labels: {config.id2label}")
            print("Use this to determine the correct aiIndex!")

        print(f"\nSuccessfully converted to: {output_path}")

    except Exception as e:
        print(f"Error: {e}")
        print("\nTrying alternative method with optimum...")
        convert_huggingface_optimum(model_id, output_path)


def convert_huggingface_optimum(model_id: str, output_path: str):
    """Convert using Hugging Face Optimum library."""
    try:
        from optimum.onnxruntime import ORTModelForImageClassification
    except ImportError:
        print("Error: optimum not installed. Install with: pip install optimum[onnxruntime]")
        sys.exit(1)

    print(f"Loading with Optimum: {model_id}")

    output_dir = Path(output_path).parent / "temp_onnx_export"

    try:
        model = ORTModelForImageClassification.from_pretrained(
            model_id,
            export=True,
        )
        model.save_pretrained(output_dir)

        # Move the ONNX file to the desired location
        onnx_file = output_dir / "model.onnx"
        if onnx_file.exists():
            import shutil
            shutil.move(str(onnx_file), output_path)
            shutil.rmtree(output_dir, ignore_errors=True)
            print(f"Successfully converted to: {output_path}")
        else:
            print(f"Error: ONNX file not found in {output_dir}")

    except Exception as e:
        print(f"Error with Optimum conversion: {e}")
        sys.exit(1)


def convert_tensorflow_saved_model(model_path: str, output_path: str):
    """Convert TensorFlow SavedModel to ONNX."""
    try:
        import tf2onnx
        import tensorflow as tf
    except ImportError:
        print("Error: tf2onnx not installed. Install with: pip install tf2onnx tensorflow")
        sys.exit(1)

    print(f"Loading TensorFlow SavedModel from: {model_path}")

    try:
        import subprocess
        result = subprocess.run([
            sys.executable, "-m", "tf2onnx.convert",
            "--saved-model", model_path,
            "--output", output_path,
            "--opset", "14"
        ], capture_output=True, text=True)

        if result.returncode != 0:
            print(f"Error: {result.stderr}")
            sys.exit(1)

        print(f"Successfully converted to: {output_path}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def convert_keras(model_path: str, output_path: str):
    """Convert Keras model to ONNX."""
    try:
        import tf2onnx
        import tensorflow as tf
    except ImportError:
        print("Error: tf2onnx not installed. Install with: pip install tf2onnx tensorflow")
        sys.exit(1)

    print(f"Loading Keras model from: {model_path}")

    try:
        model = tf.keras.models.load_model(model_path)

        # Get input shape
        input_shape = model.input_shape
        print(f"Model input shape: {input_shape}")

        # Convert
        import subprocess

        # Save as SavedModel first
        temp_saved_model = Path(output_path).parent / "temp_saved_model"
        model.save(temp_saved_model)

        # Then convert
        result = subprocess.run([
            sys.executable, "-m", "tf2onnx.convert",
            "--saved-model", str(temp_saved_model),
            "--output", output_path,
            "--opset", "14"
        ], capture_output=True, text=True)

        # Cleanup
        import shutil
        shutil.rmtree(temp_saved_model, ignore_errors=True)

        if result.returncode != 0:
            print(f"Error: {result.stderr}")
            sys.exit(1)

        print(f"Successfully converted to: {output_path}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def convert_safetensors(model_path: str, output_path: str):
    """Convert SafeTensors model to ONNX."""
    try:
        from safetensors.torch import load_file
        import torch
    except ImportError:
        print("Error: safetensors not installed. Install with: pip install safetensors torch")
        sys.exit(1)

    print(f"Loading SafeTensors from: {model_path}")
    print("Error: SafeTensors files contain only weights, not model architecture.")
    print("Please provide the full Hugging Face model ID or directory instead.")
    sys.exit(1)


def quantize_model(input_path: str, output_path: str, quant_type: str):
    """Quantize ONNX model."""
    try:
        from onnxruntime.quantization import quantize_dynamic, QuantType
    except ImportError:
        print("Error: onnxruntime not installed. Install with: pip install onnxruntime")
        sys.exit(1)

    print(f"Quantizing model to {quant_type}...")

    quant_types = {
        "int8": QuantType.QInt8,
        "uint8": QuantType.QUInt8,
    }

    if quant_type not in quant_types:
        print(f"Error: Unknown quantization type '{quant_type}'. Use: int8, uint8")
        sys.exit(1)

    quantize_dynamic(
        input_path,
        output_path,
        weight_type=quant_types[quant_type]
    )

    # Get file sizes
    original_size = os.path.getsize(input_path) / (1024 * 1024)
    quantized_size = os.path.getsize(output_path) / (1024 * 1024)

    print(f"Original size: {original_size:.2f} MB")
    print(f"Quantized size: {quantized_size:.2f} MB")
    print(f"Reduction: {(1 - quantized_size/original_size) * 100:.1f}%")


def verify_onnx(model_path: str):
    """Verify the ONNX model is valid."""
    try:
        import onnx
        import onnxruntime as ort
    except ImportError:
        print("Warning: Cannot verify model. Install onnxruntime for verification.")
        return

    print("\nVerifying ONNX model...")

    # Check model
    model = onnx.load(model_path)
    onnx.checker.check_model(model)
    print("ONNX model is valid!")

    # Get model info
    session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])

    print("\nModel Info:")
    print("-" * 40)

    for inp in session.get_inputs():
        print(f"Input:  {inp.name}")
        print(f"  Shape: {inp.shape}")
        print(f"  Type:  {inp.type}")

    for out in session.get_outputs():
        print(f"Output: {out.name}")
        print(f"  Shape: {out.shape}")
        print(f"  Type:  {out.type}")

    # File size
    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"\nFile size: {size_mb:.2f} MB")


def main():
    parser = argparse.ArgumentParser(
        description="Convert various model formats to ONNX",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python convert_to_onnx.py --modelPath ./model.pt --output model.onnx
  python convert_to_onnx.py --modelPath "umm-maybe/AI-image-detector" --output detector.onnx
  python convert_to_onnx.py --modelPath ./saved_model/ --output model.onnx
  python convert_to_onnx.py --modelPath ./model.onnx --output model_q8.onnx --quantize int8
        """
    )

    parser.add_argument(
        "--modelPath",
        required=True,
        help="Path to model file/directory or Hugging Face model ID"
    )

    parser.add_argument(
        "--output",
        required=True,
        help="Output ONNX file path"
    )

    parser.add_argument(
        "--inputSize",
        default="224",
        help="Input image size (default: 224)"
    )

    parser.add_argument(
        "--quantize",
        choices=["int8", "uint8"],
        help="Quantize the output model (int8 or uint8)"
    )

    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify the output ONNX model"
    )

    args = parser.parse_args()

    # Check dependencies
    check_dependencies()

    # Parse input size
    try:
        input_size = int(args.inputSize)
    except ValueError:
        print(f"Error: Invalid input size '{args.inputSize}'")
        sys.exit(1)

    # Detect model type
    model_type = detect_model_type(args.modelPath)
    print(f"Detected model type: {model_type}")

    # Create output directory if needed
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # If quantizing an existing ONNX model
    if args.quantize and model_type == "onnx":
        quantize_model(args.modelPath, str(output_path), args.quantize)
        if args.verify:
            verify_onnx(str(output_path))
        return

    # Convert based on type
    temp_output = str(output_path)
    if args.quantize:
        temp_output = str(output_path.with_suffix(".temp.onnx"))

    if model_type == "pytorch":
        convert_pytorch(args.modelPath, temp_output, (1, 3, input_size, input_size))
    elif model_type == "huggingface":
        convert_huggingface(args.modelPath, temp_output)
    elif model_type == "huggingface_local":
        convert_huggingface(args.modelPath, temp_output)
    elif model_type == "tensorflow_saved_model":
        convert_tensorflow_saved_model(args.modelPath, temp_output)
    elif model_type == "keras":
        convert_keras(args.modelPath, temp_output)
    elif model_type == "safetensors":
        convert_safetensors(args.modelPath, temp_output)
    else:
        print(f"Error: Unsupported model type: {model_type}")
        sys.exit(1)

    # Quantize if requested
    if args.quantize:
        quantize_model(temp_output, str(output_path), args.quantize)
        os.remove(temp_output)

    # Verify if requested
    if args.verify:
        verify_onnx(str(output_path))

    print("\nDone!")
    print(f"\nNext steps:")
    print(f"1. Copy {output_path} to public/models/onnx/")
    print(f"2. Run: npx tsx benchmark/benchmark.ts --models {output_path.name} --verbose")
    print(f"3. Check the logs to determine the correct aiIndex")
    print(f"4. Update modelConfigs.ts with the new model")


if __name__ == "__main__":
    main()
