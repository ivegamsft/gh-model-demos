# Meridian: quota-aware model dispatch design

Revision: 2026-10-01. Audience: engineering managers reviewing model usage optimization.

This document has 100 numbered sections. It records exactly three decisions, explicitly marked below. Supporting observations describe evaluation work and interface constraints, not additional adopted decisions. All workloads, counters, and tenant handles are synthetic. No external pricing or provider performance claim is made. The objective is lower consumption per accepted completion, not simply lower consumption per request.

## 1. Request admission: discovery review

The discovery review for request admission examines how to validate workload type and maximum output length. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is admitted requests per tenant. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a malformed envelope consumes capacity before validation. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 2. Tenant boundaries: discovery review

The discovery review for tenant boundaries examines how to carry the tenant identifier through every lookup. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is cross-tenant access denials. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a missing tenant key broadens the lookup scope. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 3. Model catalog: discovery review

The discovery review for model catalog examines how to record each configured model capability and context ceiling. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is catalog validation failures. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a stale context ceiling allows an oversized request. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 4. Workload profiles: discovery review

The discovery review for workload profiles examines how to separate extraction from open-ended drafting. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is accepted completions by workload. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a broad profile hides a weak extraction result. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 5. Quality sampling: discovery review

The discovery review for quality sampling examines how to compare a bounded sample with a fixed evaluation rubric. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is sample acceptance rate. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a skewed sample misses a rare failure class. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 6. Prompt assembly: discovery review

The discovery review for prompt assembly examines how to preserve stable instruction prefixes before variable inputs. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is stable prefix bytes per request. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that dynamic timestamps break otherwise identical prefixes. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 7. Context selection: discovery review

The discovery review for context selection examines how to retain only passages relevant to the stated question. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is retrieved passage count. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that unrelated passages displace the necessary evidence. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 8. Output limits: discovery review

The discovery review for output limits examines how to carry the requested answer bound into the dispatch envelope. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is generated output tokens. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that an unlimited answer spends capacity without adding acceptance. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 9. Provider adapters: discovery review

The discovery review for provider adapters examines how to normalize usage and finish reasons without discarding originals. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is adapter contract violations. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a provider-specific finish reason is silently lost. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 10. Deadline propagation: discovery review

The discovery review for deadline propagation examines how to pass the remaining request deadline through each stage. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is remaining deadline at dispatch. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a retry starts after the caller has already timed out. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 11. Routing evidence: discovery review

The discovery review for routing evidence examines how to associate every route with the workload and gate result. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is fallbacks per accepted completion. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that an unexplained route makes spend changes hard to audit. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 12. Concurrency control: discovery review

The discovery review for concurrency control examines how to track in-flight work separately from completed usage. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is active reservations per tenant. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that concurrent calls observe the same apparent free capacity. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

**Decision D1:** Route supported extraction workloads to the small model first, then use the strong model only when the fixed extraction quality gate fails. Preserve the failed attempt in usage totals. This is an adopted routing rule, not a claim that all workloads can use the smaller model.

## 13. Cache identity: discovery review

The discovery review for cache identity examines how to derive cache identity from exact request material and scope. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is exact-match cache hit rate. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that semantic similarity returns an answer for a different input. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 14. Cache expiration: discovery review

The discovery review for cache expiration examines how to record creation and expiry timestamps beside each cache entry. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is expired entries rejected. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that an old entry survives a change in the source material. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 15. Trace structure: discovery review

The discovery review for trace structure examines how to connect stage spans using a synthetic request identifier. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is traces with complete stage links. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that unlinked spans obscure the expensive stage. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 16. Usage accounting: discovery review

The discovery review for usage accounting examines how to reconcile reserved and reported token counts. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is unreconciled reservation age. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that delayed provider totals temporarily understate actual use. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 17. Budget boundaries: discovery review

The discovery review for budget boundaries examines how to keep accounting units explicit at every interface. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is requests denied by budget guard. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a unit conversion compares credits with token counts. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 18. Retry ownership: discovery review

The discovery review for retry ownership examines how to assign one retry owner for a provider call. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is attempts per logical request. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that layered retry loops multiply a single failure. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 19. Cancellation: discovery review

The discovery review for cancellation examines how to forward caller cancellation to the active adapter. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is work continuing after cancellation. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that abandoned work continues accumulating output. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 20. Evaluation storage: discovery review

The discovery review for evaluation storage examines how to store rubric version with synthetic evaluation results. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is results missing rubric versions. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a changed rubric is compared with an older score. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 21. Change rollout: discovery review

The discovery review for change rollout examines how to compare the candidate route with a stable replay cohort. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is acceptance delta in the replay cohort. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a rollout changes both model and rubric simultaneously. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 22. Incident replay: discovery review

The discovery review for incident replay examines how to reproduce a failure using sanitized recorded envelopes. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is successful offline reproductions. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that missing request metadata prevents a faithful replay. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 23. Operator views: discovery review

The discovery review for operator views examines how to display accepted completions alongside total consumption. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is cost per accepted completion. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a low spend graph conceals a rising rejection rate. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 24. Audit retention: discovery review

The discovery review for audit retention examines how to separate aggregate counters from short-lived request details. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is detail records past retention. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that request text is kept longer than the stated retention window. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 25. Capacity exercises: discovery review

The discovery review for capacity exercises examines how to replay a fixed mix of small and large envelopes. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers review the recorded requirement and identify the evidence still needed; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is queue delay under the replay mix. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a synthetic average masks the longest requests. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 26. Request admission: implementation review

The implementation review for request admission examines how to validate workload type and maximum output length. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is admitted requests per tenant. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a malformed envelope consumes capacity before validation. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 27. Tenant boundaries: implementation review

The implementation review for tenant boundaries examines how to carry the tenant identifier through every lookup. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is cross-tenant access denials. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a missing tenant key broadens the lookup scope. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 28. Model catalog: implementation review

The implementation review for model catalog examines how to record each configured model capability and context ceiling. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is catalog validation failures. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a stale context ceiling allows an oversized request. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 29. Workload profiles: implementation review

The implementation review for workload profiles examines how to separate extraction from open-ended drafting. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is accepted completions by workload. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a broad profile hides a weak extraction result. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 30. Quality sampling: implementation review

The implementation review for quality sampling examines how to compare a bounded sample with a fixed evaluation rubric. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is sample acceptance rate. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a skewed sample misses a rare failure class. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 31. Prompt assembly: implementation review

The implementation review for prompt assembly examines how to preserve stable instruction prefixes before variable inputs. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is stable prefix bytes per request. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that dynamic timestamps break otherwise identical prefixes. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

**Open risk R1:** Provider usage reports may arrive late, leaving reservation reconciliation incomplete at the daily boundary. The accounting owner will run a delayed-report replay before launch; this risk remains open.

## 32. Context selection: implementation review

The implementation review for context selection examines how to retain only passages relevant to the stated question. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is retrieved passage count. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that unrelated passages displace the necessary evidence. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 33. Output limits: implementation review

The implementation review for output limits examines how to carry the requested answer bound into the dispatch envelope. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is generated output tokens. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that an unlimited answer spends capacity without adding acceptance. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 34. Provider adapters: implementation review

The implementation review for provider adapters examines how to normalize usage and finish reasons without discarding originals. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is adapter contract violations. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a provider-specific finish reason is silently lost. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 35. Deadline propagation: implementation review

The implementation review for deadline propagation examines how to pass the remaining request deadline through each stage. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is remaining deadline at dispatch. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a retry starts after the caller has already timed out. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 36. Routing evidence: implementation review

The implementation review for routing evidence examines how to associate every route with the workload and gate result. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is fallbacks per accepted completion. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that an unexplained route makes spend changes hard to audit. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 37. Concurrency control: implementation review

The implementation review for concurrency control examines how to track in-flight work separately from completed usage. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is active reservations per tenant. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that concurrent calls observe the same apparent free capacity. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 38. Cache identity: implementation review

The implementation review for cache identity examines how to derive cache identity from exact request material and scope. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is exact-match cache hit rate. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that semantic similarity returns an answer for a different input. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 39. Cache expiration: implementation review

The implementation review for cache expiration examines how to record creation and expiry timestamps beside each cache entry. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is expired entries rejected. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that an old entry survives a change in the source material. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 40. Trace structure: implementation review

The implementation review for trace structure examines how to connect stage spans using a synthetic request identifier. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is traces with complete stage links. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that unlinked spans obscure the expensive stage. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 41. Usage accounting: implementation review

The implementation review for usage accounting examines how to reconcile reserved and reported token counts. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is unreconciled reservation age. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that delayed provider totals temporarily understate actual use. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 42. Budget boundaries: implementation review

The implementation review for budget boundaries examines how to keep accounting units explicit at every interface. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is requests denied by budget guard. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a unit conversion compares credits with token counts. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 43. Retry ownership: implementation review

The implementation review for retry ownership examines how to assign one retry owner for a provider call. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is attempts per logical request. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that layered retry loops multiply a single failure. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 44. Cancellation: implementation review

The implementation review for cancellation examines how to forward caller cancellation to the active adapter. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is work continuing after cancellation. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that abandoned work continues accumulating output. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 45. Evaluation storage: implementation review

The implementation review for evaluation storage examines how to store rubric version with synthetic evaluation results. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is results missing rubric versions. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a changed rubric is compared with an older score. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 46. Change rollout: implementation review

The implementation review for change rollout examines how to compare the candidate route with a stable replay cohort. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is acceptance delta in the replay cohort. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a rollout changes both model and rubric simultaneously. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 47. Incident replay: implementation review

The implementation review for incident replay examines how to reproduce a failure using sanitized recorded envelopes. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is successful offline reproductions. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that missing request metadata prevents a faithful replay. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 48. Operator views: implementation review

The implementation review for operator views examines how to display accepted completions alongside total consumption. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is cost per accepted completion. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a low spend graph conceals a rising rejection rate. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

**Decision D2:** Cache exact request-prefix matches for 24 hours using a content digest and tenant-scoped cache key. Never reuse cached content across tenants. Similar wording alone does not qualify as an exact match.

## 49. Audit retention: implementation review

The implementation review for audit retention examines how to separate aggregate counters from short-lived request details. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is detail records past retention. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that request text is kept longer than the stated retention window. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 50. Capacity exercises: implementation review

The implementation review for capacity exercises examines how to replay a fixed mix of small and large envelopes. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the interface boundary and its local state transitions; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is queue delay under the replay mix. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a synthetic average masks the longest requests. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 51. Request admission: verification review

The verification review for request admission examines how to validate workload type and maximum output length. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is admitted requests per tenant. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a malformed envelope consumes capacity before validation. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 52. Tenant boundaries: verification review

The verification review for tenant boundaries examines how to carry the tenant identifier through every lookup. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is cross-tenant access denials. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a missing tenant key broadens the lookup scope. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 53. Model catalog: verification review

The verification review for model catalog examines how to record each configured model capability and context ceiling. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is catalog validation failures. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a stale context ceiling allows an oversized request. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 54. Workload profiles: verification review

The verification review for workload profiles examines how to separate extraction from open-ended drafting. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is accepted completions by workload. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a broad profile hides a weak extraction result. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 55. Quality sampling: verification review

The verification review for quality sampling examines how to compare a bounded sample with a fixed evaluation rubric. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is sample acceptance rate. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a skewed sample misses a rare failure class. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 56. Prompt assembly: verification review

The verification review for prompt assembly examines how to preserve stable instruction prefixes before variable inputs. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is stable prefix bytes per request. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that dynamic timestamps break otherwise identical prefixes. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 57. Context selection: verification review

The verification review for context selection examines how to retain only passages relevant to the stated question. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is retrieved passage count. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that unrelated passages displace the necessary evidence. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 58. Output limits: verification review

The verification review for output limits examines how to carry the requested answer bound into the dispatch envelope. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is generated output tokens. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that an unlimited answer spends capacity without adding acceptance. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 59. Provider adapters: verification review

The verification review for provider adapters examines how to normalize usage and finish reasons without discarding originals. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is adapter contract violations. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a provider-specific finish reason is silently lost. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 60. Deadline propagation: verification review

The verification review for deadline propagation examines how to pass the remaining request deadline through each stage. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is remaining deadline at dispatch. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a retry starts after the caller has already timed out. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 61. Routing evidence: verification review

The verification review for routing evidence examines how to associate every route with the workload and gate result. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is fallbacks per accepted completion. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that an unexplained route makes spend changes hard to audit. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 62. Concurrency control: verification review

The verification review for concurrency control examines how to track in-flight work separately from completed usage. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is active reservations per tenant. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that concurrent calls observe the same apparent free capacity. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 63. Cache identity: verification review

The verification review for cache identity examines how to derive cache identity from exact request material and scope. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is exact-match cache hit rate. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that semantic similarity returns an answer for a different input. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 64. Cache expiration: verification review

The verification review for cache expiration examines how to record creation and expiry timestamps beside each cache entry. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is expired entries rejected. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that an old entry survives a change in the source material. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 65. Trace structure: verification review

The verification review for trace structure examines how to connect stage spans using a synthetic request identifier. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is traces with complete stage links. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that unlinked spans obscure the expensive stage. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 66. Usage accounting: verification review

The verification review for usage accounting examines how to reconcile reserved and reported token counts. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is unreconciled reservation age. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that delayed provider totals temporarily understate actual use. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 67. Budget boundaries: verification review

The verification review for budget boundaries examines how to keep accounting units explicit at every interface. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is requests denied by budget guard. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a unit conversion compares credits with token counts. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

**Open risk R2:** The extraction quality gate may miss drift on rare document layouts. The evaluation owner will extend the held-out layout sample; this risk remains open.

## 68. Retry ownership: verification review

The verification review for retry ownership examines how to assign one retry owner for a provider call. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is attempts per logical request. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that layered retry loops multiply a single failure. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 69. Cancellation: verification review

The verification review for cancellation examines how to forward caller cancellation to the active adapter. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is work continuing after cancellation. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that abandoned work continues accumulating output. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 70. Evaluation storage: verification review

The verification review for evaluation storage examines how to store rubric version with synthetic evaluation results. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is results missing rubric versions. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a changed rubric is compared with an older score. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 71. Change rollout: verification review

The verification review for change rollout examines how to compare the candidate route with a stable replay cohort. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is acceptance delta in the replay cohort. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a rollout changes both model and rubric simultaneously. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 72. Incident replay: verification review

The verification review for incident replay examines how to reproduce a failure using sanitized recorded envelopes. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is successful offline reproductions. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that missing request metadata prevents a faithful replay. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 73. Operator views: verification review

The verification review for operator views examines how to display accepted completions alongside total consumption. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is cost per accepted completion. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a low spend graph conceals a rising rejection rate. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 74. Audit retention: verification review

The verification review for audit retention examines how to separate aggregate counters from short-lived request details. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is detail records past retention. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that request text is kept longer than the stated retention window. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 75. Capacity exercises: verification review

The verification review for capacity exercises examines how to replay a fixed mix of small and large envelopes. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers replay the deterministic cases and compare the observable results; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is queue delay under the replay mix. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a synthetic average masks the longest requests. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 76. Request admission: operations review

The operations review for request admission examines how to validate workload type and maximum output length. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is admitted requests per tenant. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a malformed envelope consumes capacity before validation. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 77. Tenant boundaries: operations review

The operations review for tenant boundaries examines how to carry the tenant identifier through every lookup. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is cross-tenant access denials. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a missing tenant key broadens the lookup scope. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 78. Model catalog: operations review

The operations review for model catalog examines how to record each configured model capability and context ceiling. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is catalog validation failures. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a stale context ceiling allows an oversized request. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 79. Workload profiles: operations review

The operations review for workload profiles examines how to separate extraction from open-ended drafting. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is accepted completions by workload. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a broad profile hides a weak extraction result. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 80. Quality sampling: operations review

The operations review for quality sampling examines how to compare a bounded sample with a fixed evaluation rubric. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is sample acceptance rate. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a skewed sample misses a rare failure class. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 81. Prompt assembly: operations review

The operations review for prompt assembly examines how to preserve stable instruction prefixes before variable inputs. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is stable prefix bytes per request. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that dynamic timestamps break otherwise identical prefixes. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 82. Context selection: operations review

The operations review for context selection examines how to retain only passages relevant to the stated question. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is retrieved passage count. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that unrelated passages displace the necessary evidence. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 83. Output limits: operations review

The operations review for output limits examines how to carry the requested answer bound into the dispatch envelope. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is generated output tokens. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that an unlimited answer spends capacity without adding acceptance. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 84. Provider adapters: operations review

The operations review for provider adapters examines how to normalize usage and finish reasons without discarding originals. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is adapter contract violations. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a provider-specific finish reason is silently lost. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

**Decision D3:** Reserve each request's maximum token allowance against its tenant's daily token budget before dispatch; reject dispatch when the reservation would exceed the budget. Reconcile the reservation with reported usage afterward.

## 85. Deadline propagation: operations review

The operations review for deadline propagation examines how to pass the remaining request deadline through each stage. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is remaining deadline at dispatch. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a retry starts after the caller has already timed out. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 86. Routing evidence: operations review

The operations review for routing evidence examines how to associate every route with the workload and gate result. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is fallbacks per accepted completion. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that an unexplained route makes spend changes hard to audit. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 87. Concurrency control: operations review

The operations review for concurrency control examines how to track in-flight work separately from completed usage. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is active reservations per tenant. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that concurrent calls observe the same apparent free capacity. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 88. Cache identity: operations review

The operations review for cache identity examines how to derive cache identity from exact request material and scope. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is exact-match cache hit rate. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that semantic similarity returns an answer for a different input. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 89. Cache expiration: operations review

The operations review for cache expiration examines how to record creation and expiry timestamps beside each cache entry. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is expired entries rejected. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that an old entry survives a change in the source material. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 90. Trace structure: operations review

The operations review for trace structure examines how to connect stage spans using a synthetic request identifier. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is traces with complete stage links. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that unlinked spans obscure the expensive stage. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 91. Usage accounting: operations review

The operations review for usage accounting examines how to reconcile reserved and reported token counts. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is unreconciled reservation age. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that delayed provider totals temporarily understate actual use. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 92. Budget boundaries: operations review

The operations review for budget boundaries examines how to keep accounting units explicit at every interface. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is requests denied by budget guard. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a unit conversion compares credits with token counts. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

**Explicitly deferred:** Active-active multi-region dispatch is outside this release. The platform owner will revisit it after a single-region capacity exercise; no delivery date is stated.

## 93. Retry ownership: operations review

The operations review for retry ownership examines how to assign one retry owner for a provider call. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is attempts per logical request. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that layered retry loops multiply a single failure. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 94. Cancellation: operations review

The operations review for cancellation examines how to forward caller cancellation to the active adapter. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is work continuing after cancellation. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that abandoned work continues accumulating output. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 95. Evaluation storage: operations review

The operations review for evaluation storage examines how to store rubric version with synthetic evaluation results. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is results missing rubric versions. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a changed rubric is compared with an older score. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 96. Change rollout: operations review

The operations review for change rollout examines how to compare the candidate route with a stable replay cohort. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is acceptance delta in the replay cohort. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a rollout changes both model and rubric simultaneously. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 97. Incident replay: operations review

The operations review for incident replay examines how to reproduce a failure using sanitized recorded envelopes. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is successful offline reproductions. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that missing request metadata prevents a faithful replay. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 98. Operator views: operations review

The operations review for operator views examines how to display accepted completions alongside total consumption. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is cost per accepted completion. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a low spend graph conceals a rising rejection rate. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 99. Audit retention: operations review

The operations review for audit retention examines how to separate aggregate counters from short-lived request details. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is detail records past retention. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that request text is kept longer than the stated retention window. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

## 100. Capacity exercises: operations review

The operations review for capacity exercises examines how to replay a fixed mix of small and large envelopes. The working session uses the same synthetic tenant cohort as the surrounding sections, so a change in observed consumption can be compared with accepted task outcomes rather than with unrelated traffic. Reviewers inspect the runbook entry and the associated diagnostic counters; this activity gathers evidence and does not adopt a new architecture choice.

The interface sketch carries a tenant handle, workload name, input digest, deadline, and requested output ceiling. Each field has a named producer and consumer in the replay harness. For this topic, the reviewer checks the handoff immediately before and after the relevant stage. Missing fields are reported as missing evidence rather than silently reconstructed from provider defaults or from the text of another request.

The diagnostic counter is queue delay under the replay mix. A replay record includes its numerator, denominator where applicable, sampling interval, and rubric version. Counts are compared only across equivalent workload mixes. A shorter answer is not automatically an accepted answer, and a rejected completion remains part of total consumption. The review worksheet therefore shows both total reported usage and the number of completions that satisfy the fixed rubric.

The failure exercise for this section is that a synthetic average masks the longest requests. The exercise injects the condition at one boundary while leaving the other stages unchanged. The trace is then inspected for the first divergence from the reference replay. This isolates the interface under discussion without implying that the same symptom in a live system would establish a unique cause. No provider call is required for the exercise.

The local example uses cohort amber, with extraction requests containing short tabular records and drafting requests containing longer narrative passages. Their observations are kept separate because input length and acceptance criteria differ. A reviewer records whether the evidence includes a successful case, a refused case, and an interrupted case. Missing cases are listed in the worksheet; they are not replaced with estimates or with an assumed successful outcome.

