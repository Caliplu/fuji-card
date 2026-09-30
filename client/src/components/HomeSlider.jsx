import { useState, useEffect } from 'react';
import './HomeSlider.css';

const HomeSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      image: '/slideshow/M4-back-300x167.webp',
      title: 'Explore the Collection',
      subtitle: 'M4 Ninja Spinner',
      info: 'Browse Japanese trading cards',
      buttonText: 'VIEW PRODUCTS',
      link: '/products?search=ninja'
    },
    {
      id: 2,
      image: '/slideshow/M2a-back-300x186.jpg',
      title: 'Now Available!!',
      subtitle: 'M2a MEGA Dream ex',
      info: 'Discover the latest Mega series!',
      buttonText: 'ORDER NOW!',
      link: '/products?search=mega'
    },
    {
      id: 3,
      image: '/slideshow/M3-back-300x167.webp',
      title: 'Coming Soon!!',
      subtitle: 'M3 Series Upgrade',
      info: 'Official Series Arrival',
      buttonText: 'VIEW MORE',
      link: '/products?search=m3'
    },
    {
      id: 4,
      image: '/slideshow/OP-15-back-300x176.webp',
      title: 'One Piece Card List!!',
      subtitle: 'OP-15 Set Discovery',
      info: 'All latest One Piece cards available',
      buttonText: 'EXPLORE',
      link: '/products?search=op-15'
    },
    {
      id: 5,
      image: '/slideshow/EB-04-back-300x171.webp',
      title: 'Premium Selection!!',
      subtitle: 'EB-04 Series',
      info: 'Sealed Official Japanese Products',
      buttonText: 'SHOP NOW',
      link: '/products?search=eb-04'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="home-slider">
      {slides.map((slide, index) => (
        <div 
          key={slide.id} 
          className={`slide ${index === currentSlide ? 'active' : ''}`}
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${slide.image})` }}
        >
          <div className="slide-content">
            <div className="glass-box">
              <p className="pre-order-tag">{slide.title}</p>
              <h2 className="slide-main-title">{slide.subtitle}</h2>
              <p className="release-info">{slide.info}</p>
              <a href={slide.link} className="order-btn-mockup">
                {slide.buttonText}
              </a>
            </div>
          </div>
        </div>
      ))}
      
      <div className="slider-dots">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className={`dot ${i === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(i)}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default HomeSlider;
