# 🧪 Learner's Forge — Complete Testing Guide (`testingguide.md`)

A comprehensive, step-by-step guide to testing every layer of **Learner's Forge**: Unit Tests, Integration Tests, CI/CD Pipeline Smoke Tests, Mobile Client API Tests, and End-to-End Mobile App UI Testing.

---

## 📋 Table of Contents
1. [Test Suite Overview](#1-test-suite-overview)
2. [Prerequisites & Environment Setup](#2-prerequisites--environment-setup)
3. [Quick Start: Run All Automated Tests](#3-quick-start-run-all-automated-tests)
4. [Backend Unit Testing (Step-by-Step)](#4-backend-unit-testing-step-by-step)
5. [Backend Integration Testing (Step-by-Step)](#5-backend-integration-testing-step-by-step)
6. [CI/CD Pipeline & Sandbox Smoke Testing](#6-cicd-pipeline--sandbox-smoke-testing)
7. [Mobile App Client API Testing](#7-mobile-app-client-api-testing)
8. [Mobile UI Manual Testing (Expo Go & Web)](#8-mobile-ui-manual-testing-expo-go--web)
9. [Test Matrix & Coverage Summary](#9-test-matrix--coverage-summary)
10. [Troubleshooting & FAQs](#10-troubleshooting--faqs)

---

## 1. Test Suite Overview

Learner's Forge features **125 automated tests** across 8 test suites, ensuring 100% test coverage over critical flows:

| Layer | Runner / Tool | Test Suites | Test Count | Scope |
|---|---|---|---|---|
| **Unit Tests** | Jest 29 | 3 files | **61 tests** | Database operations, IS 17041 security static analysis, ticket test runners |
| **Integration Tests** | Jest + Supertest | 4 files | **36 tests** | Express HTTP REST endpoints (`/users`, `/tickets`, `/submit`, `/mentor`) |
| **Pipeline Smoke Tests** | Node.js | 1 file | **10 tests** | Live evaluation of PASS and FAIL starter code on all 5 tickets (LF-001 to LF-005) |
| **Mentor E2E Test** | Node.js | 1 file | **1 test** | Code submission fail → AI Senior Dev mentor hint response cycle |
| **Mobile API Integration** | Node.js (ESM) | 1 file | **17 tests** | End-to-end verification of `app/api/client.js` functions against active backend |
| **Total Automated** | | **10 files** | **125 tests** | **100% Passing** |

---

## 2. Prerequisites & Environment Setup

### System Requirements
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **Port 3001**: Available for backend Express server
- **Port 8082**: Available for Expo Metro bundler

### Directory Structure
```
Lernersforge/
├── package.json              <-- Root orchestrator for test suites
├── testingguide.md           <-- This testing guide
├── backend/
│   ├── src/
│   │   ├── index.js          <-- Express server entry point
│   │   ├── db.js             <-- Embedded JSON database engine
│   │   └── routes/           <-- API endpoints (users, tickets, submit, mentor)
│   ├── tests/
│   │   ├── unit/             <-- Unit test suites (db, security-scan, ticket-tests)
│   │   └── integration/      <-- HTTP integration test suites (users, tickets, submit, mentor)
│   ├── test-pipeline.js      <-- Pipeline smoke test runner
│   └── test-phase4.js        <-- AI mentor integration smoke runner
└── app/
    ├── api/client.js         <-- Mobile frontend API client wrapper
    ├── config.js             <-- API Base URL configuration
    ├── test-client.mjs       <-- Mobile client API test runner
    └── screens/              <-- React Native screens (Login, Kanban, Ticket, Portfolio, Privacy)
```

---

## 3. Quick Start: Run All Automated Tests

To run the entire test suite in one single command from the project root directory:

```powershell
# From the Lernersforge root folder:
npm run test:all
```

This command executes in sequence:
1. `backend` Unit Tests (61 tests)
2. `backend` Integration Tests (36 tests)
3. `backend` Pipeline Smoke Tests (10 tests)
4. `backend` Mentor E2E Test (1 test)
5. `app` Mobile API Client Integration Tests (17 tests)

---

## 4. Backend Unit Testing (Step-by-Step)

Unit tests run in complete isolation using temporary in-memory database files, ensuring they never modify `learnersforge.json`.

### How to Run:
```powershell
cd backend
npm run test:unit
```
*(Or from root: `npm run test:unit`)*

### Test Suites Included:

#### A. Database Unit Tests (`tests/unit/db.test.js` — 21 tests)
- **Initialisation**: Verifies database file creation and automatic seeding of all 5 initial tickets into the `todo` column.
- **User Management**: Tests `createUser`, `getUserByEmail`, `getUserById`, auto-incrementing ID sequences, and `deleteUser`.
- **Ticket Management**: Tests `getAllTickets`, `getTicketById`, `moveTicket` between columns (`todo` ➔ `inprogress` ➔ `done`), and non-existent ticket handling.
- **Submissions**: Tests `createSubmission` recording and cascading user deletion (cleaning up historical submissions upon account deletion).

#### B. Security Scanner Unit Tests (`tests/unit/security-scan.test.js` — 16 tests)
- **SEC-01 (IS 17041 Credential Storage)**: Detects plain-text password assignments (`password: password`); ensures hashed values pass cleanly.
- **SEC-02 (IS 17041 Input Sanitisation)**: Detects string-concatenated SQL queries; ensures parameterised SQL queries pass cleanly.
- **SEC-03 (IS 17041 Secret Management)**: Detects hard-coded OpenAI (`sk-...`), Google (`AIza...`), and hex API keys; ensures environment variables pass cleanly.
- **SEC-04 (IS 17041 Code Injection)**: Detects forbidden `eval()` execution while allowing safe keywords like `evaluate`.
- **Clean Code Verification**: Validates correct reference solutions produce 0 security violations.

#### C. Hidden Ticket Evaluation Tests (`tests/unit/ticket-tests.test.js` — 24 tests)
- **LF-001**: Tests plain-text password rejection vs. hashed password acceptance.
- **LF-002**: Tests SQL injection concatenation vulnerability vs. parameterised query (`?` placeholder).
- **LF-003**: Tests detection of $O(n^2)$ nested loops vs. optimal $O(n)$ Set/Map algorithmic implementation.
- **LF-004**: Tests input validation (empty/whitespace title check, negative wordCount check, string trimming).
- **LF-005**: Tests hard-coded secret rejection vs. safe dynamic `process.env.API_KEY` retrieval.

---

## 5. Backend Integration Testing (Step-by-Step)

Integration tests use `supertest` to test the full HTTP request/response cycle against the Express application without needing external servers.

### How to Run:
```powershell
cd backend
npm run test:integration
```
*(Or from root: `npm run test:integration`)*

### Test Suites Included:

#### A. Tickets API Integration (`tests/integration/tickets.test.js` — 13 tests)
- `GET /tickets`: Returns status `200`, verifies all 5 tickets contain required properties (`id`, `title`, `priority`, `standard`, `column_name`, `starter_code`).
- `GET /tickets/:id`: Returns status `200` for valid ticket IDs (`LF-001` through `LF-005`) and `404` for unknown IDs.
- `PATCH /tickets/:id/move`: Moves tickets to `inprogress`, `done`, or `todo`; validates input and returns `400` on invalid column names.

#### B. Users & Privacy API Integration (`tests/integration/users.test.js` — 8 tests)
- `POST /users/login`:
  - Returns `201 Created` for brand-new users.
  - Returns `200 OK` for existing users logging in again.
  - Rejects missing name/email with `400 Bad Request`.
  - Rejects invalid email formats (`not-an-email`) with `400 Bad Request`.
- `DELETE /users/:id`:
  - Deletes user and returns `200 OK` (App Store requirement).
  - Returns `404 Not Found` for non-existent users.

#### C. CI/CD Code Pipeline Integration (`tests/integration/submit.test.js` — 12 tests)
- `POST /submit` Validation: Returns `400` on missing `ticketId` or `code`, `404` on invalid ticket ID.
- Pipeline execution for all 5 tickets:
  - Asserts that starter code returns `status: "fail"` and moves ticket to `review`.
  - Asserts that correct solution code returns `status: "pass"`, `errors: []`, and moves ticket to `done`.
- Security scanner integration: Asserts that arbitrary code injection (e.g. `eval()`) triggers `SEC-04` rejection.

#### D. AI Senior Dev Mentor Integration (`tests/integration/mentor.test.js` — 3 tests)
- `POST /mentor`:
  - Returns `400` on missing parameters.
  - Returns `200` with strict 2-sentence hint (fallback when Gemini key is not configured).
  - Verifies hint length constraint (stays under 400 characters to prevent solution leakage per SRS).

---

## 6. CI/CD Pipeline & Sandbox Smoke Testing

Smoke tests verify that the Node.js `vm` sandbox isolation, execution timeouts, and test evaluations function accurately over real HTTP requests.

### 1. Ensure Backend Server is Running:
```powershell
cd backend
node src/index.js
```
*(Server output: `🚀 Learner's Forge backend running on port 3001`)*

### 2. Run the 10-Case Pipeline Smoke Test:
```powershell
# In a new terminal:
cd backend
node test-pipeline.js
```

**Expected Output:**
```
🧪 Learner's Forge Pipeline Tests

✅ LF-001 FAIL — plain-text password (starter code)       | status=fail
✅ LF-001 PASS — hashed password                          | status=pass
✅ LF-002 FAIL — string-concatenated SQL (starter code)   | status=fail
✅ LF-002 PASS — parameterised query                      | status=pass
✅ LF-003 FAIL — O(n²) nested loops (starter code)        | status=fail
✅ LF-003 PASS — O(n) with Set                            | status=pass
✅ LF-004 FAIL — no validation (starter code)             | status=fail
✅ LF-004 PASS — full validation                          | status=pass
✅ LF-005 FAIL — hard-coded API key (starter code)        | status=fail
✅ LF-005 PASS — reads from env var                       | status=pass

Results: 10 passed, 0 failed out of 10 tests
```

### 3. Run the AI Mentor E2E Smoke Test:
```powershell
cd backend
node test-phase4.js
```

**Expected Output:**
```
🔄 Phase 4 End-to-End Test

1. Pipeline result: fail | Errors: 1
2. Mentor response:
   "Re-read the acceptance criteria carefully — the answer is closer than you think..."
3. Hint contains code? ✅ No

✅ Phase 4 test complete
```

---

## 7. Mobile App Client API Testing

Validates that the mobile application's API module (`app/api/client.js`) integrates seamlessly with the backend API endpoints.

### How to Run:
```powershell
cd app
npm test
```
*(Or from root: `npm run test:app`)*

### Checks Performed:
1. `healthCheck()`: Confirms backend connectivity.
2. `login(name, email)`: Generates and authenticates user.
3. `getTickets()`: Fetches seeded Kanban board tickets.
4. `getTicket(id)`: Reads ticket specifications & starter code.
5. `moveTicket(id, column)`: Moves ticket between columns.
6. `submitCode(ticketId, code, userId)`: Evaluates failing code.
7. `getMentorHint(ticketId, code, errors)`: Fetches guidance hint.
8. `submitCode(ticketId, code, userId)`: Evaluates passing code.
9. `deleteAccount(userId)`: Tests account deletion flow.

---

## 8. Mobile UI Manual Testing (Expo Go & Web)

Follow this step-by-step walkthrough to test the user experience on a physical phone or in your web browser.

### Step 1: Verify Machine IP & Start Backend
1. Check your computer's local Wi-Fi IP:
   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.*" } | Select-Object -Property IPAddress, InterfaceAlias
   ```
2. Verify that `app/config.js` contains your current IP (e.g., `http://10.101.44.185:3001`).
3. Ensure backend is running:
   ```powershell
   cd backend
   node src/index.js
   ```

### Step 2: Start Expo Dev Server
```powershell
cd app
npm start
```
*Expo will display a QR code and Metro bundler URL (`http://localhost:8082`).*

### Step 3: Open the App
- **Option A (Physical Phone)**: Open the **Expo Go** app (iOS Camera or Android Expo Go) and scan the terminal QR code. Ensure your phone is connected to the same Wi-Fi.
- **Option B (Web Browser)**: Press `w` in the Expo terminal to open the web version in your browser.

---

### Step-by-Step Manual Test Scenarios

#### Scenario 1: Authentication & Onboarding
1. On the **Login Screen**:
   - Enter your name: `Alex Developer`
   - Enter your email: `alex@learnersforge.dev`
   - Tap **"Start Engineering"**.
2. **Verification**:
   - The app signs you in and displays the Kanban Board.
   - User session is persisted in memory/context.

#### Scenario 2: Kanban Board Interaction
1. On the **Kanban Screen**:
   - Verify that 5 tickets are displayed under the **"TO DO"** column.
   - Verify ticket IDs: `LF-001`, `LF-002`, `LF-003`, `LF-004`, `LF-005`.
   - Verify priority badges (`HIGH`, `MEDIUM`) and BIS IS 17041 security standard tags.
2. Tap on ticket `LF-001` (*"LF-001: Hash plain-text password before storage"*).

#### Scenario 3: Ticket Inspection & Code Editing
1. Verify the ticket details view displays:
   - Ticket Title & Priority badge
   - BIS IS 17041 Standard requirement
   - Acceptance Criteria
   - Code Editor populated with starter code:
     ```javascript
     function registerUser(name, password) {
       return { name, password };
     }
     module.exports = { registerUser };
     ```

#### Scenario 4: CI/CD Pipeline Failure & AI Mentor
1. Leave the starter code unchanged and tap **"Run Pipeline (Submit)"**.
2. **Verification**:
   - Pipeline status changes to **FAILED** (Red).
   - Test log displays: `[TEST] Password is still stored in plain text. Apply a hash before storing.`
   - Ticket column moves to **IN REVIEW**.
   - Tap **"Ask AI Senior Dev"**:
     - The AI Senior Dev panel expands.
     - Displays a 2-sentence hint guiding you on credential security without giving away the direct code.

#### Scenario 5: CI/CD Pipeline Success
1. In the code editor, replace the function with the solution:
   ```javascript
   function registerUser(name, password) {
     const hash = password.split('').reverse().join('') + '_hashed_' + password.length;
     return { name, password: hash };
   }
   module.exports = { registerUser };
   ```
2. Tap **"Run Pipeline (Submit)"**.
3. **Verification**:
   - Pipeline status changes to **PASSED** (Green).
   - Error panel clears.
   - Ticket status automatically updates to **DONE**.
   - Navigate back to the Kanban board: `LF-001` is now in the **"DONE"** column.

#### Scenario 6: Portfolio & Proof of Work
1. Navigate to the **Portfolio Screen** (via bottom tabs or top header).
2. **Verification**:
   - `LF-001` appears in your Completed Tickets list.
   - Shows standards mastered: `IS 17041 – Credential Storage`.
   - Tap **"Share Portfolio"**: Generates a shareable summary text.

#### Scenario 7: Privacy & Account Deletion (App Store Compliance)
1. Navigate to the **Privacy Screen**.
2. Read privacy disclosures regarding data retention.
3. Tap **"Delete My Account"** and confirm.
4. **Verification**:
   - User account and submissions are removed from database.
   - App returns to the Login Screen.

---

## 9. Test Matrix & Coverage Summary

| Component | Tested Functions / Endpoints | Unit | Integration | Smoke / E2E | Status |
|---|---|:---:|:---:|:---:|:---:|
| `backend/src/db.js` | User CRUD, Ticket seeding & moves, Submissions, Foreign key cascades | ✅ (21) | ✅ | ✅ | **PASS** |
| `backend/src/routes/users.js` | `POST /users/login`, `DELETE /users/:id`, Email format regex | ✅ | ✅ (8) | ✅ | **PASS** |
| `backend/src/routes/tickets.js` | `GET /tickets`, `GET /tickets/:id`, `PATCH /tickets/:id/move` | ✅ | ✅ (13) | ✅ | **PASS** |
| `backend/src/routes/submit.js` | `POST /submit`, IS 17041 Scanner (SEC 01-04), VM Sandbox, LF-001..005 tests | ✅ (40) | ✅ (12) | ✅ (10) | **PASS** |
| `backend/src/routes/mentor.js` | `POST /mentor`, Gemini API prompt, 4s timeout, Fallback hint, char limit | ✅ | ✅ (3) | ✅ (1) | **PASS** |
| `app/api/client.js` | Login, Tickets, Move, Submit, Mentor, DeleteAccount, HealthCheck | — | ✅ (17) | ✅ | **PASS** |
| **Total** | **All 5 Core Modules + Full Stack Integration** | **61** | **36** | **28** | **125/125 PASS** |

---

## 10. Troubleshooting & FAQs

### Q1: `Error: listen EADDRINUSE: address already in use :::3001`
- **Cause**: An existing backend process is already running on port 3001.
- **Solution**:
  ```powershell
  # Find process using port 3001:
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
  ```
  Then restart with `node src/index.js`.

### Q2: Mobile app cannot connect to backend (`Network request failed`)
- **Cause**: The computer's IP address on Wi-Fi changed or phone is not on the same local network.
- **Solution**:
  1. Find your IP: `Get-NetIPAddress -AddressFamily IPv4`
  2. Update `app/config.js` with your IP address: `const API_BASE_URL = 'http://<YOUR_IP>:3001';`
  3. Ensure Windows Firewall allows incoming connections on port 3001.

### Q3: How do I test with the live Gemini AI model instead of the fallback hint?
- **Solution**:
  1. Obtain a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
  2. Open `backend/.env`.
  3. Set `GEMINI_API_KEY=AIzaSy...` (replace placeholder).
  4. Restart the backend server. The `/mentor` endpoint will automatically switch from the offline fallback to live Gemini 1.5 Flash hints.
