# Hurdle 002: `ColumnTransformer` Object Dtype Upcasting & Pre-Commit Ruff `UP038` Skew

- **Symptoms:**
  1. Fitting `build_preprocessor()` on the mixed-type NumPy `object` feature matrix produced an output array with `dtype=object` instead of `float64`, failing the strict `np.issubdtype(out.dtype, np.floating)` unit test.
  2. When a temporary `isinstance(cell, (int, float))` test workaround was committed, local `make all` (`uv.lock` Ruff) passed, but `.git/hooks/pre-commit` blocked the commit with Ruff error `UP038` (`Use X | Y in isinstance call instead of (X, Y)`).
- **Root Cause:**
  - Using `"passthrough"` for the boolean feature slice inside scikit-learn's `ColumnTransformer` forwarded that column directly from the `dtype=object` input matrix; horizontal stacking (`np.hstack`) then upcast the entire dense transformed matrix to `dtype=object`, which breaks downstream float-expecting estimators like `HistGradientBoostingClassifier`.
  - `.pre-commit-config.yaml` pinned `ruff-pre-commit` to `v0.11.4` (where `UP038` is active), while `uv.lock` resolved a newer Ruff release where `UP038` was retired, creating a version skew between `make all` and local Git commit hooks.
- **Resolution:**
  1. Replaced `"passthrough"` on the `"boolean"` transformer in `src/claims_triage/features.py` with a serializable top-level `FunctionTransformer(np.asarray, kw_args={"dtype": np.float64})` (avoiding unpicklable `lambda` functions for future `joblib` model serialization).
  2. Removed the `isinstance` workaround in `tests/test_features.py` and restored direct `np.issubdtype(..., np.floating)` and `np.isfinite(...).all()` assertions on the raw preprocessor output, confirming native `float64` output end-to-end.
