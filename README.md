# QuizCert - Freemium Quiz Platform with Certificate Engine

QuizCert is a full-stack freemium quiz platform designed to act as a lead-generation tool. Users can attempt quizzes completely free, but their final score, question analytics, and PDF certificates are locked behind a small payment (₹49). Upon successful checkout verification, a signed landscape A4 PDF certificate is automatically generated and delivered.

---

## 🚀 Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS, React Router, Axios, Lucide Icons, Canvas Confetti
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT, bcryptjs, Razorpay Node SDK, PDFKit, Nodemailer

---

## 🛠️ Installation & Setup

### Prerequisites

1.  **Node.js** (v18 or higher recommended)
2.  **MongoDB** (local server running at `mongodb://localhost:27017` or MongoDB Atlas URI)

### Step 1: Configure Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  The `.env` file is pre-configured with default values (including local MongoDB port and JWT secrets) so it works out of the box:
    ```env
    PORT=5000
    MONGODB_URI=mongodb://127.0.0.1:27017/quizcert
    JWT_SECRET=supersecretjwtkeyforquizcertapplication
    BYPASS_PAYMENT=true
    FRONTEND_URL=http://localhost:5173
    ```
    *Note: `BYPASS_PAYMENT=true` enables developer simulation mode, bypassing the need for active Razorpay API credentials.*
4.  Start the development server:
    ```bash
    npm run dev
    ```
    *The server will boot on port 5000 and seed default quizzes and an administrator account if the database is empty.*

### Step 2: Configure Frontend

1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite bundler:
    ```bash
    npm run dev
    ```
    *The web application will open at [http://localhost:5173](http://localhost:5173).*

---

## 🎮 3-5 Minute Demo Guide

Follow these steps to demonstrate the full user journey:

1.  **Landing Page:** Open [http://localhost:5173](http://localhost:5173). Explore the Hero section, Features description, and Click **Start Quiz Now**.
2.  **Registration / Signup:** Create a new test user account by entering a name, email, and password.
3.  **Dashboard Catalog:** Choose one of the seeded quizzes (e.g. *Full Stack Web Development Essentials*) and click **Start**.
4.  **Attempt Quiz:** Answer the multiple-choice questions. Observe the countdown timer, the progress bar, and pagination controls.
5.  **Submit & Lock Results:** Click **Submit Quiz**. The system registers your answers, calculates the score on the backend, and locks it, redirecting you to the **Paywall Page**.
6.  **Paywall & Simulation:** The paywall screen hides your score and displays a purchase prompt for ₹49. Click **Pay ₹49 & Unlock Now**. Since `BYPASS_PAYMENT=true` is set, a Sandbox Modal will overlay. Click **Simulate Successful Payment**.
7.  **Certificate Screen:** Instantly, confetti animations will fire. The results card reveals your score percentage, date, and exam summary. Below it, the full question review lists all selected and correct options with explanations.
8.  **Download PDF:** Click **Download PDF Certificate**. A signed, professional landscape A4 certificate will render and stream directly into your downloads folder.
9.  **Public Verification Lookup:**
    *   Copy the unique Certificate ID (e.g. `CERT-2026-XXXX`).
    *   Go to **Verify Certificate** in the Navbar, paste the ID, and click **Verify**.
    *   The portal will display candidate name, exam type, score, and issue date, confirming authenticity.

---

## 🔑 Administrative Control Panel

Log in using the pre-seeded admin credentials:
-   **Email:** `admin@quizcert.com`
-   **Password:** `adminpassword123`

### Features:
1.  **Quiz Catalog:** Add new quizzes, edit existing question arrays (including correct answer indices), or delete quizzes.
2.  **Users Audit:** Inspect a full tabular log of all registered platform users.
3.  **Transactions Log:** Audit every purchase order details, captured payment IDs, and dates.
4.  **Issued Certificates:** View all dynamically generated credentials with direct download links.
