---
name: conventions
description: TypeScript/React 코드 작성 컨벤션. 코드를 작성하거나 수정하기 전에 참조한다. 네이밍, 타입, 에러 처리, React 패턴 규칙 포함.
---

# 코드 컨벤션

## 타입

- tsconfig `strict: true` 고정. `any` 금지 — `unknown`을 받아 좁혀서 쓴다.
- 외부 경계(API 응답, 폼 입력, env, URL 파라미터)는 zod 스키마가 진실의 원천이다. 타입은 `z.infer`로 파생하고, 같은 모양의 타입을 손으로 다시 정의하지 않는다.
- env는 시작 시점에 한 번 검증한다: `src/lib/env.ts`에서 `z.object({...}).parse(process.env)` 후 이 모듈만 import.
- 환경(로컬/프로덕션)마다 달라지는 베이스 URL — 매직링크·OAuth의 콜백/리다이렉트 등 — 은 정적 env에 하드코딩하지 않는다. server action·route handler에서 요청 origin(`headers().get("origin")`)을 우선 쓰고 env는 폴백으로만 둔다. 정적 env에 박으면 환경별로 값이 어긋난다(실제로 프로덕션 매직링크가 localhost로 향하는 사고가 났다).
- 타입 단언(`as`)은 테스트 코드와 라이브러리 타입 결함 보정에만. 프로덕션 로직에서 `as`가 필요하면 설계가 잘못된 신호.

## 함수와 구조

- 함수는 한 가지 일만 한다. 40줄을 넘으면 분리 신호.
- 조기 반환(early return)으로 중첩을 제거한다. 중첩 3단계 초과 금지.
- 파라미터 3개 초과 시 객체 하나로 묶는다.
- boolean 파라미터로 동작을 분기하지 않는다 (`doThing(true)` 금지) — 함수를 나눈다.

## 네이밍

- 이름이 곧 문서: `data`, `info`, `temp`, `handle` 단독 사용 금지. `handleClick`이 아니라 `submitWaitlistEmail`처럼 도메인 동사를 쓴다.
- boolean은 is/has/can 접두사. 함수는 동사로 시작, 값은 명사.
- 주석은 "왜"만 설명한다. "무엇"을 설명하는 주석이 필요하면 코드를 고친다.

## React

- 서버 컴포넌트가 기본. `"use client"`는 상호작용이 필요한 leaf 컴포넌트에만.
- 상태는 가능한 가장 낮은 곳에 둔다. 전역 상태 라이브러리(zustand, jotai 등)는 MVP에 도입 금지.
- 파생 가능한 값은 상태로 만들지 않는다. `useState` + `useEffect`로 동기화하는 패턴이 보이면 잘못된 설계 — 렌더 중 계산하거나 `useMemo`.
- 데이터 페칭은 서버 컴포넌트 또는 server action에서. 클라이언트 `useEffect` 페칭은 금지.
- props drilling이 3단계를 넘으면 컴포넌트 합성(children)으로 구조를 바꾼다. Context는 테마/세션 같은 진짜 전역에만.

## 에러 처리

- `throw`는 경계(route handler, server action)에서 잡힌다는 보장이 있을 때만. 도메인 로직의 예상 가능한 실패는 명시적 반환으로 표현한다:
  ```ts
  type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
  ```
- 사용자에게 보이는 에러 문구는 한국어로, 복구 행동을 포함한다 ("잠시 후 다시 시도해주세요" 등).
- `catch (e) {}` 빈 캐치 금지. 최소한 로깅하거나 사용자 피드백으로 변환한다.

## 테스트

- vitest, 핵심 비즈니스 로직(검증, 계산, 상태 전이)만. 커버리지 목표 없음.
- 테스트 이름은 한국어 문장으로 동작을 서술한다: `it("만료된 쿠폰은 거부한다", ...)`.
- 구현 디테일이 아니라 동작을 테스트한다. 내부 함수 호출 횟수 검증 같은 테스트 금지.

## 의존성

- 추가 전 질문: 이 기능을 50줄 이내로 직접 못 쓰는가? 쓸 수 있으면 직접 쓴다.
- date 처리 필요 시 date-fns 단건 import. lodash 전체 import 금지.
