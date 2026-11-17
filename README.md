# Husky Path — updated multi-view prototype

Static HTML/CSS/JavaScript. No dependencies or build required. Open `index.html` in a browser.

## Files
- `index.html` — navigation, chatbot, editable Student Profile, Weekly Schedule, and modals.
- `chat.css` — original styles plus consistent application styles, profile form, and calendar.
- `chat.js` — original chat/recommendation/plan logic plus profile handling and weekly calendar rendering.
- `data.js` — unchanged fictional sample course and degree-audit data.

## New functionality
1. **Student Profile:** choose preferred name, major, quarter, completed courses, credit target, goals. Click Save profile. Saved in this browser's `localStorage` when available (not sent to a server).
2. **Weekly Schedule:** enter AI Assistant, request course recommendations, click Add to plan, then choose Weekly Schedule in the left navigation. Courses appear as calendar blocks Monday–Friday 8 a.m.–7 p.m. Select any block for full details. Remove courses from the schedule or the original right sidebar. Conflicts, including overlapping lecture and quiz times, appear in orange and as warnings.
3. **Visual refresh:** consistent purple, type sizing, navigation, form, cards, responsive calendar scroll.
4. **Existing functions preserved:** scripted chat, preferences, course details, course add/remove, conflicts, sample degree audit and demo URL presets.

### Limitations and data integrity
- This is **not** a live UW course system. Course descriptions, section times, seats, instructors, and degree progress in `data.js` are fictional samples.
- Chat is scripted; no AI model or live API is connected.
- Major/quarter selection does **not** verify UW program rules or whether a course runs in that quarter.
- Completed courses are excluded from demo recommendations, and the credit goal affects balanced-quarter suggestions. Goals may affect keyword-based ranking; these are not official requirements.
- The sample degree audit is a separate fictional Computer Science audit. It is not recalculated based on the editable student profile.
- Chat history and draft schedule reset on refresh; only the student profile is persisted locally.
- The schedule represents only the single sample lecture and quiz for each sample course, not alternate sections.
- The site is a local demo; do not enter sensitive personal or transcript information.

## Demo walkthrough
1. Edit and save Student Profile.
2. Navigate to AI Assistant and ask "Build a balanced 15-credit quarter" or "Find a course that counts for A&H".
3. Add courses from the response.
4. Open Weekly Schedule to inspect blocks and credit totals.
5. Add CSE 311 and DESIGN 166 to demonstrate Monday/Wednesday overlapping times.

## Existing preset links
`index.html?demo=chat`, `index.html?demo=degree`, `index.html?demo=plan`.

## Chat-first degree-planning demo (new)

Try the starter questions: **What do I still need to graduate?**, **Which quarter are these courses offered?**, and **What order should I take my remaining courses?** The chat gives a structured, conversational response. For the fictional Computer Science profile it summarizes remaining credit groups in the demo audit, proposes a clearly illustrative sequence, and explains the missing verified offering and prerequisite data. For any other major, it refuses to use the CS audit as that major's actual graduation requirements. This is a scripted prototype, **not** an AI connection or graduation clearance determination.
