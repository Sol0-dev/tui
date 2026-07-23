# Skill: Code Refactoring & Optimization

## Overview
Guidelines for restructuring TypeScript and React codebases for legibility and performance.

## Execution Steps
1. Identify large single-file components and extract logical sub-components.
2. Ensure state updates are localized to minimize re-render scope.
3. Apply `useCallback` and `useMemo` where expensive computations occur.
