---
title: All Architecture Grows Out of Business Needs
date: '2026-11-13'
summary: From a frustrating AI-generated API document to shared sessions and Super-agent, tools can accelerate implementation, but people must still think through needs, rules, and responsibility. Architecture grows through solving real business problems.
ai: true
draft: false
---

Recently I read the Super-agent technical article from the DeepSeek Harness team. Then yesterday I came across another team describing their workflow: product people discuss requirements with AI, pass the same session to design, and then pass it on to development. When the model has context from the entire process, the information loss and ambiguity that come from communication between stages might become small enough to ignore.

That brought back an experience of my own. During integration, a backend developer handed me an AI-generated document. Its meaning was unclear, and it mixed in internal backend design details. It was a noisy mess that went by the name of an “API document.” Ask him about a specific issue in it, and he didn't know a damn thing—the agent had produced it all. Later, he simply told me to talk to his agent and ask it for whatever data or information I needed...

First, I don't resist the enormous changes happening to collaboration and development workflows as technology moves so quickly. Change means risk and friction, and of course it's part of progress. But I can't accept someone taking no responsibility for, and having no understanding of, something they produced for other people to use during integration.

So the idea of sharing a session across the requirements pipeline immediately struck a chord with me.

But the next thought was: that shared session is going to get very long. How do you minimize the loss of important information, and at what points should you compress the context? What happens when you want to bring in tools from other models with different strengths, or inject their execution results? And how do you manage permissions for different roles in that same session? You can't have a designer accidentally changing the requirements halfway through a conversation. Or a product person coming back to tweak a requirement and finishing the conversation with the code changed too...

If your answer is, “Won't all of that be one person's job eventually anyway? Same difference [doge],” then pretend I didn't say anything.

Back to Super-agent.

My current view of this thing we call an agent is that it replaces one key component in traditional system design and software architecture with an “infinite power core”—the LLM.

The rest of the “puppet” is still function encapsulation and reuse (tool calling), pipeline workflow design (ReAct), permission management, data cleaning, event listeners, blah blah blah.

I'm not trying to rank their importance. Super-agent, for example, combines architectural ideas according to its business scenarios, improving metrics and optimizing the design for particular situations. Coming up with that design and putting it into practice isn't easy. Distilling a huge, complex system into an accessible technical article so other engineers can learn from it deserves a fist in the air and a shout of: hell yes!

That kind of experience, where practice feeds back into teaching, might become the thing that makes everything click for me in a similar situation someday.

The cost of building a product or tool has now fallen to an all-time low. What matters is discovering a need—taking an abstract idea that people might not easily notice, thinking it through, and turning it into specific, actionable “rules.” An agent gives those rules concrete form.

When I'm developing an agent that I'll actually use day to day, and I know what I want it to achieve, the technical problems along the way hardly feel like problems. With help from Codex and Claude, I can work through them incredibly quickly, make decisions based on the current situation or an unexpected error, and immediately review and retry or take another path. It really feels like being in command of the whole operation, with a bird's-eye view of everything.

I'm good at this kind of growth: encounter a problem, solve the problem. And I enjoy it.

Most articles would be reaching for a conclusion and some grand insight by now.

A conclusion, hmm.

Keep moving until you feel resistance. Learn from the resistance, grow from what you've learned, and keep going until you can afford to take it easy.
