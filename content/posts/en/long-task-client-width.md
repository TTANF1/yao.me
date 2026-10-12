---
title: "Debugging a 472ms Long Task: It Came Down to One clientWidth Line"
date: '2026-10-12'
summary: "Clicking through the Performance panel layer by layer, it ended at a width read."
ai: true
draft: false
---

> A few days ago I was typing in a Feishu doc and happened to record a Performance trace. There it was: a 472ms long task. My first thought was that the doc editor logic must be complex, and I'd be digging through business code for hours. I worked my way down DevTools layer by layer and finally stopped at one line reading `pageContainer.clientWidth`.
>
> The whole thing took less than half an hour, but a few places nearly sent me down the wrong path. I'm writing it down so the next long task I hit, I can follow the same steps.

---

## 1. Start with the overview: what were those 500ms doing

After recording, look at the overview track at the top. The red box covers about 500ms; reading top to bottom:

- The row of short red bars on top: dropped frames back to back, every one over 16.7ms;
- Gray blocks much taller than the ones on either side: the main thread CPU was busy;
- Purple and yellow under the gray: purple is Rendering (style recalc + layout), yellow is Scripting (JS).

![The 472ms long task on the overview track](/posts/long-task-client-width/perf-overview-longtask.png) _The 472ms long task on the overview track, purple Rendering mixed with yellow Scripting, main-thread CPU maxed out_

This first step ruled out the network: it wasn't a slow API, it wasn't slow resource loading. It was pure computation blocking. The tooltip right below says it directly: `Long task took 472.00 ms`, but self is only 0.14ms — the Task itself is just a shell, and the time is all in the child calls under it.

## 2. Bottom-up: a suspect list sorted by self time

Switch to the Bottom-up tab; by default it sorts by self time, high to low. The top two jumped out:

- `Layout`: 56.4ms (45.8%)
- `ssrUpdateLayout`: 56.2ms (45.6%)
- At the bottom, `appendChild`: self only 1.5ms but total 121ms (98.2%) — the entry to the whole long task was a single DOM insertion.

![Bottom-up sorted by self time](/posts/long-task-client-width/perf-bottomup.png) _Bottom-up sorted by self time, Layout and ssrUpdateLayout each around 45%_

The two self-time heavyweights add up to nearly 110ms, and the numbers are almost equal. My first reaction: was this business function calling itself, in a loop?

## 3. Call tree: first figure out who calls whom

Switch to the Call tree. The indentation rule is **parent on top, child indented below = upper layer calls lower layer**. Expand the appendChild chain:

```
Event: load
└─ Run microtasks
   └─ …bundled code…
      └─ appendChild
         └─ (anonymous)
            └─ (anonymous)
               └─ ssrUpdateLayout   ← not expanded yet
```

![Call tree before expanding](/posts/long-task-client-width/perf-calltree-collapsed.png) _The appendChild call chain before expanding, ssrUpdateLayout still a leaf node_

The direction was the opposite of what I assumed. It wasn't that ssrUpdateLayout called appendChild; it was that **appendChild's callback chain ran into ssrUpdateLayout**.

Note `Run microtasks` at the very top: the whole thing ran inside a microtask. Put that together with the appendChild context and you can guess: inserting a node triggered a MutationObserver, the observer callback was queued as a microtask, and inside that callback it called ssrUpdateLayout.

But at this point ssrUpdateLayout was a leaf node: self 0.5ms, total 63ms — and the 63ms was spent somewhere under it that I hadn't expanded yet.

## 4. Expand one more level: not a loop, a synchronous reflow

Click the arrow next to ssrUpdateLayout. It has exactly three children:

```
ssrUpdateLayout              self 0.5ms / total 63ms
├─ Layout                    self 54.7ms (86.8%)
├─ Recalculate style         self  7.4ms (11.7%)
└─ replaceMentionDocTitle    self  0.4ms
```

![Children after expanding ssrUpdateLayout](/posts/long-task-client-width/perf-calltree-expanded.png) _Three children after expanding: Layout 54.7ms, Recalculate style 7.4ms, replaceMentionDocTitle 0.4ms_

Two key facts:

1. **No appendChild showed up again, and no recursive ssrUpdateLayout** — not the loop I guessed.
2. Almost all 63ms was in the browser's rendering pipeline (Layout 54.7 + RecalcStyle 7.4 ≈ 62ms). Layout sitting directly under ssrUpdateLayout as a child means the business code **read a layout property**, forcing the browser to do a synchronous reflow.

## 5. Jump to source: it was this line

Click the `Layout` row in the Call tree and DevTools jumps straight to Sources. The highlight is on line 1126, but look one line up and it's obvious:

```js
1107  mountPoint.style.display = 'block';                  // write: layout marked dirty
1108  entryPoint && (entryPoint.style.display = 'block');  // write
...
1125  const containerWidth = pageContainer.clientWidth;     // read: forced synchronous reflow
1132  replaceMentionDocTitle();
```

![Sources pointing to the clientWidth line](/posts/long-task-client-width/perf-source-clientwidth.png) _Sources jumps to the clientWidth read on line 1125_

The full story:

1. The MutationObserver callback runs ssrUpdateLayout;
2. Lines 1107–1108 set two elements to `display: block`; the browser marks layout dirty and plans to reflow asynchronously;
3. Line 1125 immediately reads `clientWidth` — to return an accurate value, the browser has to flush the dirty layout right now. That's where the 54.7ms Layout came from;
4. With the width in hand, it continues on to call `replaceMentionDocTitle`.

## 6. Why reading a width costs 54ms

Browsers are lazy about layout by default: when you change a style, it's noted but not computed right away; the browser waits until just before the next frame and does one pass. Change ten things in a row and it still only reflows once.

But once JS reads `offsetWidth`, `clientWidth`, `getBoundingClientRect`, or similar, the browser has to give you an accurate number — so it finishes all the pending dirty layout immediately. That's **forced synchronous layout**, and writing then immediately reading is **Layout Thrashing**.

Feishu docs have a DOM tree measured in "documents": a full-document reflow costs tens of milliseconds. The cost has nothing to do with which property you read; it has to do with how dirty the layout is when you read it.

## 7. How the Performance tabs fit together

Once I'd worked through it, the division of labor across tabs was clear:

| Tab | What it does | When to use |
|---|---|---|
| Overview track | Rule out network, spot dropped frames | First look |
| Bottom-up | Sort by self time, find who spends time on itself | First cut, the suspect list |
| Call tree | Parent-child relationship in a single call chain | Trace "who calls whom", get the direction right |
| Flame chart | Width = total time, exposed solid color = self time, nesting = parent-child, left-right = time | Feel the cost distribution |
| Sources | Click an activity row to jump to source | Land on the exact line |

The easiest trap is reversing the call direction. In the Call tree and flame chart, **the upper layer is always the caller** — don't drift into thinking the lower one is the entry.

## 8. How to fix it

One rule: **don't read layout in the same synchronous context right after writing styles**.

```js
// current: read the width right after writing display
mountPoint.style.display = 'block';
entryPoint && (entryPoint.style.display = 'block');
const w = pageContainer.clientWidth;   // triggers synchronous Layout
```

Fix one: move the read into rAF, wait until the browser lays out for this frame.

```js
mountPoint.style.display = 'block';
entryPoint && (entryPoint.style.display = 'block');

requestAnimationFrame(() => {
  const w = pageContainer.clientWidth;   // layout is done by now, no synchronous reflow
  // logic depending on w goes here
});
```

Fix two (more thorough): use ResizeObserver to cache the width; business code never reads it directly.

```js
let containerWidth = pageContainer.clientWidth;
new ResizeObserver(() => {
  containerWidth = pageContainer.clientWidth;
}).observe(pageContainer);
```

Also, for a big tree like a document, add `contain: layout` to the container. Even if a synchronous read slips in later, the reflow scope is bounded, and tens of milliseconds drops to single digits.

## 9. One question I haven't fully settled: when is it over-optimization?

After writing all this, I'm actually a bit torn.

Feishu docs have a skeleton screen: when you open a link, you see the skeleton first, then the content — the wait has visual feedback. So is this 472ms long task really worth pulling out and optimizing? What's the criterion? Chase the LCP 2.5s threshold to death, or ask how soon the user should see the doc?

My current take: **a skeleton screen covers the anxiety of "waiting", but it doesn't cover "I can see it but I can't click anything" jank.**

Look back at the screenshot: the FCP and LCP markers are both after this 472ms. The user had already seen the document. Blocking the main thread at that point doesn't affect "how long the blank screen lasted" — it affects **the first input, the first scroll, the first @-mention after the content is visible**. That's not the LCP race anymore, that's INP. The user is typing into an already-open doc, the keyboard keys are down, and the main thread is still reflowing. That's the kind of jank you actually feel, and a skeleton screen doesn't help.

So the criterion might not be "is there a skeleton screen" but **what the long task is happening while the user is doing**:

- Happens during an idle loading gap, before the user starts interacting — lower priority;
- Happens on the user's input, scroll, or click path — a real problem;
- If it's a high-frequency path (this one fired on every mention insertion), even tens of milliseconds at a time adds up and is worth fixing.

Conversely, if it's a one-off and off the user's interaction path, reaching for rAF and ResizeObserver over a few tens of milliseconds may be over-optimization — the added async complexity and maintenance cost may not pay off.

What made this worth it for me wasn't killing one `clientWidth`. It was **the investigation flow itself**: overview to rule out network, Bottom-up for suspects, Call tree for direction, Sources to land on the line. It doesn't depend on business knowledge, or on knowing how Feishu docs work internally. Change the page, change the long task, and the same walkthrough still works. Performance symptoms look all different, but "look at the evidence first, then conclude" is universal.

---

> The cardinal sin in long-task debugging is guessing up front. If I'd only looked at Bottom-up where `ssrUpdateLayout` ranks second, I'd probably have concluded the business function itself was slow and gone to optimize its loop. But following Call tree and Sources to the end, it turns out that was just a "read a property" call site — the real cost was the browser being forced to reflow.
>
> Every step has evidence: overview rules out network, Bottom-up gives the list, Call tree sets the direction, Sources lands on the code. Skip any one step and the conclusion can drift.
