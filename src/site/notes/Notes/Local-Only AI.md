---
{"dg-publish":true,"permalink":"/notes/local-only-ai/","dg-note-properties":{"created":"2025-12-31","categories":["[[References/Local AI]]"]}}
---

Cloud-based AIs (ChatGPT, Gemini, Claude, etc) are powerful but have drawbacks: they require per-user subscriptions, involve putting one's data into the cloud, and cannot be used off-line. We can avoid these drawbacks by running the AI locally, and recent developments make this an increasingly practicable option.

[[Notes/Apple Silicon\|Apple Silicon]] is Apple’s family of ARM-based system-on-chips. They integrate CPU, GPU, Neural Engine, and unified memory for high performance and power efficiency, enabling cooler, quieter machines. 

A single Mac Mini or Studio performs well running a moderate-size, quantised LLM. The most recent development enables these devices to be connected as a cluster with very fast memory-to-memory data transfer. A cluster of four top of the range Mac Studio devices gives high performance, energy efficient operation running 70 billion parameter LLMs.