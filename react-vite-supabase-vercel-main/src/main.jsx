import { StrictMode } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";

import "./index.css";
import App from "./App.jsx";
import AppBar from "./containers/AppBar";
import AuthProvider from "./context/AuthContext.jsx";
import githubLogo from "/github.svg";
import SignIn from "./pages/auth/Login.jsx";
import SignUp from "./pages/auth/SignUp.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CreateQuiz from "./pages/dashboard/CreateQuiz.jsx";
import MyQuizzes from "./pages/dashboard/MyQuizzes.jsx";
import Analytics from "./pages/dashboard/Analytics.jsx";
import Settings from "./pages/dashboard/Settings.jsx";
import Support from "./pages/dashboard/Support.jsx";

createRoot(document.getElementById("root")).render(
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      margin: "1rem",
    }}
  >
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <StrictMode>
        <AuthProvider>
          <BrowserRouter>
            <AppBar />
            <Routes>
              <Route index path="/" element={<App />} />
              <Route index path="/auth/sign-in" element={<SignIn />} />
              <Route index path="/auth/sign-up" element={<SignUp />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/create-quiz" element={<CreateQuiz />} />
              <Route path="/dashboard/my-quizzes" element={<MyQuizzes />} />
              <Route path="/dashboard/analytics" element={<Analytics />} />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route path="/dashboard/support" element={<Support />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>

        <Toaster />
      </StrictMode>
    </div>
    <footer
      style={{
        padding: "1rem",
        textAlign: "center",
      }}
    >
      Template Project available on{" "}
      <a
        href="https://github.com/juancarlosjr97/react-vite-supabase-vercel"
        target="_blank"
      >
        <img src={githubLogo} className="logo github" alt="GitHub logo" />
      </a>
    </footer>
  </div>
);
