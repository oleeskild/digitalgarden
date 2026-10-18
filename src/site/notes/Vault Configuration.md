---
{"dg-publish":true,"permalink":"/vault-configuration/","dg-note-properties":{}}
---

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
