---
{"dg-publish":true,"permalink":"/test/test-note/","dg-note-properties":{}}
---


```base
views:
  - type: table
    name: All Files
  - type: table
    name: Prompts
    filters:
      and:
        - categories.contains(link("Prompts"))
  - type: table
    name: View
  - type: table
    name: Journal
    filters:
      and:
        - categories.contains(link("Journal"))
    sort:
      - property: file.name
        direction: DESC
  - type: table
    name: Local AI
    filters:
      and:
        - categories.contains(link("Local AI"))
  - type: table
    name: Lynn Fearon
    filters:
      and:
        - categories.contains(link("Lynn Fearon"))
  - type: table
    name: Claude Code
    filters:
      and:
        - categories.contains(link("Claude AI"))
  - type: table
    name: Claude Instructions
    filters:
      and:
        - categories.contains(link("Claude Instructions"))
  - type: table
    name: Family
    filters:
      and:
        - categories.contains(link("Family"))
  - type: table
    name: Victor Chambers
    filters:
      and:
        - categories.contains(link("Stanley Victor James Chambers"))
  - type: table
    name: Teach AI in 2026
    filters:
      and:
        - categories.contains("Teach AI in 2026")
  - type: table
    name: Education
    filters:
      and:
        - categories.contains(link("Education"))
    order:
      - created
      - author
      - file.name
    sort:
      - property: file.name
        direction: DESC
      - property: author
        direction: ASC
      - property: created
        direction: DESC
  - type: table
    name: The Hungary File
    filters:
      and:
        - categories.contains(link("The Hungary File"))

```
