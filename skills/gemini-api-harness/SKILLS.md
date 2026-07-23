# Skill: Gemini API Harness Integration

## Overview
Workflow for harnessing Google GenAI models (`@google/genai`) with streaming, system prompts, and multi-turn conversations.

## Execution Steps
1. Initialize `GoogleGenAI` instance with process environment `GEMINI_API_KEY`.
2. Select target model: `gemini-3.6-flash` or `gemini-2.5-pro`.
3. Use `ai.models.generateContentStream` for real-time response rendering.
