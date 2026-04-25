import { useEffect, useRef } from "react";
import anime from "animejs";

export default function Cursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = 0, my = 0;
    let rx = 0, ry = 0;

    const move = (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top  = my + "px";
    };

    let raf;
    const follow = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + "px";
      ring.style.top  = ry + "px";
      raf = requestAnimationFrame(follow);
    };

    document.addEventListener("mousemove", move);
    raf = requestAnimationFrame(follow);

    // Click burst
    const burst = (e) => {
      const el = document.createElement("div");
      el.style.cssText = `
        position:fixed; width:4px; height:4px; border-radius:50%;
        background:var(--cyan); pointer-events:none; z-index:9998;
        left:${e.clientX}px; top:${e.clientY}px; transform:translate(-50%,-50%);
      `;
      document.body.appendChild(el);
      anime({
        targets: el,
        scale: [1, 0],
        opacity: [1, 0],
        duration: 500,
        easing: "easeOutExpo",
        complete: () => el.remove(),
      });
    };

    document.addEventListener("click", burst);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("click", burst);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
