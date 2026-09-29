import { useState, useEffect } from 'react';
import './AnnouncementSlider.css';

const AnnouncementSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const announcements = [
    {
      id: 1,
      title: "🔥 New Pokemon 151 Set Just Arrived!",
      description: "Get your hands on the most sought-after Japanese Pokemon set. Limited stock available!",
      badge: "NEW",
      badgeColor: "#e94560",
      image: "https://images.pokemontcg.io/sv3pt5/172_hires.png",
      gradient: "linear-gradient(135deg, #ff6b6b 0%, #e94560 100%)",
      cta: "Shop Now",
      link: "/products?category=pokemon"
    },
    {
      id: 2,
      title: "💎 Ultra Rare Graded Cards in Stock",
      description: "PSA 10 & BGS 9.5 graded gems now available. Investment quality collectibles!",
      badge: "RARE",
      badgeColor: "#gold",
      image: "https://images.pokemontcg.io/base1/4_hires.png",
      gradient: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
      cta: "View Collection",
      link: "/products?category=specialrare"
    },
    {
      id: 3,
      title: "⚡ Flash Sale - 30% Off Select Cards",
      description: "Limited time offer on featured Pokemon, Yu-Gi-Oh!, and One Piece cards. Don't miss out!",
      badge: "SALE",
      badgeColor: "#00b67a",
      image: "https://images.ygoprodeck.com/images/cards/89631139.jpg",
      gradient: "linear-gradient(135deg, #00b67a 0%, #00d4aa 100%)",
      cta: "Shop Sale",
      link: "/products?category=promo"
    },
    {
      id: 4,
      title: "🚢 Japanese Sealed Products Restocked",
      description: "Fresh booster boxes, ETBs, and special sets directly from Japan. Authentic sealed products!",
      badge: "RESTOCK",
      badgeColor: "#4a90e2",
      image: "https://m.media-amazon.com/images/I/71kZPnWQXWL._AC_SL1500_.jpg",
      gradient: "linear-gradient(135deg, #4a90e2 0%, #7b68ee 100%)",
      cta: "Browse Sealed",
      link: "/products?category=sealed"
    },
    {
      id: 5,
      title: "🌟 One Piece OP-06 Set Available",
      description: "Latest One Piece cards now in stock! Featuring Gear 5 Luffy and more powerful cards!",
      badge: "HOT",
      badgeColor: "#ff6b35",
      image: "https://en.onepiece-cardgame.com/images/cardlist/card/OP04-003.png",
      gradient: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
      cta: "Explore Now",
      link: "/products?category=onepiece"
    }
  ];

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === announcements.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [isPaused, announcements.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? announcements.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === announcements.length - 1 ? 0 : currentIndex + 1);
  };

  return (
    <section className="announcement-section">
      <div className="announcement-container">
        <div className="announcement-slider">
          {announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`announcement-slide ${index === currentIndex ? 'active' : ''}`}
              style={{
                background: announcement.gradient,
                transform: `translateX(${(index - currentIndex) * 100}%)`
              }}
            >
              <div className="announcement-content">
                <div className="announcement-text">
                  <div className="announcement-badges">
                    <span 
                      className="announcement-badge"
                      style={{ backgroundColor: announcement.badgeColor }}
                    >
                      {announcement.badge}
                    </span>
                    <span className="announcement-tag">Limited Time</span>
                  </div>
                  <h2 className="announcement-title">{announcement.title}</h2>
                  <p className="announcement-description">{announcement.description}</p>
                  <div className="announcement-actions">
                    <a 
                      href={announcement.link} 
                      className="announcement-btn primary"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = announcement.link;
                      }}
                    >
                      {announcement.cta}
                      <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </a>
                    <button className="announcement-btn secondary">Learn More</button>
                  </div>
                </div>
                <div className="announcement-visual">
                  <div className="card-showcase">
                    <img 
                      src={announcement.image} 
                      alt={announcement.title}
                      className="showcase-card"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.png'; }}
                    />
                    <div className="card-glow"></div>
                    <div className="floating-particles">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className={`particle particle-${i + 1}`}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="slider-controls">
          <button 
            className="control-btn prev"
            onClick={goToPrevious}
            aria-label="Previous slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button 
            className="control-btn next"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="slide-indicators">
          {announcements.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{
              animation: isPaused ? 'none' : `progress 4s linear infinite`
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default AnnouncementSlider;
