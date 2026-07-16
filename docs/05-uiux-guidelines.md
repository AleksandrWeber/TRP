# 05 — UI/UX Guidelines

Version: 1.1

Status: Approved

Document Type: UI/UX Philosophy & Design System

Source of truth (product/stack limits): [`CANONICAL.md`](./CANONICAL.md)

---

# Purpose

This document defines the User Experience philosophy and User Interface principles of the Trading Research Platform (TRP).

It is not a collection of visual design rules.

It is a guide for designing a professional research environment.

Every screen, component, workflow, interaction, animation, and visualization should follow these principles.

---

# Vision

TRP is not a website.

TRP is not a dashboard.

TRP is not a crypto exchange.

TRP is a **Research Operating System**.

The interface should feel like a professional engineering tool rather than a consumer application.

---

# Design Philosophy

The interface should prioritize:

Research

↓

Analysis

↓

Decision Making

↓

Knowledge

↓

Productivity

Visual appearance is important.

Understanding is mandatory.

---

# Design Goals

TRP should be:

✓ Scientific rather than speculative

✓ Explainable rather than mysterious

✓ Productive rather than decorative

✓ Calm rather than noisy

✓ Information-rich rather than minimal

✓ Professional rather than playful

✓ Modular rather than monolithic

✓ Consistent rather than surprising

✓ Fast rather than flashy

✓ Desktop-first

---

# Design Inspiration

TRP should borrow ideas—not appearance—from professional tools.

Inspirations include:

VS Code

GitHub

Linear

Notion

Grafana

Bloomberg Terminal

JetBrains IDEs

TradingView (selected concepts only)

The goal is familiarity for professionals.

---

# Core UX Principles

## Principle 1 — Information First

Information always has priority over decoration.

Every UI element must serve a purpose.

---

## Principle 2 — One Workspace, One Goal

Each workspace solves one problem.

Avoid mixing unrelated workflows.

---

## Principle 3 — Progressive Disclosure

Show only what is needed.

Advanced information should appear gradually.

Avoid overwhelming users.

---

## Principle 4 — Explain Everything

Every metric should answer:

Where did this number come from?

Why is it important?

How was it calculated?

---

## Principle 5 — Drill Down

Every summary should allow deeper investigation.

Dashboard

↓

Campaign

↓

Experiment

↓

Trade

↓

Raw Data

Nothing should become a dead end.

---

## Principle 6 — Compare Everything

Users should easily compare:

Strategies

Campaigns

Experiments

Market Regimes

Time Periods

Validation Results

Production Versions

Comparison is a primary workflow.

---

## Principle 7 — No Hidden Magic

Users must always understand:

What happened?

Why?

What changed?

Why was a recommendation generated?

Trust comes from transparency.

---

## Principle 8 — Long Sessions

Researchers may work for hours.

The interface must reduce fatigue.

---

## Principle 9 — Keyboard First

Power users should navigate without relying on the mouse.

Keyboard shortcuts should exist for common actions.

---

## Principle 10 — Desktop First

Research happens on large screens.

Desktop is the primary platform.

Mobile supports monitoring only.

---

# Workspace Philosophy

TRP is organized around Workspaces rather than Pages.

Each Workspace represents a complete research activity.

Examples:

Research Workspace

Validation Workspace

Knowledge Workspace

Production Workspace

AI Workspace

Administration Workspace

The user changes context—not applications.

---

# Navigation

Primary Navigation

↓

Workspace

↓

Explorer

↓

Inspector

↓

Details

Avoid deep nested menus.

---

# Layout Philosophy

Every workspace follows a consistent structure.

```
Header

↓

Toolbar

↓

Navigation Sidebar

↓

Main Content

↓

Inspector Panel

↓

Activity Console

↓

Status Bar
```

Users should never feel lost.

---

# Dashboard

The Dashboard answers one question:

"What is happening right now?"

It displays:

System Health

Research Activity

Running Campaigns

Validation Status

Production Status

Risk Alerts

Recent Discoveries

Pending Approvals

The dashboard is operational—not analytical.

---

# Research Workspace

Purpose:

Design and execute research.

Contains:

Campaign Explorer

Experiment Queue

Charts

Research Notes

AI Analyst

Metrics

---

# Validation Workspace

Purpose:

Evaluate robustness.

Contains:

Backtesting

Performance Metrics

Pass / Needs Review / Fail Status

Walk-Forward, Monte Carlo, stress testing, and certification views are deferred from the MVP.

---

# Knowledge Workspace

Purpose:

Explore accumulated knowledge.

Contains:

Strategy Passports

Research History

Market Memory

Reports

Knowledge Graph

Search

Relationships

---

# Production Workspace

Purpose:

Monitor live systems.

Contains:

Portfolio

Live Strategies

Orders

Risk Engine

Logs

Events

Health Monitoring

Alerts

---

# AI Workspace

Purpose:

Interact with AI.

Contains:

Research Chat

Recommendations

Pattern Discovery

Reports

Hypotheses

Explanation Center

The AI supports—not controls.

---

# Visual Hierarchy

Use typography before color.

Use spacing before borders.

Use layout before decoration.

Color is reserved for meaning.

---

# Color Philosophy

Colors communicate state.

Green

Success

Blue

Information

Orange

Warning

Red

Critical

Gray

Neutral

Avoid decorative colors.

---

# Typography

Readable.

Consistent.

Professional.

Never sacrifice readability for style.

---

# Components

Reusable components are mandatory.

Examples:

Cards

Tables

Charts

Panels

Drawers

Dialogs

Badges

Metrics

Timeline

Inspector

Explorer

Command Palette

Components must remain consistent.

---

# Tables

Tables are primary research tools.

Support:

Sorting

Filtering

Grouping

Pinning

Column Selection

Export

Search

Comparison

Tables should handle large datasets.

---

# Charts

Charts must support:

Zoom

Pan

Brush Selection

Overlay Comparison

Annotations

Crosshair

Tooltips

Export

Charts explain—not decorate.

---

# Search

Global Search is mandatory.

Users should search:

Strategies

Experiments

Reports

Campaigns

Markets

Knowledge

Logs

Documentation

Search is a first-class feature.

---

# Command Palette

A Command Palette should exist.

Examples:

Open Strategy

Create Campaign

Run Validation

Search Reports

Generate Summary

Navigate Anywhere

Inspired by VS Code.

---

# Notifications

Notifications should be meaningful.

Avoid unnecessary popups.

Prefer:

Inline feedback

Status indicators

Activity Log

Notification Center

---

# Activity Log

Every important action appears in Activity.

Examples:

Campaign Started

Validation Completed

Recommendation Generated

Deployment Approved

Experiment Failed

Nothing important happens silently.

---

# Empty States

Every empty state should teach.

Instead of:

"No Data"

Show:

Why?

How to create data?

Next recommended action.

---

# Error Handling

Errors should explain:

What happened?

Why?

What can the user do?

Avoid technical language whenever possible.

---

# Loading States

Avoid blocking interfaces.

Prefer:

Skeletons

Progress Indicators

Incremental Loading

Background Refresh

---

# Accessibility

Support:

Keyboard Navigation

Screen Readers

High Contrast

Scalable Fonts

Color Independence

Accessibility is mandatory.

---

# Responsive Design

Desktop

Primary Experience

Tablet

Supported

Mobile

Monitoring

Quick Actions

Notifications

Research is not optimized for phones.

---

# Performance

The interface should feel responsive.

Target:

Instant navigation

Lazy loading

Virtualized tables

Background synchronization

Minimal waiting

---

# Future Design Principles

The interface should continue evolving without changing its philosophy.

Future improvements must remain consistent with:

Research

Knowledge

Transparency

Explainability

Professionalism

---

# Design Checklist

Before releasing any screen ask:

Does it support research?

Is it understandable?

Can users compare information?

Can users drill into details?

Does it explain itself?

Is it consistent?

Does it reduce cognitive load?

Does it improve productivity?

If any answer is "No", redesign the screen.

---

# Final Statement

The purpose of the TRP interface is not to impress users.

Its purpose is to help researchers think, understand, validate, and make informed decisions.

A beautiful interface is valuable.

A useful interface is essential.

TRP always prioritizes usefulness over decoration.
