---
{"dg-publish":true,"permalink":"/ideaverse/references/hans-grapel/","dg-note-properties":{"created":"2026-01-09","categories":["[[ideaverse/Collection/People]]","[[ideaverse/Collection/Family]]"],"tags":null,"aliases":null,"line":"Graepel","born":"1707-04-17","born-note":"17 April 1707 per the Trump and Graepel family trees. The vault held 1704-12-07 until 30 July 2026.","birthplace":"[[ideaverse/References/Bergedorf]]","died":"1787-12-24","died-note":"Neither family tree carries a death date. 24 December 1787 at Jever was already in the vault and is kept, but its source is unknown and it needs confirming.","death-place":"[[ideaverse/References/Jever]]","living":false,"organisation":null,"marriage-date":"1732-01-25","marriage-note":null,"marriage-place":"[[ideaverse/References/Jever]]","spouse":"[[ideaverse/References/Susanna Maria Schloerholt]]","father":"[[ideaverse/References/Frans Gräpel]]","mother":null,"sources":["Graepel family - nd - history - family tree compiled by Brian and Mary Trump [not yet in the catalogue]","Graepel family - nd - history - family tree produced by the Graepel family [not yet in the catalogue]"],"provenance":"collaborative"}}
---


Hans Grapel was born at [[ideaverse/References/Bergedorf\|Bergedorf]] on 17 April 1707, the son of the brewer [[ideaverse/References/Frans Gräpel\|Frans Gräpel]], and married Susanna Maria Schloerholt at [[ideaverse/References/Jever\|Jever]] on 25 January 1732. He is the generation that moved the family from the Hamburg neighbourhood to Jever in Oldenburg, and he is the one of the early Grapels who matters to Alec's stories.

## What changed on 30 July 2026

**His father.** The `father` property named [[ideaverse/References/Franz Gräpel\|Franz Gräpel]], his grandfather, skipping a generation. It now names [[ideaverse/References/Frans Gräpel\|Frans Gräpel]], which is what Frans's own note had said all along; the two disagreed and nothing flagged it. Corrected from the Trump and Graepel family trees.

**His birth date.** 1704-12-07 in the vault against 17 April 1707 in both trees. The trees are preferred. The two dates are close enough in their digits that one may be a transposition of the other, but no source is recorded for the vault's version, so there is nothing to weigh against the trees.

**His death date.** Left as it stood, and flagged. Neither tree gives one, but the vault holds 24 December 1787 at Jever, a specific claim with a place attached that nobody invented in this pass. A silent tree is not evidence against a recorded date, so it is kept rather than deleted. At eighty it is entirely plausible. It still needs a source.

## Open questions

- **The source of the 1787 death.** The Jever burial register would confirm it or kill it.
- **The move to Jever.** Born at Bergedorf in 1707, married at Jever in 1732, so the move falls in those twenty-five years, and nothing in the vault says why. Bergedorf was a joint possession of Hamburg and Lübeck and Jever was in Oldenburg, so this is a move between states rather than between towns, and about a hundred and forty miles.
- **His mother.** Empty. His father's marriage is unrecorded, so she is unknown.
- **His brother Franz.** In the family trees with no dates. See [[ideaverse/References/Frans Gräpel\|Frans Gräpel]].
- **Other children.** Only Peter Hartwig is recorded, from a marriage of 1732.

## Children


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

```


## Siblings


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

```

