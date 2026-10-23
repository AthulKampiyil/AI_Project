# Project Work Split

This split covers the complete DCGAN Face Generator and Latent Studio repository. Each person leads one module, owns the listed files, and provides the stated research contribution. “Coordination” below means an interface dependency, not shared ownership: the listed owner remains accountable for their module.

## Ownership and research alignment

| Owner | Module | Repository scope and responsibilities | Research connection and expected evidence |
|---|---|---|---|
| **Athul** | Data pipeline, DCGAN architecture, and training | `prepare_data.py` (download/preprocess), `models.py` (Generator, Discriminator, initialization), `train.py` (training loop, optimizer/loss, checkpoints), `check_gpu.py`, and training-related entries in `requirements.txt`. Own dataset assumptions, input dimensions/normalization, architecture fidelity, training options, checkpoint compatibility, and reproducible training instructions. Supply the model/checkpoint interface to Ashar and Niranjan. | **Radford, Metz & Chintala (2015), “Unsupervised Representation Learning with Deep Convolutional Generative Adversarial Networks”** is the central design reference. Explain and verify the DCGAN convolutional architecture, BatchNorm placement, initialization, and training choices against it. **Goodfellow et al. (2014), “Generative Adversarial Nets”** grounds the adversarial objective and Generator/Discriminator training. Evidence: architecture/configuration table, training curves/checkpoints, and reproducible baseline instructions. |
| **Ashar** | Backend, inference, and service integration | `main.py` (FastAPI routes and schemas), `generate.py` (checkpoint loading and CLI generation), `demo_app.py` (legacy Gradio interface). Own model startup/loading, health reporting, image serialization, endpoint behavior, CLI modes, and service-side validation. Coordinate endpoint contracts with Abhinav (latent operations) and Abhinav-as-frontend owner (UI client). | Applies the trained generator and the latent operations in the deployed research instrument. Connects to **Radford et al. (2015)** through the generator used for synthesis; **White (2016), “Sampling Generative Networks”** where the service exposes latent sampling/interpolation; and the inversion/editing methods implemented by Niranjan. Evidence: endpoint-to-feature map, request/response examples, and documented model-loading behavior. |
| **Abhinav** | Complete web frontend | Own all of `frontend/`: `app/` pages (Studio, Morph, Match, Grid, Lab, home/layout), `components/`, `store/`, `lib/`, `public/`, styles, and frontend configuration/README (`package.json`, lockfile, Next config, TypeScript, ESLint, PostCSS). Deliver page flows, controls, visualizations, responsive navigation, API integration, and mock mode. Coordinate API semantics with Ashar and latent-control behavior with Niranjan. | The frontend makes the research questions inspectable and interactive. **White (2016)** informs the Slerp-versus-Lerp morph experience; **Heusel et al. (2017), “GANs Trained by a Two Time-Scale Update Rule…”** motivates showing FID/evaluation outputs; the latent editing/inversion features should explain the operations and limitations supplied by Niranjan. Evidence: each page mapped to its research purpose, clear labels for controls/metrics, and screenshots or a concise usage guide. |
| **Niranjan** | Latent-space methods and interpretability | `latent_ops.py` and `weights/attribute_vectors.pt`. Own Slerp/Lerp, semantic directions and factorization, norm-preserving projection, latent inversion, and tensor/image conversion helpers. Document method assumptions, input/output shapes, numerical edge cases, and the math exposed through Ashar’s API and Abhinav’s frontend. | **White (2016), “Sampling Generative Networks”** supports spherical interpolation and sampling geometry. **Goodfellow et al. (2014)** provides the GAN setting but is not evidence that edits are semantically disentangled. The project’s closed-form latent geometry analysis and norm-preserving edits should be presented as project methods/derivations, with claims bounded by the learned model and available attribute vectors. The inversion objective is test-time reconstruction optimization; describe its objective and limitations explicitly. Evidence: equations, operation examples, norm checks, interpolation comparisons, and reconstruction examples/metrics where available. |
| **Nived** | Experiments, evaluation, results, and project documentation | Own experiment orchestration and analysis scripts: `run_experiments.sh`, `run_tasks.sh`, `fid_eval.py`, `nn_check.py`, `plot_results.py`, `export_results.py`, `finish_up.py`, `wrap_up.py`. Curate `logs/` and `results/`; maintain top-level `README.md`, `PROJECT_REPORT.md`, `PROJECT_REPORT_FOR_PPT.md`, `SUBMIT.md`, `DCGAN_Course_Project_Report_Completed.docx`, `ProjectThesisTemplate.docx`, `LICENSE`, and `worksplit.md`. Verify that reported figures/metrics match artifacts; coordinate experiment settings with Athul and interpretation with the other owners. | **Heusel et al. (2017)** is the reference for FID. **Lucic et al. (2018), “Are GANs Created Equal?…”** motivates careful, fair comparison and the limits of single-seed conclusions. **Radford et al. (2015)** provides the baseline context. Report matched controls and confounds accurately (for example, width and batch size changed together in `exp_w128`; compare with `exp_bs64`). Evidence: run matrix, logs, FID outputs, plots, nearest-neighbor checks, and a report whose claims are traceable to repository artifacts. |

## Research paper reference map

| Paper | Role in this project | Primary owners |
|---|---|---|
| Radford, Metz & Chintala (2015), *Unsupervised Representation Learning with Deep Convolutional Generative Adversarial Networks* | DCGAN architecture and baseline training design | Athul; Nived for reporting |
| Goodfellow et al. (2014), *Generative Adversarial Nets* | Adversarial learning objective and theoretical GAN framing | Athul; Niranjan for method context |
| White (2016), *Sampling Generative Networks* | Latent sampling/interpolation geometry, especially Slerp | Niranjan; Abhinav for frontend presentation; Ashar for API integration |
| Heusel et al. (2017), *GANs Trained by a Two Time-Scale Update Rule…* | FID evaluation context | Nived; Athul supplies run artifacts |
| Lucic et al. (2018), *Are GANs Created Equal? A Large-Scale Study* | Experimental fairness, comparison design, and caution about run variability | Nived; Athul supplies controlled runs |

## Cross-module handoffs

1. **Athul → Ashar:** checkpoint path/keys, latent dimension, image normalization, and supported device behavior.
2. **Athul → Nived:** exact run configurations and which comparisons are controlled versus confounded.
3. **Niranjan → Ashar:** latent operation names, arguments, expected shapes/ranges, and failure behavior.
4. **Ashar → Abhinav:** stable endpoint routes, JSON/form fields, response formats, and mock-mode parity expectations.
5. **Niranjan → Abhinav:** meaning and valid ranges of edit controls, Slerp/Lerp behavior, and inversion limitations, so UI labels do not overclaim.
6. **All owners → Nived:** verified module descriptions, reproducibility notes, and evidence for the final report/submission.

## Completion expectations

- Keep changes focused within the owned paths; flag cross-module changes to affected owners before merging.
- Every research claim in the report should cite the relevant paper and point to project evidence (code, configuration, logs, metrics, or figures). A paper motivates or defines a method; it does not validate this project's result by itself.
- Keep experimental claims proportional to the available runs. In particular, identify single-seed results and avoid causal claims where multiple settings changed together.
- Data and checkpoints are generated/reproducible artifacts: Athul owns their creation and format; Nived owns evaluation/curation and clear reproduction instructions.

## Full repository coverage

The assignments cover root Python source and scripts, the entire `frontend/` application, latent attribute weights, dependencies, experiment logs, generated results, documentation, reports, and submission files. Dataset files and generated checkpoints are covered by the pipeline and reproducibility responsibilities above even when they are not committed to the repository.
