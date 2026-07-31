---
{"dg-publish":true,"permalink":"/test/test/","dg-note-properties":{}}
---



```base
formulas:
  bornyear: if(born, born.format("YYYY"), "no born value")
properties:
  file.path:
    displayName: Path
  file.folder:
    displayName: Folder
  line:
    displayName: Line
  categories:
    displayName: Categories
views:
  - type: table
    name: All
    order:
      - file.name
      - file.path
      - file.folder
      - line
      - categories
  - type: table
    name: In References
    filters:
      and:
        - file.inFolder("References")
    order:
      - file.name
      - file.path
      - file.folder
  - type: table
    name: Has Family category
    filters:
      and:
        - categories.contains(link("Family"))
    order:
      - file.name
      - categories
  - type: table
    name: Has line property
    filters:
      and:
        - line.isTruthy()
    order:
      - file.name
      - line
  - type: table
    name: Family via full path
    filters:
      and:
        - categories.contains(link("Categories/Family"))
    order:
      - file.name
      - categories
  - type: table
    name: Family via string
    filters:
      and:
        - categories.toString().contains("Family")
    order:
      - file.name
      - categories
  - type: table
    name: Tag test
    filters:
      and:
        - file.hasTag("references")
    order:
      - file.name
      - line
  - type: table
    name: Formula and sort test
    filters:
      and:
        - file.inFolder("References")
    order:
      - file.name
      - born
      - formula.bornyear
    sort:
      - property: born
        direction: ASC

```
