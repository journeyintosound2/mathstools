import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/fonts.css";
import "./styles/index.css";
import "./styles/wall.css";
import "./styles/title.css";
import "./styles/map.css";
import "./styles/journey.css";
// Phone / iPad / small-screen layer (2026-10-11) — loaded LAST so it wins.
import "./styles/mobile.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
