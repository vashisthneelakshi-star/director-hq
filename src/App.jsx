import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import Meetings from "./pages/Meetings";
import Tasks from "./pages/Tasks";
import Credentials from "./pages/Credentials";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar userName="Director" userEmail="you@company.com" />
        <main className="flex-1 p-8 max-w-6xl">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/credentials" element={<Credentials />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
