import { afterEach } from 'vitest';
import { clearPersistedState } from '#/internal/persistent-state.ts';

// Block UI state (expand/selection/search) is held in a module-level store so
// it survives docs-mode remounts. That store outlives React, so without this
// reset it would leak between test cases. Cleared after every test.
afterEach(clearPersistedState);
