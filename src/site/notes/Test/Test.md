---
{"dg-publish":true,"permalink":"/test/test/","dg-note-properties":{}}
---



```base
filters:
  and:
    - categories.contains(link("Family"))
    - categories.contains(link("People"))
    - '!file.name.contains("Template")'
formulas:
  lifespan: if(born, born.format("YYYY"), "?") + "–" + if(died, died.format("YYYY"), if(living, "living", "?"))
  age: if(born && died, ((died - born).days / 365.25).floor(), "")
properties:
  file.name:
    displayName: Person
  formula.lifespan:
    displayName: Dates
  formula.age:
    displayName: Age
  born:
    displayName: Born
  born-note:
    displayName: Birth qualified
  died:
    displayName: Died
  died-note:
    displayName: Death qualified
  birthplace:
    displayName: Born at
  death-place:
    displayName: Died at
  burial-place:
    displayName: Buried at
  father:
    displayName: Father
  mother:
    displayName: Mother
  line:
    displayName: Line
  spouse:
    displayName: Spouse
  marriage-note:
    displayName: Marriage qualified
  sources:
    displayName: Sources
views:
  - type: table
    name: Everyone
    order:
      - file.name
      - formula.lifespan
      - formula.age
      - father
      - mother
      - birthplace
    sort:
      - property: born
        direction: ASC
    columnSize:
      file.name: 260
      note.father: 200
      note.mother: 200
  - type: table
    name: By line
    groupBy:
      property: line
      direction: ASC
    order:
      - file.name
      - formula.lifespan
      - formula.age
      - father
      - mother
    sort:
      - property: file.name
        direction: DESC
      - property: father
        direction: ASC
      - property: born
        direction: ASC
    columnSize:
      file.name: 260
  - type: table
    name: Children
    filters:
      or:
        - father == this
        - mother == this
    order:
      - file.name
      - formula.lifespan
      - birthplace
    sort:
      - property: born
        direction: ASC
      - property: file.name
        direction: ASC
  - type: table
    name: Siblings
    filters:
      and:
        - file.name != this.file.name
        - or:
            - and:
                - father.isTruthy()
                - father == this.father
            - and:
                - mother.isTruthy()
                - mother == this.mother
    order:
      - file.name
      - formula.lifespan
      - father
      - mother
    sort:
      - property: born
        direction: ASC
      - property: file.name
        direction: ASC
  - type: table
    name: Needs work
    filters:
      or:
        - "!born.isTruthy()"
        - "!father.isTruthy()"
        - "!mother.isTruthy()"
        - "!died.isTruthy() && !living.isTruthy()"
    order:
      - file.name
      - formula.lifespan
      - born-note
      - died-note
      - father
      - mother
    sort:
      - property: file.name
        direction: ASC
    columnSize:
      file.name: 260
  - type: table
    name: temp
    filters:
      and:
        - file.inFolder("References")

```
