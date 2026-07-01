import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#d94f21",
          borderRadius: 6,
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        },
        components: {
          Table: {
            cellPaddingBlock: 8,
            cellPaddingInline: 10,
            headerBg: "#f6f8fb"
          }
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
