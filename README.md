# EntUI: a vanilla Javascript UI library (kind of)
## another product of me learning how _not_ to manage UIs and state
In my quest to create a frontend UI library from scratch, I created this "framework" while learning the important principles of state management. The goal was to create something I could use to remake [Fracture](https://github.com/tang0226/fracture), a JS fractal viewer I built with ad-hoc UI interactions. This naive implementation of interactions between components with no authoritative state manager led to serious maintainability / scalability issues. The app works, but adding features is a slog. I wanted a framework that helps organize elements to make it easier to manage interactions between UI components.

### Framework summary
This framework is meant to hydrate an existing HTML skeleton. It operates by creating a virtual tree of related entities (object wrappers for DOM elements).

I implemented a whole `ObjectPath` system that uses JS-like syntax strings to access different parts of the entity tree (e.g. `Entity.getEntity('footer.buttonGroup[0]')`).
To follow the "centralized state" paradigm, I created a top-level UI container called `EntUI`, which contains the root of a state tree (whose structure mirrors the entity tree) and mediates state changes requested from entities.

I haven't worked on this project in a while, but the last thing I was working on was implementing validators. Trying to find an effective system for organizing them and calling them from `EntUI` became quite a headache for me, so I stepped away.

### TL;DR
As it stands now, this framework is, well, nothing great. The path syntax is verbose and involved, there are no HTML templates or JSX equivalents for dynamically creating elements, event wiring is manual, rendering is manual, state management is extremely basic. All implemented in only 1,170 lines of code! :)

Still, this was a fun and interesting codebase to build, and in the process I built a parser and a testing framework from scratch, and I learned a lot about how state-of-the-art frameworks like React do their jobs so well.
