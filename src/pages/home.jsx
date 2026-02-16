import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppData";
import Footer from "../components/Footer";
import Section1 from "../components/Section1";
import "./home.css";

const Home = () => {
  const navigate = useNavigate();
  const { events } = useAppData();

  const [featuredList, setFeaturedList] = useState([]);
  const [mouseSpot, setMouseSpot] = useState({ x: 0.5, y: 0.5 });

  const canvasRef = useRef(null);
  const heroRef = useRef(null);

  /* ===========================
     FEATURED EVENTS
  ============================ */
  useEffect(() => {
    if (!events) return;

    const openEvents = events.filter(
      (e) =>
        !e.status ||
        e.status === "open" ||
        e.status === "ongoing"
    );

    setFeaturedList(openEvents.slice(0, 2));
  }, [events]);

  /* ===========================
     PARTICLE ANIMATION
  ============================ */
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = heroRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particlesArray = [];
    let animationFrameId;
    const numberOfParticles = 100;

    function resizeCanvas() {
      canvas.width = section.offsetWidth;
      canvas.height = section.offsetHeight;
      init(); // re-init particles on resize
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x <= 0 || this.x >= canvas.width) this.speedX *= -1;
        if (this.y <= 0 || this.y >= canvas.height) this.speedY *= -1;
      }

      draw() {
        ctx.fillStyle = "rgba(0,170,255,0.8)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function init() {
      particlesArray = [];
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesArray.forEach((particle) => {
        particle.update();
        particle.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  /* ===========================
     HERO SPOTLIGHT
  ============================ */
  const handleHeroMouseMove = (e) => {
    if (!heroRef.current) return;

    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setMouseSpot({ x, y });
  };

  return (
    <div className="home-container">

      {/* HERO SECTION */}
      <section
        ref={heroRef}
        className="leo-typewriter-section hero-lighting"
        onMouseMove={handleHeroMouseMove}
      >
        {/* Spotlight */}
        <div
          className="hero-spotlight"
          style={{
            background: `radial-gradient(circle 200px at ${
              mouseSpot.x * 100
            }% ${mouseSpot.y * 100}%, rgba(0,170,255,0.25), transparent 65%)`,
          }}
        />

        {/* Particles */}
        <canvas ref={canvasRef} className="leo-particle-canvas" />

        {/* Login Button */}
        <Link to="/login" className="home-login-link">
          Login
        </Link>

        {/* Hero Content */}
        <div className="leo-typewriter">
          <img
            src="/images/logo.png"
            alt="Leo Utsav Logo"
            className="hero-logo"
          />

          <h1 className="hero-neon-title">
            LEO Utsav'26
          </h1>

          <p className="leo-subtitle glow-text">
            Leadership · Experience · Opportunity
          </p>
        </div>
      </section>

      {/* SECTION 1 */}
      <section className="section1-wrapper">
        <Section1 />
      </section>

      {/* PURPOSE SECTION */}
      <section className="purpose-section">
        <div className="purpose-content">
          <h1>Empowering Change Through Innovation</h1>

          <h4>
            <span className="glow-line">
              "Celebrate. Compete. Contribute."
            </span>
          </h4>

          <p>
            <strong>LEO UTSAV</strong> is more than just an event. It is a vibrant
            celebration of talent, creativity, and purpose. Hosted by the{" "}
            <strong>LEO Club of CEG</strong>, UTSAV brings together students to
            participate, perform, and make an impact.
          </p>

          <p>
            From exciting competitions and cultural showcases to meaningful initiatives,
            UTSAV blends celebration with contribution.
          </p>

          <p>
            <strong>Event Schedule:</strong><br />
            <span className="schedule-date">
              Feb 16 & 17 – 4:00 PM to 7:30 PM
            </span><br />
            <span className="schedule-date">
              Feb 18 – 9:00 AM to 7:30 PM
            </span>
          </p>
        </div>
      </section>

      {/* FEATURED EVENTS */}
      <section className="featured-events-section">
        <h2 className="featured-title">Featured Events</h2>

        <p className="featured-subtitle">
          Don't miss out on these exciting events!
        </p>

        <div className="events-grid">
          {featuredList.length === 0 && (
            <p style={{ textAlign: "center" }}>
              No featured events available right now.
            </p>
          )}

          {featuredList.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-tag">
                {event.category || "Event"}
              </div>

              <h3>{event.title}</h3>
              <p>{event.description}</p>

              <div className="event-details">
                <span>📅 {event.date} • {event.time}</span>
                <span>📍 {event.venue}</span>
              </div>

              <div className="event-footer">
                <span
                  className={event.cost === 0 ? "price free" : "price"}
                >
                  {event.cost === 0
                    ? "Free"
                    : `₹ ${event.cost ?? 10}`}
                </span>

                <button
                  type="button"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="home-explore-wrap">
          <Link to="/events" className="home-explore-btn">
            Explore Events
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;