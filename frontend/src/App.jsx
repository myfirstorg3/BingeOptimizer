import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "./components/Navbar";
import Cursor  from "./components/Cursor";
import Footer  from "./components/Footer";
import Dashboard  from "./pages/Dashboard";
import Collection from "./pages/Collection";
import TierList   from "./pages/TierList";
import TierListEditor from "./pages/TierListEditor";
import Search     from "./pages/Search";
import Profile    from "./pages/Profile";
import Contact  from "./pages/Contact";
import Members    from "./pages/Members";
import Terms      from "./pages/Terms";
import Page67     from "./pages/Page67";
import Login      from "./pages/Login";
import Register   from "./pages/Register";
import "./styles/globals.css";

gsap.registerPlugin(ScrollTrigger);

function PageWrapper({ children }) {
  const location = useLocation();
  const wrapRef  = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    ScrollTrigger.killAll();
    gsap.fromTo(
      wrapRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );
  }, [location.pathname]);

  return <div ref={wrapRef}>{children}</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Cursor />
      <Navbar />
      <PageWrapper>
        <Routes>
          <Route path="/"           element={<Dashboard />}  />
          <Route path="/collection" element={<Collection />} />
          <Route path="/tierlist"      element={<TierList />}       />
          <Route path="/tierlist/:id"   element={<TierListEditor />} />
          <Route path="/search"     element={<Search />}     />
          <Route path="/settings"   element={<Profile />}   />
          <Route path="/contact"    element={<Contact />}    />
          <Route path="/members"    element={<Members />}    />
          <Route path="/terms"      element={<Terms />}      />
          <Route path="/login"      element={<Login />}      />
          <Route path="/register"   element={<Register />}   />
          <Route path="/67"         element={<Page67 />}     />
          <Route path="/67"         element={<Page67 />}     />
        </Routes>
      </PageWrapper>
      <Footer />
    </BrowserRouter>
  );
}
