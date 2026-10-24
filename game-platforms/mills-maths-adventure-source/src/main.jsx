import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/fonts.css";
import "./styles/index.css";
import "./styles/wall.css";
import "./styles/title.css";
import "./styles/map.css";
import "./styles/journey.css";
import "./styles/polish.css";
// Phone / iPad / small-screen layer (2026-10-11) — loaded LAST so it wins.
import "./styles/mobile.css";
// Challenge demos (2026-10-24) — after mobile.css (it has its own small-screen rules).
import "./styles/demo.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
