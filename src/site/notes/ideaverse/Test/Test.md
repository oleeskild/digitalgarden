---
{"dg-publish":true,"permalink":"/ideaverse/test/test/","dg-note-properties":{"categories":["[[Work]]"],"provenance":"peka"}}
---

Reproduction for Digital Garden issue #816, republished 17 August 2026 to test the template fix. View A should show one row, Hans Grapel. View B should show his birth and death dates and 1707.


```base
formulas:
  bornyear: born.format("YYYY")
views:
  - type: table
    name: A note-property filter
    filters:
      and:
        - categories.contains(link("Family"))
    order:
      - file.name
      - line
  - type: table
    name: B date columns
    filters:
      and:
        - file.inFolder("References")
    order:
      - file.name
      - born
      - died
      - formula.bornyear

```

