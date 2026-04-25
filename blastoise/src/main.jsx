import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import SearchPage from "./pages/SearchPage";
import MediaDetail from "./pages/MediaDetail";
import Members from "./pages/Footer/Members";
import Page67 from "./pages/Footer/Page67";
import Terms from "./pages/Footer/Terms";
import Contact from "./pages/Footer/Contact";
import { StrictMode } from "react";
import TierList from "./pages/TierList";


const router = createBrowserRouter([{
    path:"/",
    element: <App />,
    children: [
        {path:'' , element: <Home />},
{ path: "media/:id", element: <MediaDetail /> },
{ path: "collection", element: <Collection /> },
{ path: "search", element: <SearchPage /> },
{ path: "members", element: <Members /> },
{ path: "page-67", element: <Page67 /> },
{ path: "terms", element: <Terms /> },
{ path: "contact", element: <Contact /> },
 { path: "tierlist", element: <TierList /> },
    ]
}])


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);