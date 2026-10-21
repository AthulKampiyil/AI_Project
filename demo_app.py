import argparse
import os
import torch
import numpy as np
from PIL import Image
import gradio as gr

from generate import load_generator
import latent_ops

# ----------------- CLI Arguments -----------------
parser = argparse.ArgumentParser(description="DCGAN Interactive Research Lab")
parser.add_argument(
    "--ckpt",
    default="weights/generator_celeba_dcgan.pt",
    help="Path to generator checkpoint (.pt)",
)
args = parser.parse_args()

ckpt_path = args.ckpt
if not os.path.exists(ckpt_path):
    if os.path.exists("weights/generator_celeba_dcgan.pt"):
        ckpt_path = "weights/generator_celeba_dcgan.pt"
    elif os.path.exists("checkpoints/celeba_baseline/latest.pt"):
        ckpt_path = "checkpoints/celeba_baseline/latest.pt"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Loading generator on {device} from {ckpt_path}...")
G, NZ = load_generator(ckpt_path, device)
print("Loading semantic attribute vectors...")
ATTR_VECTORS = latent_ops.load_attribute_vectors(device)

# Verified Clean & High-Quality Seeds
HERO_SEEDS = {
    "⭐ Portrait 1 (Clear - Male)": 757,
    "⭐ Portrait 2 (Smiling - Male)": 979,
    "⭐ Portrait 3 (Clear - Female)": 333,
    "⭐ Portrait 4 (Warm Smile)": 42,
    "⭐ Portrait 5 (Classic Contrast)": 114,
}


# ----------------- Helper Functions -----------------
def get_latent_vector(seed: int):
    gen = torch.Generator(device="cpu").manual_seed(int(seed))
    return torch.randn(1, NZ, 1, 1, generator=gen, dtype=torch.float32).to(device)


# ----------------- Tab 1: Facial Math Studio -----------------
@torch.no_grad()
def edit_face(seed, smile_val, pose_val, gender_val, light_val):
    base_z = get_latent_vector(seed)

    v_smile = ATTR_VECTORS["smile"]
    v_pose = ATTR_VECTORS["pose"]
    v_gender = ATTR_VECTORS["gender"]
    v_light = ATTR_VECTORS["light"]

    # Compute modification
    delta = (
        float(smile_val) * v_smile
        + float(pose_val) * v_pose
        + float(gender_val) * v_gender
        + float(light_val) * v_light
    )

    # Project to the exact radius of the base vector on the Gaussian hypersphere
    # This prevents the face from getting damaged, blown out, or artifacted
    modified_z = latent_ops.project_to_sphere(base_z + delta, base_z)

    base_img = latent_ops.tensor_to_pil(G(base_z)[0], size=(384, 384))
    modified_img = latent_ops.tensor_to_pil(G(modified_z)[0], size=(384, 384))
    return base_img, modified_img


def on_preset_selected(preset_name):
    if preset_name in HERO_SEEDS:
        return HERO_SEEDS[preset_name]
    return 42


def randomize_seed():
    return np.random.randint(0, 100000)


# ----------------- Tab 2: Morphing Studio -----------------
def create_morph(seed_a, seed_b, mode, steps, fps):
    z_a = get_latent_vector(seed_a)
    z_b = get_latent_vector(seed_b)

    gif_path = f"results/morph_seed_{int(seed_a)}_{int(seed_b)}_{mode.lower()}.gif"
    latent_ops.generate_morph_animation(
        G, NZ, device, z_a, z_b, steps=int(steps), mode=mode.lower(), fps=int(fps), out_path=gif_path
    )
    html_player = latent_ops.gif_to_html_embed(gif_path, max_width=320)
    return html_player, gif_path


def run_slerp_vs_lerp(seed_a, seed_b):
    z_a = get_latent_vector(seed_a)
    z_b = get_latent_vector(seed_b)
    comparison_img = latent_ops.compare_slerp_vs_lerp(G, NZ, device, z_a, z_b, steps=7)
    return comparison_img


# ----------------- Tab 3: Photo Matcher (Inversion) -----------------
def run_inversion(input_image, opt_steps):
    if input_image is None:
        return None, None, "⚠️ Please upload or select an image first."

    orig_cropped, reconstructed, _, init_mse, final_mse = latent_ops.invert_face(
        G, NZ, device, input_image, steps=int(opt_steps), lr=0.10
    )
    pct_gain = max(0.0, (init_mse - final_mse) / (init_mse + 1e-6) * 100.0)
    status = (
        f"✅ Optimization Complete!\n"
        f"• Initial candidate error: {init_mse:.4f}\n"
        f"• Final reconstructed error: {final_mse:.4f}\n"
        f"• Error Reduction: {pct_gain:.1f}%"
    )
    return orig_cropped, reconstructed, status


# ----------------- Tab 4: Classic Grid Generator -----------------
@torch.no_grad()
def one_face():
    x = G(torch.randn(1, NZ, 1, 1, device=device))[0]
    return latent_ops.tensor_to_pil(x, size=(384, 384))


@torch.no_grad()
def sixteen_faces():
    x = G(torch.randn(16, NZ, 1, 1, device=device))
    from torchvision.utils import make_grid
    from torchvision.transforms.functional import to_pil_image

    grid = make_grid(x, nrow=4, normalize=True, value_range=(-1, 1))
    return to_pil_image(grid.cpu()).resize((512, 512), Image.Resampling.BICUBIC)


# ----------------- Gradio Interface -----------------
custom_theme = gr.themes.Soft(
    primary_hue="blue",
    secondary_hue="slate",
)

with gr.Blocks(theme=custom_theme, title="DCGAN Face Generator & Research Lab") as demo:
    gr.Markdown(
        """
        # 🔬 DCGAN Interactive Research & Interpretability Lab
        **Deep Convolutional Generative Adversarial Network (Radford et al., 2015)**
        
        *Interactive Facial Math, High-Dimensional Latent Geometry, and Neural Network Inversion.*
        """
    )

    with gr.Tabs():
        # -------- TAB 1: Facial Math Studio --------
        with gr.TabItem("🎭 Facial Math Studio"):
            gr.Markdown(
                """
                ### Facial Feature Vector Arithmetic (Radford et al., 2015)
                Modify facial attributes along learned linear directions in latent space.
                Vector lengths are projected to the hypersphere to prevent distortion.
                """
            )
            with gr.Row():
                with gr.Column(scale=1):
                    preset_dropdown = gr.Dropdown(
                        choices=list(HERO_SEEDS.keys()) + ["Custom Seed"],
                        value="⭐ Portrait 1 (Clear - Female)",
                        label="Curated High-Clarity Faces",
                    )
                    seed_input = gr.Slider(
                        minimum=0, maximum=99999, step=1, value=42, label="Face Seed"
                    )
                    random_seed_btn = gr.Button("🎲 Randomize Identity", size="sm")

                    gr.Markdown("#### Facial Feature Controls")
                    smile_slider = gr.Slider(
                        minimum=-1.5,
                        maximum=1.5,
                        step=0.1,
                        value=0.0,
                        label="Smile Intensity (Left = Serious/Neutral | Right = Smiling)",
                    )
                    pose_slider = gr.Slider(
                        minimum=-1.5, maximum=1.5, step=0.1, value=0.0, label="Head Turn / Lighting Angle"
                    )
                    gender_slider = gr.Slider(
                        minimum=-1.5, maximum=1.5, step=0.1, value=0.0, label="Hair Volume / Gender Tilt"
                    )
                    light_slider = gr.Slider(
                        minimum=-1.5, maximum=1.5, step=0.1, value=0.0, label="Overall Scene Brightness"
                    )

                    with gr.Row():
                        apply_face_btn = gr.Button("✨ Apply Changes", variant="primary")
                        reset_sliders_btn = gr.Button("🔄 Reset Sliders", size="sm")

                with gr.Column(scale=1):
                    with gr.Row():
                        base_face_display = gr.Image(label="Base Identity", type="pil")
                        edited_face_display = gr.Image(label="Sculpted Identity", type="pil")

            # Responsive events without lag (triggers upon release)
            slider_inputs = [seed_input, smile_slider, pose_slider, gender_slider, light_slider]

            preset_dropdown.change(
                on_preset_selected,
                inputs=preset_dropdown,
                outputs=seed_input,
            ).then(
                edit_face,
                inputs=slider_inputs,
                outputs=[base_face_display, edited_face_display],
            )

            random_seed_btn.click(
                randomize_seed,
                inputs=None,
                outputs=seed_input,
            ).then(
                edit_face,
                inputs=slider_inputs,
                outputs=[base_face_display, edited_face_display],
            )

            for comp in [smile_slider, pose_slider, gender_slider, light_slider]:
                comp.release(edit_face, inputs=slider_inputs, outputs=[base_face_display, edited_face_display])

            apply_face_btn.click(edit_face, inputs=slider_inputs, outputs=[base_face_display, edited_face_display])

            reset_sliders_btn.click(
                lambda: (0.0, 0.0, 0.0, 0.0),
                inputs=None,
                outputs=[smile_slider, pose_slider, gender_slider, light_slider],
            ).then(
                edit_face,
                inputs=slider_inputs,
                outputs=[base_face_display, edited_face_display],
            )

        # -------- TAB 2: Morphing Studio --------
        with gr.TabItem("🎬 Morphing Studio (Slerp vs. Lerp)"):
            gr.Markdown(
                """
                ### High-Dimensional Hypersphere Interpolation
                * **Slerp (Spherical Linear Interpolation)** travels along the curved hypersphere surface where probability is concentrated, keeping every intermediate face sharp.
                * **Lerp (Standard Linear)** cuts straight through the hollow center of the sphere, causing blurry artifacts.
                """
            )
            with gr.Row():
                with gr.Column(scale=1):
                    morph_seed_a = gr.Number(value=42, label="Person A (Seed)")
                    morph_seed_b = gr.Number(value=105, label="Person B (Seed)")
                    morph_mode = gr.Radio(
                        ["Slerp", "Lerp"],
                        value="Slerp",
                        label="Interpolation Trajectory",
                        info="Slerp = curved hypersphere surface; Lerp = Euclidean straight line.",
                    )
                    morph_steps = gr.Slider(minimum=15, maximum=35, value=20, step=5, label="Smoothness Steps")
                    morph_fps = gr.Slider(minimum=10, maximum=24, value=16, step=2, label="Playback Speed (FPS)")
                    generate_morph_btn = gr.Button("🎬 Generate Morphing Reel", variant="primary")
                    compare_theory_btn = gr.Button("📐 Compare Slerp vs. Lerp Strips")

                with gr.Column(scale=1):
                    morph_output_html = gr.HTML(label="Morphing Player")
                    morph_download_file = gr.File(label="Download Animated GIF")
                    comparison_strip_output = gr.Image(
                        label="Side-by-Side: Top Row = Lerp (Straight) | Bottom Row = Slerp (Curved)",
                        type="pil",
                    )

            generate_morph_btn.click(
                create_morph,
                inputs=[morph_seed_a, morph_seed_b, morph_mode, morph_steps, morph_fps],
                outputs=[morph_output_html, morph_download_file],
            )
            compare_theory_btn.click(
                run_slerp_vs_lerp,
                inputs=[morph_seed_a, morph_seed_b],
                outputs=comparison_strip_output,
            )

        # -------- TAB 3: Photo Matcher (GAN Inversion) --------
        with gr.TabItem("🪞 Photo Matcher (GAN Inversion)"):
            gr.Markdown(
                """
                ### Reverse-Engineering a Real Face into Latent Space
                Upload any face photo. The model freezes the Generator and optimizes the latent vector:
                $$\\mathbf{z}^* = \\arg\\min_{\\mathbf{z}} \\|G(\\mathbf{z}) - x_{\\text{target}}\\|^2$$
                """
            )
            with gr.Row():
                with gr.Column(scale=1):
                    inversion_input_img = gr.Image(label="Upload Face Photo", type="pil")
                    inversion_steps_slider = gr.Slider(
                        minimum=20, maximum=60, value=35, step=5, label="Optimization Iterations"
                    )
                    run_inversion_btn = gr.Button("🚀 Find Synthetic Twin (Invert)", variant="primary")
                    inversion_status_box = gr.Textbox(label="Optimization Diagnostics", interactive=False)

                with gr.Column(scale=1):
                    with gr.Row():
                        cropped_input_display = gr.Image(label="Cropped Target Face", type="pil")
                        inverted_output_display = gr.Image(label="DCGAN Reconstructed Twin", type="pil")

            run_inversion_btn.click(
                run_inversion,
                inputs=[inversion_input_img, inversion_steps_slider],
                outputs=[cropped_input_display, inverted_output_display, inversion_status_box],
            )

        # -------- TAB 4: Classic Grid Generator --------
        with gr.TabItem("🎲 Classic Generator"):
            gr.Markdown("### Traditional Random Generation Grid")
            with gr.Row():
                with gr.Column():
                    btn1 = gr.Button("Generate 1 Face", variant="primary")
                    out1 = gr.Image(label="Single Face", type="pil")
                with gr.Column():
                    btn2 = gr.Button("Generate 16 Faces (4x4)")
                    out2 = gr.Image(label="16 Generated Faces", type="pil")
            btn1.click(one_face, inputs=None, outputs=out1)
            btn2.click(sixteen_faces, inputs=None, outputs=out2)

    # Initial load trigger for Tab 1
    demo.load(
        edit_face,
        inputs=[seed_input, smile_slider, pose_slider, gender_slider, light_slider],
        outputs=[base_face_display, edited_face_display],
    )

if __name__ == "__main__":
    demo.launch()
