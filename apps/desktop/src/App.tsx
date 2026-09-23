import { useEffect, useState } from "react";
import "./App.css";

type Theme = "light" | "dark";

function App() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="app">
      <div className="card">
        <h1>doit</h1>
        <p>Motor base en marcha. Tema actual: {theme}</p>
        <button
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        >
          Cambiar a {theme === "light" ? "oscuro" : "claro"}
        </button>
      </div>
    </div>
  );
}

export default App;
