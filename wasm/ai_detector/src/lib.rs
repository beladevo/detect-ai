use std::cell::RefCell;
use wasm_bindgen::prelude::*;

const TARGET_W: u32 = 128;
const TARGET_H: u32 = 128;
const FEATURE_COUNT: usize = 16;

#[derive(Default)]
struct ModelState {
    weights: Vec<f32>,
    bias: f32,
    rgb: Vec<f32>,
    gray: Vec<f32>,
}

thread_local! {
    static STATE: RefCell<ModelState> = RefCell::new(ModelState::default());
}

#[wasm_bindgen]
pub fn init_model(model_bytes: &[u8]) -> u32 {
    if model_bytes.len() % 4 != 0 {
        return 1;
    }
    let float_count = model_bytes.len() / 4;
    if float_count != FEATURE_COUNT + 1 {
        return 2;
    }
    let mut weights = Vec::with_capacity(FEATURE_COUNT);
    for i in 0..FEATURE_COUNT {
        let offset = i * 4;
        let bytes = [
            model_bytes[offset],
            model_bytes[offset + 1],
            model_bytes[offset + 2],
            model_bytes[offset + 3],
        ];
        weights.push(f32::from_le_bytes(bytes));
    }
    let bias_offset = FEATURE_COUNT * 4;
    let bias = f32::from_le_bytes([
        model_bytes[bias_offset],
        model_bytes[bias_offset + 1],
        model_bytes[bias_offset + 2],
        model_bytes[bias_offset + 3],
    ]);

    STATE.with(|state| {
        let mut state = state.borrow_mut();
        state.weights = weights;
        state.bias = bias;
    });

    0
}

#[wasm_bindgen]
pub fn detect_ai(pixels: &[u8], width: u32, height: u32, channels: u8) -> f32 {
    if width == 0 || height == 0 {
        return f32::NAN;
    }
    if channels != 3 && channels != 4 {
        return f32::NAN;
    }
    let expected = (width as usize)
        .saturating_mul(height as usize)
        .saturating_mul(channels as usize);
    if expected != pixels.len() {
        return f32::NAN;
    }

    STATE.with(|state| {
        let mut state = state.borrow_mut();
        if state.weights.len() != FEATURE_COUNT {
            return f32::NAN;
        }

        let rgb_len = (TARGET_W * TARGET_H * 3) as usize;
        if state.rgb.len() != rgb_len {
            state.rgb.resize(rgb_len, 0.0);
        }
        let gray_len = (TARGET_W * TARGET_H) as usize;
        if state.gray.len() != gray_len {
            state.gray.resize(gray_len, 0.0);
        }

        let ModelState { rgb, gray, weights, bias } = &mut *state;

        downsample_rgb(
            pixels,
            width,
            height,
            channels,
            TARGET_W,
            TARGET_H,
            rgb,
            gray,
        );

        let mut features = [0.0_f32; FEATURE_COUNT];
        compute_features(rgb, gray, TARGET_W, TARGET_H, &mut features);

        let mut logit = *bias;
        for (i, w) in weights.iter().enumerate() {
            logit += features[i] * w;
        }
        sigmoid(logit)
    })
}

fn downsample_rgb(
    pixels: &[u8],
    width: u32,
    height: u32,
    channels: u8,
    out_w: u32,
    out_h: u32,
    out_rgb: &mut [f32],
    out_gray: &mut [f32],
) {
    let scale_x = width as f32 / out_w as f32;
    let scale_y = height as f32 / out_h as f32;
    let stride = channels as usize;

    for y in 0..out_h {
        let src_y = ((y as f32 + 0.5) * scale_y).floor().clamp(0.0, (height - 1) as f32) as u32;
        for x in 0..out_w {
            let src_x =
                ((x as f32 + 0.5) * scale_x).floor().clamp(0.0, (width - 1) as f32) as u32;
            let src_index = ((src_y * width + src_x) as usize) * stride;
            let r = pixels[src_index] as f32 / 255.0;
            let g = pixels[src_index + 1] as f32 / 255.0;
            let b = pixels[src_index + 2] as f32 / 255.0;
            let (r, g, b) = if channels == 4 {
                let a = pixels[src_index + 3] as f32 / 255.0;
                let inv = 1.0 - a;
                (r * a + inv, g * a + inv, b * a + inv)
            } else {
                (r, g, b)
            };

            let dst = ((y * out_w + x) as usize) * 3;
            out_rgb[dst] = r;
            out_rgb[dst + 1] = g;
            out_rgb[dst + 2] = b;

            let gray = 0.299 * r + 0.587 * g + 0.114 * b;
            out_gray[(y * out_w + x) as usize] = gray;
        }
    }
}

fn compute_features(
    rgb: &[f32],
    gray: &[f32],
    width: u32,
    height: u32,
    out: &mut [f32; FEATURE_COUNT],
) {
    let count = (width * height) as usize;
    let mut sum_luma = 0.0;
    let mut sum_luma_sq = 0.0;

    let mut sum_sat = 0.0;
    let mut sum_sat_sq = 0.0;
    let mut sum_r = 0.0;
    let mut sum_g = 0.0;
    let mut sum_b = 0.0;
    let mut sum_r_sq = 0.0;
    let mut sum_g_sq = 0.0;
    let mut sum_b_sq = 0.0;
    let mut sum_rg = 0.0;
    let mut sum_gb = 0.0;
    let mut chroma_noise = 0.0;
    let mut clip_count = 0.0;

    for i in 0..count {
        let l = gray[i];
        sum_luma += l;
        sum_luma_sq += l * l;
        if l < 0.02 || l > 0.98 {
            clip_count += 1.0;
        }

        let rgb_idx = i * 3;
        let r = rgb[rgb_idx];
        let g = rgb[rgb_idx + 1];
        let b = rgb[rgb_idx + 2];
        let max_c = r.max(g.max(b));
        let min_c = r.min(g.min(b));
        let sat = max_c - min_c;
        sum_sat += sat;
        sum_sat_sq += sat * sat;

        sum_r += r;
        sum_g += g;
        sum_b += b;
        sum_r_sq += r * r;
        sum_g_sq += g * g;
        sum_b_sq += b * b;
        sum_rg += r * g;
        sum_gb += g * b;
        chroma_noise += (r - g).abs() + (g - b).abs();
    }

    let mean_luma = sum_luma / count as f32;
    let var_luma = (sum_luma_sq / count as f32 - mean_luma * mean_luma).max(0.0);
    let mean_sat = sum_sat / count as f32;
    let var_sat = (sum_sat_sq / count as f32 - mean_sat * mean_sat).max(0.0);

    let mean_r = sum_r / count as f32;
    let mean_g = sum_g / count as f32;
    let mean_b = sum_b / count as f32;
    let std_r = (sum_r_sq / count as f32 - mean_r * mean_r).max(0.0).sqrt();
    let std_g = (sum_g_sq / count as f32 - mean_g * mean_g).max(0.0).sqrt();
    let std_b = (sum_b_sq / count as f32 - mean_b * mean_b).max(0.0).sqrt();

    let cov_rg = sum_rg / count as f32 - mean_r * mean_g;
    let cov_gb = sum_gb / count as f32 - mean_g * mean_b;
    let corr_rg = (cov_rg / (std_r * std_g + 1e-6)).clamp(-1.0, 1.0);
    let corr_gb = (cov_gb / (std_g * std_b + 1e-6)).clamp(-1.0, 1.0);

    let mut edge_sum = 0.0;
    let mut lap_sum = 0.0;
    let mut local_contrast = 0.0;
    let mut noise_sum = 0.0;
    let mut flat_count = 0.0;
    let mut block_boundary = 0.0;
    let mut block_non = 0.0;
    let mut block_boundary_count = 0.0;
    let mut block_non_count = 0.0;

    let w = width as usize;
    let h = height as usize;

    for y in 0..h {
        for x in 0..w {
            let idx = y * w + x;
            let center = gray[idx];

            if x + 1 < w {
                let diff = (center - gray[idx + 1]).abs();
                local_contrast += diff;
                if diff < 0.02 {
                    flat_count += 1.0;
                }
                if (x + 1) % 8 == 0 {
                    block_boundary += diff;
                    block_boundary_count += 1.0;
                } else {
                    block_non += diff;
                    block_non_count += 1.0;
                }
            }
            if y + 1 < h {
                let diff = (center - gray[idx + w]).abs();
                local_contrast += diff;
                if diff < 0.02 {
                    flat_count += 1.0;
                }
                if (y + 1) % 8 == 0 {
                    block_boundary += diff;
                    block_boundary_count += 1.0;
                } else {
                    block_non += diff;
                    block_non_count += 1.0;
                }
            }

            if x > 0 && x + 1 < w && y > 0 && y + 1 < h {
                let idx_u = idx - w;
                let idx_d = idx + w;
                let gx = -gray[idx_u - 1] - 2.0 * gray[idx - 1] - gray[idx_d - 1]
                    + gray[idx_u + 1]
                    + 2.0 * gray[idx + 1]
                    + gray[idx_d + 1];
                let gy = -gray[idx_u - 1] - 2.0 * gray[idx_u] - gray[idx_u + 1]
                    + gray[idx_d - 1]
                    + 2.0 * gray[idx_d]
                    + gray[idx_d + 1];
                edge_sum += (gx.abs() + gy.abs()) / 8.0;

                let lap = -gray[idx_u - 1]
                    - gray[idx_u]
                    - gray[idx_u + 1]
                    - gray[idx - 1]
                    + 8.0 * center
                    - gray[idx + 1]
                    - gray[idx_d - 1]
                    - gray[idx_d]
                    - gray[idx_d + 1];
                lap_sum += lap.abs() / 8.0;

                let blur = (gray[idx_u - 1]
                    + gray[idx_u]
                    + gray[idx_u + 1]
                    + gray[idx - 1]
                    + center
                    + gray[idx + 1]
                    + gray[idx_d - 1]
                    + gray[idx_d]
                    + gray[idx_d + 1])
                    / 9.0;
                noise_sum += (center - blur).abs();
            }
        }
    }

    let edge_mean = edge_sum / (count as f32);
    let lap_mean = lap_sum / (count as f32);
    let contrast_mean = local_contrast / (2.0 * count as f32);
    let noise_mean = noise_sum / (count as f32);

    let boundary_mean = if block_boundary_count > 0.0 {
        block_boundary / block_boundary_count
    } else {
        0.0
    };
    let non_mean = if block_non_count > 0.0 {
        block_non / block_non_count
    } else {
        1e-6
    };
    let blockiness = (boundary_mean / non_mean).min(2.0) / 2.0;

    let mut hist = [0.0_f32; 16];
    for &v in gray.iter() {
        let bin = (v.clamp(0.0, 0.999) * 16.0) as usize;
        hist[bin] += 1.0;
    }
    let mut entropy = 0.0;
    for h in &hist {
        if *h > 0.0 {
            let p = *h / count as f32;
            entropy -= p * p.log2();
        }
    }
    let entropy_norm = (entropy / 4.0).clamp(0.0, 1.0);

    out[0] = mean_luma;
    out[1] = (var_luma / 0.25).clamp(0.0, 1.0);
    out[2] = edge_mean.clamp(0.0, 1.0);
    out[3] = lap_mean.clamp(0.0, 1.0);
    out[4] = blockiness.clamp(0.0, 1.0);
    out[5] = mean_sat.clamp(0.0, 1.0);
    out[6] = (var_sat / 0.25).clamp(0.0, 1.0);
    out[7] = ((std_r + std_g + std_b) / 3.0).clamp(0.0, 1.0);
    out[8] = (corr_rg + 1.0) * 0.5;
    out[9] = (corr_gb + 1.0) * 0.5;
    out[10] = noise_mean.clamp(0.0, 1.0);
    out[11] = (clip_count / count as f32).clamp(0.0, 1.0);
    out[12] = contrast_mean.clamp(0.0, 1.0);
    out[13] = entropy_norm;
    out[14] = (chroma_noise / (2.0 * count as f32)).clamp(0.0, 1.0);
    out[15] = (flat_count / (2.0 * count as f32)).clamp(0.0, 1.0);
}

fn sigmoid(x: f32) -> f32 {
    if x >= 0.0 {
        let z = (-x).exp();
        1.0 / (1.0 + z)
    } else {
        let z = x.exp();
        z / (1.0 + z)
    }
}
