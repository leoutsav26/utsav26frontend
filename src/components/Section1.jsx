import React, { useState, useRef, useEffect } from "react";
import "./Section1.css";

const Section1 = () => {
  const sectionRef = useRef(null);

  const [beamStyle, setBeamStyle] = useState({
    width: 0,
    angle: 0,
    originX: 0,
    originY: 0,
  });

  // Recalculate beam origin on load AND resize
  useEffect(() => {
    const updateOrigin = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();

      setBeamStyle((prev) => ({
        ...prev,
        originX: rect.width / 2,
        originY: rect.height * 0.12, // aligns near lighthouse bulb
      }));
    };

    updateOrigin();
    window.addEventListener("resize", updateOrigin);

    return () => window.removeEventListener("resize", updateOrigin);
  }, []);

  const handleMouseMove = (e) => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { originX, originY } = beamStyle;

    const dx = mouseX - originX;
    const dy = mouseY - originY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    setBeamStyle((prev) => ({
      ...prev,
      width: distance,
      angle,
    }));

    const letters = section.querySelectorAll(".beam-letter");

    letters.forEach((letter) => {
      const letterRect = letter.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();

      const centerX =
        letterRect.left + letterRect.width / 2 - sectionRect.left;
      const centerY =
        letterRect.top + letterRect.height / 2 - sectionRect.top;

      const dxLetter = centerX - originX;
      const dyLetter = centerY - originY;

      const distanceToLetter = Math.sqrt(
        dxLetter * dxLetter + dyLetter * dyLetter
      );

      const angleToLetter =
        Math.atan2(dyLetter, dxLetter) * (180 / Math.PI);

      const angleDiff = Math.abs(angle - angleToLetter);

      const isHit = angleDiff < 8 && distanceToLetter < distance;

      if (isHit) {
        letter.classList.add("lit");
      } else {
        letter.classList.remove("lit");
      }
    });
  };

  const handleMouseLeave = () => {
    const section = sectionRef.current;
    if (!section) return;

    const letters = section.querySelectorAll(".beam-letter");
    letters.forEach((letter) => {
      letter.classList.remove("lit");
    });
  };

  return (
    <div
      className="section1"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src="/images/section1.png"
        alt="Ocean Background"
        className="section1-img"
      />

      <div
        className="section1-beam"
        style={{
          width: `${beamStyle.width}px`,
          transform: `translate(${beamStyle.originX}px, ${beamStyle.originY}px) rotate(${beamStyle.angle}deg)`,
        }}
      />

      <h1 className="section1-heading">
        {"Participate".split("").map((char, i) => (
          <span key={"p" + i} className="beam-letter">
            {char}
          </span>
        ))}
        <br />
        {"For A Cause!".split("").map((char, i) => (
          <span key={"c" + i} className="beam-letter">
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </h1>
    </div>
  );
};

export default Section1;
