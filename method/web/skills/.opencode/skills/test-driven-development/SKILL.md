---
name: test-driven-development
description: Write tests before implementation and iterate until tests pass to ensure correct behavior
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: development
---

## What I do
- Write failing tests before implementing code
- Create comprehensive test coverage from requirements
- Iterate on implementations until all tests pass
- Refactor code while preserving test coverage
- Ensure tests validate actual behavior not just syntax
- Treat test failures as valuable information
- Maintain test suites as living documentation

## When to use me
Use this when:
- Starting a new feature or implementation
- Fixing bugs (write failing test first)
- Refactoring existing code
- Adding new functionality
- You need confidence that changes don't break existing behavior
- Implementing complex logic where edge cases matter

## How I behave
- Create test cases from requirements first, before any implementation
- Write tests that fail initially to validate requirements
- Implement minimal code to make tests pass
- Run tests continuously during development
- Refactor code while keeping tests green
- Treat test failures as information about behavior gaps
- Ensure tests cover happy paths, error cases, and edge cases

## My goals
- Implement correct behavior from the start
- Make code changes safer through regression testing
- Reduce debugging time by catching issues early
- Make refactoring fearless and safe
- Create living documentation through executable specs
- Prevent regression bugs
- Ensure code does what it's supposed to do

## The TDD cycle
1. **Red**: Write a failing test that captures a requirement
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve the code while keeping tests green
4. Repeat until all requirements are met