---
name: Keyboard dismissal bug pattern
description: React input keyboard disappears after one keystroke when component defined inside render
---
## Rule
Never define form-field components (like `const F = (props) => <input ...>`) inside the body of another component function. React treats each re-render as a new component type, unmounting/remounting the input and dismissing the keyboard.

**Why:** React's reconciler compares component identity by reference. An inline function definition creates a new reference on every render → React unmounts old component, mounts new one → focus lost, keyboard dismissed.

**How to apply:** Always extract input wrapper components to module scope (outside any other function), or pass `form`, `errors`, `onChange` as explicit props if they need parent state.
