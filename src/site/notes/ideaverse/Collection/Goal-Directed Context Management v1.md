---
{"dg-publish":true,"permalink":"/ideaverse/collection/goal-directed-context-management-v1/","dg-note-properties":{"categories":["[[ideaverse/Collection/Garden]]"],"aliases":["Goal-Directed Context Management","context management","context management"],"provenance":"alec"}}
---

<a href="https://anapoly.co.uk/labs">Anapoly Notebook</a> | [[ideaverse/Collection/Digital Garden\|Digital Garden]] 

# Goal-Directed Context Management
*Version 1*  *Status: well advanced* 
_With acknowledgement to Erling S. Andersen, whose book <a href="https://www.amazon.co.uk/Goal-Directed-Project-Management-Techniques/dp/0749453346">Goal Directed Project Management</a> inspired me in 1988_

---
## Introduction

This document sets out a framework for managing a large language model such as ChatGPT (aka an AI) when it is being used as a collaborator during the production or editing of knowledge-based products. It traces a path through:

- how we manage the behaviour of a large language model (an AI);
- how we can adapt that behaviour to suit the AI's changing role over the course of work; and
- the use of project and programme management to provide the scaffolding needed to keep the AI focused and effective over the lifecycle of an information-based product. 

Finally, there are examples of the project and programme approaches applied to an information-based product.

## How do we control an AI?

### Context

To use an AI effectively, we have to configure it's behaviour to suit the purpose of our work. We do this by giving it information in the form of instructions, guidance, questions, and reference material. We put this information into the AI's context to govern how it behaves. See [[ideaverse/Collection/What is context\|What is context]] for a more detailed explanation of context. It is important to understand it well. 

To apply a standard behaviour from the AI across all chats, we use custom instructions.

During individual chats, we control the AI through prompts, the canvas, and file uploads (prompts can include instructions, guidance and questions). 

To set up the standard of behaviour for a group of chats organised as a project, we do it through project instructions.

To make information available to all chats in a project, we upload project files.

Finally, if we need the services of an AI specialist, we create a form of agent (called a GPT). We configure the agent with bespoke instructions to make its behaviour appropriate to its role, and we upload reference files to give it a knowledge base. Our agent can then be called in as necessary to provide specialist advice through chats. 

 This method of controlling the AI by putting information into its context is similar to the way we control a computer by giving it a program to run. But there is an important difference: a computer executes the instructions in its program precisely; an AI (large language model) interprets the information we give it. We should aim, therefore, to give the AI all the information it needs to avoid losing focus. A vague prompt gets a vague answer. A precise prompt with the right background information gets us something much more useful. 
 
There are similarities with the way we manage a human. The human has a store of learned knowledge to call upon, can be given instructions on how to behave during a task, can use reference material, can converse with others, and can co-edit documents with them. Like an AI, the human interprets the information obtained by these means. 

### Managing scale & complexity

As the scale or complexity of a task grows, it becomes increasingly difficult to coordinate the work of humans to achieve a common goal. To overcome this problem, we use project and programme methodologies to structure the work; these provide a form of scaffolding to let the work be carried out safely and effectively. The scaffolding is made strong and stable through a plan which - amongst other things -  divides the work into manageable packages, defines who or what will do the work, when and how it will be done, and what work outputs are required. 

Work whose purpose is well defined and carries an acceptable risk of failure can be organised as a project. The scaffolding for this takes the form of the project plan and related documentation, including external standards. Members of the project team are given roles, which can vary during the project, and assigned tasks. The detailed information they need to carry out their work successfully is held in the project scaffolding. When the work has greater scope and/or complexity, it can be organised as a programme. In this case the scaffolding is provided by the programme management plan and related documentation. 

### AI as a team member

When AI is used by a member of a project team, its characteristics make it more like an additional member of the team than a software tool. The AI, like the human, must be given roles and assigned tasks. It, too, must obtain detailed information from the project scaffolding. Unlike a human, however, the AI cannot yet go and fetch the information it needs; the human user must provide it. The human does does so by putting relevant information into the AI's context. 

Information required for input to the AI's context over the course of the project is held in a part of the project scaffolding called the contextual scaffolding. Although closely integrated with other parts of the project scaffolding, the contextual scaffolding has a distinct purpose: to hold the information - AI artefacts - needed to manage the behaviour and effectiveness of the AI over the course of the project. The contextual scaffolding is the responsibility of the project's AI manager.

Human members of a project team can have different roles at different times, and the membership of the team usually changes over the course of the project to match the need for different expertise and capabilities. The same applies to AI. It is given different roles by reconfiguring its context to change its behaviour (its *persona*) as appropriate to the task in hand. *Agents* (in the form of what OpenAI calls *GPT*s) are set up to provide different kinds of specialist knowledge when needed. Different AI's are  engaged to provide entirely different capabilities as required. 

### AI artefacts

The nature, required content, and production timetable for AI artefacts are governed by and tied to the project plan. Artefacts in the contextual scaffolding include an AI policy and an AI management plan. For an AI such as ChatGPT, there need to be:

- a bootstrap prompt to configure the AI so that it can help create the startup pack;
- an AI startup pack to configure the AI at the outset of the project, when its objective will be to help initiate the project by outlining the contextual scaffolding and assisting with the definition of AI artefacts;
- stage packs tailored to the varying uses intended for the AI over the course of the project (as with other project artefacts, these begin life in outline form and gain content as the project progresses);
- GPT packs to create the specialist AI agents that are needed;
- information packs tailored to the specific needs of any other AIs being used. 

### The art of goal-directed context management

The art of goal-directed context management is to align the AI's evolving context with the purpose and structure of the project or programme it is associated with, ensuring the AI always has the right information, at the right level of detail, to contribute effectively to the current stage of work.
## Knowledge-Based Products

A knowledge-based product is any output whose primary value lies in the information, expertise, or analysis it contains. This can include documents (books, manuals, reports, policies), structured content (training courses, standards, knowledge bases), and digital artefacts such as software, where the embedded rules, logic, and data represent codified knowledge. In all cases, the emphasis is on creating, organising, and delivering knowledge in a usable form.

Such a product has a lifecycle (see Appendix). Typically, this begins with **concept** and **feasibility**, where needs are identified and options assessed. It moves through **definition** and **development**, where requirements are set and the product is created, followed by **acceptance** and **release** to confirm and deliver the output. The product then enters **operation and maintenance**, where it is used, monitored, and updated as necessary, before ultimately reaching **retirement**, when it is withdrawn or replaced. This sequence ensures the product remains valuable and relevant throughout its existence.

A goal might be to **develop a comprehensive staff onboarding procedure** that meets compliance requirements and supports consistent training. Another might be to **create a new organisational policy framework** covering governance, ethics, and operational standards. Each can be tackled in different ways, depending on how clearly the goal is defined and how much uncertainty it contains. Two broad approaches stand out:

**Project approach** — used when the goal is well understood and can be defined with little uncertainty. Here, acceptable levels of risk to quality, cost, and time allow for a single, goal-directed project.  

**Programme approach** — used when the goal is complex or contains too much uncertainty for a single tightly-bound project to be viable. The programme comprises successive phases, each with a well-defined objective that is delivered using the project approach. Uncertainty and risk are reduced progressively through successive phases, and the programme stabilises towards a well-defined goal. 
## Project Approach

For a knowledge-based product, a typical project might have the following stages:

- **Initiation** → confirm the product’s purpose, scope, and intended audience; agree acceptance criteria; and identify resources.
    
- **Design & Planning** → define the structure, content outline, and style; create a detailed plan for producing each component of the product.
    
- **Production** → develop the content according to the plan, integrating research, drafting, and iterative review.
    
- **Verification** → check the completed product against acceptance criteria through review, testing, or validation.
    
- **Release & Closure** → finalise, publish or distribute the product, obtain sign-off, and record lessons learned for future work.
    
## Programme Approach

For a knowledge-based product, a typical programme might have the following phases.

- **Concept** → framing the problem, identifying scope, exploring high-level options.
    
- **Feasibility** → evaluating identified options for viability, value, and alignment with objectives; estimating resources, time, and risks; and selecting the preferred approach to take forward.
    
- **Definition** → specifying content requirements, structure, style, and success criteria.
    
- **Development** → creating the material, integrating research, drafting, reviewing.
    
- **Acceptance** → stakeholder review, validation of accuracy, sign-off for publication.
    
- **Operation & Maintenance** → publishing, version control, updates, ongoing relevance checks.
## Examples

### Project Approach

Here is an [[ideaverse/Collection/example of the project approach\|example of the project approach]] applied to the creation of a staff onboarding procedure. 

In the _Design & Planning_ stage of the staff onboarding procedure project, the contextual scaffolding would comprise both **persistent context** and **current context**.

The **current context** is the stage-specific working information actively loaded into the AI’s working memory — for example, the agreed structure of the onboarding document, the latest draft text, HR compliance requirements relevant to this stage, outstanding stakeholder inputs, and immediate action items. It excludes earlier exploratory materials from the Initiation stage to prevent distraction or drift.

The **persistent context** holds the enduring reference framework for the project. This includes the project instructions — overall objectives, target audience, scope boundaries, tone, and quality standards — and referenced files such as the approved project plan, HR manuals, legal guidelines, and IT setup checklists. Persistent context ensures the AI retains a clear understanding of the big picture — how the current stage connects to prior work and fits into the overall sequence toward final delivery.

### Programme Approach

Here is an [[ideaverse/Collection/example of the programme approach\|example of the programme approach]] applied to the development of a policy framework. In a programme such as this, the **volume and diversity of information** will be significantly greater than in a single project. Multiple phases will generate numerous and often lengthy documents: consultation summaries, draft policy sections, legal reviews, implementation plans, and more.

Here, **persistent context** contains the programme’s overarching objectives, governance arrangements, phase plans, and other enduring references that anchor all phases. The **current context** is tightly scoped to the phase in progress. For example, during the Definition phase, it might hold the agreed structure for the framework, key stakeholder requirements, and a shortlist of draft policy themes under development. 

Most of the programme’s working materials will be stored as **referenced files** rather than loaded directly into the current context. This approach allows the AI to retrieve and use relevant material on demand, without overloading its active workspace. By carefully selecting which elements to bring into the current context, we ensure the AI remains focused on the present phase while retaining quick access to the broader and more complex body of programme knowledge.

---

## Appendix: Knowledge-Based Product Lifecycle

A knowledge-based product life-cycle typically follows this flow:

1. **Concept** – Identify the need or opportunity and outline broad ideas for the product.
    
2. **Feasibility** – Evaluate options for viability, resource needs, and potential impact; select the best option to pursue.
    
3. **Definition** – Specify detailed requirements, structure, and quality criteria.
    
4. **Development** – Produce the product content or code, integrating research, drafting, and review.
    
5. **Acceptance** – Validate the product against agreed requirements and secure formal sign-off.
    
6. **Release** – Publish, distribute, or implement the product for its intended audience.
    
7. **Operation** – The product is used in practice; monitor for performance and relevance.
    
8. **Maintenance** – Update and refine the product to keep it accurate and effective over time.
    
9. **Retirement** – Withdraw the product when it is obsolete, replacing or archiving it as needed.