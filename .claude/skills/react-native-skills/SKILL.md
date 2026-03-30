---
name: vercel-react-native-skills
description:
  React Native and Expo best practices for building performant mobile apps. Use
  when building React Native components, optimizing list performance,
  implementing animations, or working with native modules. Triggers on tasks
  involving React Native, Expo, mobile performance, or native platform APIs.
license: MIT
metadata:
  author: vercel
  version: '1.0.0'
---

# React Native Skills

Comprehensive best practices for React Native and Expo applications. Contains
rules across multiple categories covering performance, animations, UI patterns,
and platform-specific optimizations.

## When to Apply

Reference these guidelines when:

- Building React Native or Expo components
- Optimizing list and scroll performance
- Implementing animations with Reanimated
- Working with images and media
- Configuring native modules or fonts

## Rule Categories by Priority

| Priority | Category         | Impact   |
| -------- | ---------------- | -------- |
| 1        | List Performance | CRITICAL |
| 2        | Animation        | HIGH     |
| 3        | Navigation       | HIGH     |
| 4        | UI Patterns      | HIGH     |
| 5        | State Management | MEDIUM   |
| 6        | Rendering        | MEDIUM   |

## Key Rules (Quick Reference)

- **Lists:** Use FlashList, memoize items, stabilize callbacks, avoid inline objects
- **Animation:** Only animate `transform` and `opacity`, use `useDerivedValue`
- **Navigation:** Use native stack and native tabs (not JS navigators)
- **Images:** Use `expo-image` for all images
- **UI:** Use `Pressable` over `TouchableOpacity`, handle safe areas
- **State:** Minimize subscriptions, use dispatcher pattern
- **Rendering:** Never render falsy `&&`, always wrap text in `<Text>`

## Full Rules

See `AGENTS.md` for the complete guide with all rules and code examples.
