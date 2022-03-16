import React, { Suspense, lazy } from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";

const Home = lazy(() => import("./routes/Home"));
const Setting = lazy(() => import("./routes/setting"));
const Login = lazy(() => import("./routes/Login"));
const Controller = lazy(() => import("./routes/controller"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/controller" element={<Controller />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
