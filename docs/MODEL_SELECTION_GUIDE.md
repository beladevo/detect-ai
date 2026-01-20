# מדריך בחירת מודל AI Detection

## תוכן עניינים
1. [היכן למצוא מודלים](#היכן-למצוא-מודלים)
2. [קריטריונים לבחירת מודל](#קריטריונים-לבחירת-מודל)
3. [המרה ל-ONNX](#המרה-ל-onnx)
4. [בדיקת המודל](#בדיקת-המודל)
5. [אינטגרציה לפרויקט](#אינטגרציה-לפרויקט)

---

## היכן למצוא מודלים

### Hugging Face (המקור המומלץ)
```
https://huggingface.co/models?search=ai+image+detection
https://huggingface.co/models?search=fake+image+detection
https://huggingface.co/models?search=deepfake+detection
```

**חיפושים מומלצים:**
- `ai generated image detection`
- `synthetic image detection`
- `deepfake detection`
- `AI art detector`

### מודלים פופולריים:
| מודל | מקור | תיאור |
|------|------|-------|
| `umm-maybe/AI-image-detector` | Hugging Face | מודל פופולרי לזיהוי תמונות AI |
| `Organika/sdxl-detector` | Hugging Face | מותאם ל-SDXL |
| `saltacc/ai-image-detection` | Hugging Face | מודל קל משקל |

---

## קריטריונים לבחירת מודל

### 1. ביצועים (Metrics)
בדוק ב-Model Card:
```
Accuracy: אחוז הדיוק הכללי (מומלץ: >85%)
F1 Score: איזון בין Precision ל-Recall (מומלץ: >80%)
Precision: כמה מהזיהויים נכונים
Recall: כמה מהתמונות האמיתיות זוהו
```

### 2. גודל המודל
| גודל | יתרונות | חסרונות |
|------|---------|---------|
| קטן (<50MB) | מהיר, מתאים ל-WASM/Browser | פחות מדויק |
| בינוני (50-200MB) | איזון טוב | - |
| גדול (>200MB) | מדויק יותר | איטי, לא מתאים ל-Browser |

### 3. ארכיטקטורה
**מומלץ:**
- `ResNet` - יציב, נתמך היטב
- `EfficientNet` - יעיל, מדויק
- `ViT (Vision Transformer)` - חדשני, מדויק

**פחות מומלץ:**
- מודלים עם Custom Layers מורכבים
- מודלים שדורשים preprocessing מיוחד

### 4. Input Size
```
224x224 - סטנדרטי, מומלץ
384x384 - יותר מדויק, יותר איטי
512x512 - כבד מאוד
```

### 5. תיעוד
**בדוק שיש:**
- [ ] הסבר על הפלט (מה כל index אומר)
- [ ] דרישות preprocessing (normalization)
- [ ] Dataset שעליו אומן
- [ ] Benchmarks/Results

---

## המרה ל-ONNX

### האם כל מודל אפשר להמיר?

**כן, רוב המודלים** - אבל יש מגבלות:

| Framework | תמיכה בהמרה | הערות |
|-----------|-------------|-------|
| PyTorch | מעולה | `torch.onnx.export()` |
| TensorFlow/Keras | טובה | `tf2onnx` |
| JAX/Flax | בינונית | דרך TensorFlow |
| Scikit-learn | מוגבלת | `skl2onnx` |

### בעיות נפוצות בהמרה:

1. **Custom Operators** - פעולות מותאמות אישית לא נתמכות
2. **Dynamic Shapes** - חלק מהמודלים לא תומכים בגדלים דינמיים
3. **Control Flow** - if/else מורכב בתוך המודל

### המרה מ-PyTorch:

```python
import torch
import torch.onnx

# טעינת המודל
model = torch.load("model.pt")
model.eval()

# יצירת input לדוגמה
dummy_input = torch.randn(1, 3, 224, 224)

# המרה ל-ONNX
torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    input_names=["input"],
    output_names=["output"],
    dynamic_axes={
        "input": {0: "batch_size"},
        "output": {0: "batch_size"}
    },
    opset_version=14  # גרסת ONNX
)
```

### המרה מ-Hugging Face (transformers):

```python
from transformers import AutoModelForImageClassification
from transformers.onnx import export
from pathlib import Path

model = AutoModelForImageClassification.from_pretrained("model-name")
onnx_path = Path("model.onnx")

# המרה אוטומטית
export(
    preprocessor=processor,
    model=model,
    config=config,
    opset=14,
    output=onnx_path
)
```

### המרה מ-TensorFlow/Keras:

```bash
pip install tf2onnx

python -m tf2onnx.convert \
    --saved-model ./saved_model \
    --output model.onnx \
    --opset 14
```

### Quantization (הקטנת גודל):

```python
import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType

# Quantize to INT8
quantize_dynamic(
    "model.onnx",
    "model_q8.onnx",
    weight_type=QuantType.QInt8
)

# או ל-INT4 (קטן יותר, פחות מדויק)
quantize_dynamic(
    "model.onnx",
    "model_q4.onnx",
    weight_type=QuantType.QInt4
)
```

---

## בדיקת המודל

### 1. בדיקת מבנה הפלט

```python
import onnxruntime as ort

session = ort.InferenceSession("model.onnx")

# בדיקת inputs
for input in session.get_inputs():
    print(f"Input: {input.name}")
    print(f"  Shape: {input.shape}")
    print(f"  Type: {input.type}")

# בדיקת outputs
for output in session.get_outputs():
    print(f"Output: {output.name}")
    print(f"  Shape: {output.shape}")
    print(f"  Type: {output.type}")
```

### 2. בדיקת הפלט על תמונה

```python
import numpy as np
from PIL import Image

# preprocessing
image = Image.open("test.jpg").resize((224, 224))
input_array = np.array(image).astype(np.float32)
input_array = input_array.transpose(2, 0, 1)  # HWC -> CHW
input_array = (input_array / 255.0 - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
input_array = input_array[np.newaxis, ...]  # Add batch dimension

# inference
outputs = session.run(None, {"input": input_array})
print(f"Raw output: {outputs[0]}")
print(f"Softmax: {softmax(outputs[0])}")
```

### 3. זיהוי aiIndex

הרץ על תמונות שאתה **יודע** מה הן:

```python
# תמונה שאתה יודע שהיא AI
ai_image_output = run_model("known_ai_image.png")
print(f"AI image output: {ai_image_output}")
# אם [0.95, 0.05] → aiIndex = 0
# אם [0.05, 0.95] → aiIndex = 1

# תמונה שאתה יודע שהיא אמיתית
real_image_output = run_model("known_real_image.jpg")
print(f"Real image output: {real_image_output}")
```

---

## אינטגרציה לפרויקט

### 1. הוספת המודל

```bash
# העתקת המודל
cp model.onnx public/models/onnx/

# אם יש קובץ data נפרד (מודלים גדולים)
cp model.onnx.data public/models/onnx/
```

### 2. עדכון הקונפיגורציה

```typescript
// src/lib/modelConfigs.ts

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // הוסף את המודל החדש
  "new-model.onnx": { aiIndex: 0 },  // או 1, לפי מה שגילית
};
```

### 3. עדכון benchmark

```typescript
// benchmark/benchmark.ts

const MODEL_AI_INDEX: Record<string, number> = {
  "new-model.onnx": 0,  // אותו ערך כמו ב-modelConfigs
};
```

### 4. הרצת benchmark

```bash
npx tsx benchmark/benchmark.ts --models new-model.onnx --verbose
```

### 5. עדכון .env.local

```env
NEXT_PUBLIC_MODEL_NAME=new-model.onnx
NEXT_PUBLIC_MODEL_SIZE_MB=150
```

---

## צ'קליסט לפני שימוש במודל

- [ ] המודל הומר ל-ONNX בהצלחה
- [ ] בדקתי את מבנה ה-input (shape, type)
- [ ] בדקתי את מבנה ה-output (כמה classes)
- [ ] זיהיתי את ה-aiIndex הנכון
- [ ] הרצתי benchmark והתוצאות סבירות (F1 > 70%)
- [ ] הגודל מתאים לצרכים (Browser/Server)
- [ ] עדכנתי את modelConfigs.ts
- [ ] עדכנתי את benchmark.ts

---

## טיפים נוספים

### Preprocessing חשוב!
רוב המודלים מצפים ל-ImageNet normalization:
```typescript
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
```

אם המודל אומן אחרת, התוצאות יהיו שגויות!

### בדוק את ה-Dataset
מודל שאומן על DALL-E אולי לא יזהה Midjourney טוב.
חפש מודלים שאומנו על dataset מגוון.

### שקול Ensemble
שילוב של כמה מודלים יכול לשפר דיוק:
```typescript
const score = (model1_score + model2_score + model3_score) / 3;
```

---

## משאבים נוספים

- [ONNX Documentation](https://onnx.ai/onnx/)
- [Hugging Face Model Hub](https://huggingface.co/models)
- [ONNX Runtime](https://onnxruntime.ai/)
- [Netron - ONNX Visualizer](https://netron.app/)
