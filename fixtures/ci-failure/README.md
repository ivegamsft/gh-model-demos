# CI triage

Run `npm test` (two pass, one intentional failure).
Reproduce only the first failure in `ci.log` with:
`node --test --test-name-pattern="normalizes mixed-case release names" test/release.test.mjs`.

The synthetic CI log records stable assertion data, not machine-specific timing.
The task is to propose a unified diff in JSON, not apply it to this baseline.
There is no CI configuration to change.
