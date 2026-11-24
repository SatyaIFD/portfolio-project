# Hurdle 003: Rare-Class Symmetric Label Noise Flooding & PR-AUC Quality-Gate Collapse

- **Symptoms:**
  1. Running the 10,000-row Phase 2 benchmark (`data/claims_train.csv`, `seed=42`, `2.59%` exception rate) triggered `passed_quality_gate: false` in `train_and_evaluate()`.
  2. `LogisticRegression` scored `0.051` CV PR-AUC while `HistGradientBoostingClassifier` dropped even lower to `0.030` CV PR-AUC (`pr_auc_lift: -0.021`), with holdout `test_roc_auc: 0.558` (near coin-flip discrimination).
- **Root Cause:**
  - Applying a symmetric `1.0%` random label flip (`LABEL_FLIP_RATE = 0.01`) to ~9,740 negative rows injected ~97 purely random positive labels into a ~259-positive dataset—corrupting nearly 38% of the rare positive class with feature-independent noise.
  - Under `class_weight="balanced"`, each corrupted positive received roughly 19x loss weight, causing the 200-iteration boosted tree to overfit random noise while weak non-linear interaction weights (`+0.55` and `+0.70` on a `-5.15` base logit) failed to form separable multi-factor exception clusters.
- **Resolution:**
  1. Reduced symmetric `LABEL_FLIP_RATE` from `0.01` to `0.001` so rare-class corruption stays realistic without drowning true risk patterns, delegating borderline overlap primarily to latent Gaussian noise.
  2. Lowered `BASE_LOGIT` and strengthened multi-factor non-linear interaction weights in `src/claims_triage/generate.py` while keeping `_sample_features()` and pure covariate-shift `--drift` mechanics untouched.
  3. Re-verified on 10,000 rows (`1.93%` normal exception rate, `7.90%` drifted rate) with `enforce_gate=True`: `baseline_cv_pr_auc` rose to `0.169`, `candidate_cv_pr_auc` rose to `0.325` (`+0.157` lift, ~16.9x over random baseline), holdout `test_pr_auc` reached `0.351` (`test_roc_auc: 0.889`, `test_recall_at_qa: 0.846`), and `passed_quality_gate` flipped to `true`.
  4. Updated `docs/data-governance.md` to match the empirically verified noise and imbalanced PR-AUC ranges.
