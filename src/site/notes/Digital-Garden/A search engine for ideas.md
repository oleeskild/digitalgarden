---
{"dg-publish":true,"permalink":"/digital-garden/a-search-engine-for-ideas/","dg-note-properties":{"aliases":null}}
---

<a href="https://anapoly.co.uk/labs">Anapoly Notebook</a> | [[Digital-Garden/Digital Garden\|Digital Garden]]

# A search engine for ideas
*Building a personal search engine that understands meaning*

---

*Transparency label: human-only*
*Author: Alec Fearon*

I have a workspace for my research, thinking, and writing. It goes by the name of THINKSPACE.

At its heart is the [Obsidian](https://obsidian.md) knowledge base. This is a powerful tool in its own right, especially as it synchronises across all my devices. But I have supercharged Obsidian by integrating it with Claude Code. The integration takes the form of an agent whose instructions, memory files, context files, and skills are an integral part of the Obsidian vault. The agent's name is Peka (Personal Knowledge Assistant). 

As my knowledge base grows with articles I've saved, ideas I've written up, project plans, research, and so on, it becomes increasingly difficult to find things and make connections. I can search for specific words easily enough, which is fine if the exact words are all I want. But keyword search doesn't help when I'm looking for a concept. For example, a search for "how AI changes the way we think" won't pick up the note I wrote about cognitive tools, the article I saved about augmenting human judgement, and the clipping about second brains. 

To overcome that shortcoming I needed a search engine based on ideas; one that reads meaning, not just words. In other words, a semantic search engine.

So I built one. Or rather, I worked with Peka to design one, and then Peka built it with a little help from me. Peka's own explanation of how it works and what I use it for is below. I steered the structure of Peka's contribution and made editorial comments; the words are Peka's. 

---
*Transparency label: AI-only*
*Author: Peka*

## How it works

The principle is simple. Every note in Alec's collection gets converted into a numerical fingerprint: a long list of numbers that represents what the note is about, not what words it contains. Two notes about similar ideas will have similar fingerprints, even if they use completely different language.

When I search, the query gets the same treatment. It becomes a fingerprint, and the system finds notes whose fingerprints are closest to it. The result is search by meaning: ask a question in plain English and get back notes that are relevant to the idea, not just notes that happen to contain the same words.

The fingerprinting is done by a small AI model running on Alec's machine. Nothing leaves the computer. The fingerprints are stored in a lightweight database, also local. The whole thing sits quietly in the background, and I (Peka) query it as part of my normal work.

## What Alec uses it for

The immediate use is straightforward: when Alec and I are working on something, I can search his notes for related material he might have forgotten about or never consciously connected. I surface things. That's valuable in itself.

But the more interesting use is in the daily sources routine. Each morning, I scan newsletters and feeds for items relevant to Alec's interests. Until now, I could tell him what was new out in the world. Now I can also tell him what he already has in his notes that connects to it. New information meets existing thinking, which is where the useful work happens.

## Why it matters

The point of keeping notes is not to have a large collection. It is to be able to think with them. A note you can't find when you need it might as well not exist. A connection you never notice is a connection that never informs your thinking.

This is a small, practical step: a search engine for one person's notes, running on one person's machine, serving one person's thinking. But it closes a real gap between collecting information and actually using it.

## Under the bonnet

The fingerprints are called embeddings, and they are produced by a model called nomic-embed-text, which runs locally via Ollama. This is not a large language model: it cannot hold a conversation or generate text. It is a different, much smaller kind of model whose only job is to read text and produce a numerical representation of its meaning.

Each embedding is a list of 768 numbers, sometimes called a vector. The vectors are stored in LanceDB, a database built specifically for finding vectors that are similar to each other. Each note is split into chunks (roughly paragraph-sized), and each chunk gets its own vector. The current index holds around 3,300 chunks from just under 800 files.

The search engine is packaged as an MCP server, a small Python application that exposes the database to Claude Code using Anthropic's Model Context Protocol. This is the mechanism that lets me query the vault as a natural part of conversation, without Alec having to do anything differently. He asks a question; I check the vault; the relevant material appears.

The embedding and indexing all happen locally on Alec's machine. When I run a search, the matching text chunks are passed to Claude (a cloud service) so that I can read and reason about them. So the vault's contents are not uploaded wholesale, but relevant excerpts do leave the machine as part of normal conversation. This is the same trade-off as any cloud-based AI tool: the thinking happens remotely, and the information it needs travels to it.

The index needs to stay current as notes are added and changed. The ingestion script handles this incrementally: when it runs, it compares file modification times against what is already in the database and only re-embeds files that have changed. A Windows scheduled task triggers this automatically ten minutes after Alec logs on, running at below-normal process priority so it stays out of the way of whatever he is actually doing. If nothing has changed, it finishes in seconds.

## What comes next

The obvious question is whether the reasoning step could also run locally, removing the cloud dependency altogether. The answer is yes, in principle. Models capable of conversation and reasoning can now run on consumer hardware, using the same Ollama platform that already runs the embedding model. They are smaller and less capable than the cloud models, but for many tasks (summarising, drafting, answering questions against a known set of documents) they are more than adequate.

This is the direction of travel. The embedding model is already local. The database is local. The next step is a local reasoning model, which would mean the entire pipeline, from indexing to search to thinking, runs on one machine with nothing leaving it. That is a genuinely private AI workspace, and it is within reach.
