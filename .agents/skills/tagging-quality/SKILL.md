---
name: tagging-quality
description: Evaluate and improve ITrend article tagging quality by checking canonical taxonomy, expected tags, false positives, missing tags, and regression fixtures. Use for tagging audits, tagger or prompt changes, and taxonomy decisions; do not directly rewrite production tags without explicit approval.
---

# Tagging quality

Improve tagging through an evidence-backed loop: inspect the article text and
current result, classify the error, propose the smallest correction, and add a
regression case when the behavior should remain stable.

## Establish the contract

Read `AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, and the current
tagger implementation before changing anything. Treat
`config/canonical-tags.json` as the single source of truth for stored tags.
Confirm the Collector and Server validation rules agree before recommending a
taxonomy change.

## Review an article or batch

For every reviewed article, compare the title and description with its current
tags. Report:

- current tags;
- expected tags, including an explicit “none” when appropriate;
- a short evidence phrase from the input;
- error type: missing tag, false positive, over-tagging, ambiguous taxonomy,
  insufficient input, normalization loss, model error, or persistence error;
- the smallest remedy: alias, preprocessing, prompt, taxonomy, code, or no
  change.

Do not infer a tag from general subject matter alone. A tag requires evidence in
the available title or description. Preserve zero-tag results when the input
does not support a canonical tag.

## Choose the remedy

Check deterministic causes before changing the model or prompt:

1. Was the technical term removed or truncated during input cleaning?
2. Is an exact Korean or English alias missing?
3. Is the term ambiguous and incorrectly matched by a short substring?
4. Is the expected concept absent from the canonical taxonomy?
5. Did the model return a non-canonical, excessive, or unsupported tag?
6. Did the Server reject or fail to persist a valid result?

Prefer a narrowly scoped alias or preprocessing fix when it solves the case.
Only propose a new canonical tag when existing tags cannot represent the
concept and the product scope supports adding it.

## Evaluation and regression

Use a representative fixture set covering clear single-topic articles,
multi-topic articles, short descriptions, advertising-like text, ambiguous
terms, and articles that should receive no tags. Keep expected tags and the
evidence for each fixture explicit. For a change, compare before and after
missing-tag and false-positive cases, and run the nearest Collector tests plus
`./scripts/check` when behavior changes.

When an expected tag is uncertain, label it `needs-human-decision` instead of
silently treating the model output as truth. Separate fixture or evaluation
updates from production backfills unless the user explicitly requests a
backfill.

## Safe handoff

Produce a review report before mutating stored article tags. Include sample
IDs, current and expected results, evidence, proposed files, regression tests,
and unresolved decisions. Never expose API keys or copy full sensitive article
payloads into committed fixtures. Record model name, prompt version, and
processing mode when those values are available.
