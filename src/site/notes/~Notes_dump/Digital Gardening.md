---
{"dg-publish":true,"permalink":"/notes-dump/digital-gardening/","contentClasses":"cards","dg-note-properties":{"description":"Digital Gardening is a hoot with obsidian","cover":"[[assets/gardens.gif]]","cssclasses":["cards"]}}
---

## Miscrov.dev 
Welcome to my **digital garden**! This is a place where I put notes, thoughts, ideas, etc. 
This is the next step in my creation of my own website. I have chosen to use a digital garden using obsidian and the digital garden plugin to make sure that adding to the site is as **easy** as possible.

## Findings
you can find anything and everything that I've published here. obviously. Material may vary, but current plans include:
* Personal projects
* CS notes
* Dance notes and video links
* Maybe blogs and write-ups
* and more!

Of course, the site is under constant development, but I will be putting lots of random notes and ideas here as I continue to learn and build things!
## Tech Stack
```
      ┌────────┐            ┌─────────────────────────────────────┐          
      │Obsidian├────────────┤For Note Taking and website building │          
      └───┬────┘            └─────────────────────────────────────┘          
          │                 ┌──────────────────────────────────────────┐     
┌─────────▼────────────┐    │Made by: Ole Eskild Steensen.             │     
│Digital Gardens Plugin├────┤  Used to publish obsidian vault to github│     
└─────────┬────────────┘    │  as a static page website.               │     
  ┌───────▼──────────┐      └──────────────────────────────────────────┘     
  │Github Branch: dev│  ──┐ ┌───────────────────────────────────────────────┐
  └───────┬──────────┘    │ │The github setup prevents overpublishing and   │
   ┌──────▼─────────┐     ├─┤using up build minutes in cloudFlare           │
   │Github Action:  │     │ │                                               │
   │  auto-merge-dev│     │ │The plugin writes to dev, and then a github    │
   └──────┬─────────┘     │ │action merges the dev branch to main once daily│
 ┌────────▼──────────┐    │ └───────────────────────────────────────────────┘
 │Github Branch: main│  ──┘                                                  
 └────────┬──────────┘                                                       
  ┌───────▼──────────┐      ┌──────────────────────────────────────────────┐ 
  │CloudFlare Workers├──────│CloudFlare Workers is the deploy method, since│ 
  └───────┬──────────┘      │I already use them for DNS.                   │ 
          │                 └──────────────────────────────────────────────┘ 
 ┌────────▼────────────┐    ┌──────────────────┐                             
 │Public Digital Garden├────│Where you are now!│                             
 └─────────────────────┘    └──────────────────┘  
 
# made with :  https://asciiflow.com/#/                         
```

___
| Cover                       | Title             | Description |
| --------------------------- | ----------------- | ----------- |
| ![assets/Pengin.png\|100](/img/user/assets/Pengin.png) | [[Home\|Home]] | Home Link   |

{ .block-language-dataview}
[](home)
