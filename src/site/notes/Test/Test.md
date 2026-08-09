---
{"dg-publish":true,"permalink":"/test/test/","dg-note-properties":{}}
---



```base
formulas:
  bornyear: if(born, born.format("YYYY"), "no born value")
  bornyear_plain: born.format("YYYY")
  born_string: born.toString()
  line_check: if(line, "has line", "no line")
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
    name: Date-named notes
    filters:
      and:
        - '/^\d{4}-\d{2}-\d{2}$/.matches(file.basename)'
    order:
      - file.name
      - file.folder
  - type: table
    name: Formula and sort test
    filters:
      and:
        - file.inFolder("References")
    order:
      - file.name
      - born
      - died
      - born-note
      - formula.bornyear
      - formula.bornyear_plain
      - formula.born_string
      - formula.line_check
    sort:
      - property: born
        direction: ASC

```
