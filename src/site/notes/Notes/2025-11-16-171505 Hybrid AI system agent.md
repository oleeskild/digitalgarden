---
{"dg-publish":true,"permalink":"/notes/2025-11-16-171505-hybrid-ai-system-agent/","title":"2025-11-16-171505 Hybrid AI system agent","dg-note-properties":{"title":"2025-11-16-171505 Hybrid AI system agent","description":null,"aliases":["agent"],"reference":null,"created":"2025-11-16","tags":null}}
---

 <a href="https://anapoly.co.uk/labs">Anapoly Notebook</a> | [[Digital-Garden/Digital Garden\|Digital Garden]] 
 
Transparency label: AI-only

---

# The Agent in a [[Notes/2025-11-16-154431 Hybrid AI systems\|Hybrid AI System]]

**The agent is a software system, not a model.**  It’s written in ordinary code (Python, Node, Go, whatever). It has modules, APIs, state management, error handling, logs, and a workflow engine. Inside that software, the agent _calls_ AI models as needed. The models are interchangeable components, not the agent itself.

A workable agent usually contains:

1. **A planning module**  
    Sometimes powered by an LLM, sometimes rule-based.  
    It decides: “Do step A, then B, check conditions, then C.”
    
2. **A tool-calling layer**  
    This is pure software. It knows how to call your CRM API, your calendar API, your SLM inference endpoint, etc.
    
3. **A state store**  
    Agents need memory of what they’ve done. That’s conventional database logic, not AI magic.
    
4. **Guardrails and policy checks**  
    Also traditional software.  
    “You’re not allowed to call the LLM unless condition X is met.”
    
5. **SLM and LLM connectors**  
    These are wrappers: take a prompt, send it to a model, get structured output back.
    
6. **Human-in-the-loop integration**  
    An approval UI, an email with a link, a dashboard.  
    Again: software.

So the agent is software that happens to employ one or more AI models. The **agent** handles control flow, safety, escalation, audit trails.