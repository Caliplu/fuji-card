import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomeSlider.css';

const slides = [
  {
    image: '/M4-bb-750x750.webp',
    eyebrow: 'Pokémon TCG',
    title: 'Ninja Spinner',
    description: 'Explore the Japanese Ninja Spinner booster box.',
    link: '/product/jp-m4-bb',
    label: 'View booster box'
  },
  {
    image: '/M2a-bb-750x750.webp',
    eyebrow: 'Pokémon TCG',
    title: 'Mega Dream ex',
    description: 'Explore the Japanese Mega Dream ex booster box.',
    link: '/product/jp-m2a-bb',
    label: 'View booster box'
  },
  {
    image: '/OP-15-bb-750x750.webp.webp',
    eyebrow: 'One Piece Card Game',
    title: 'Adventure on KAMI’s Island',
    description: 'Explore the OP-15 Japanese One Piece booster box.',
    link: '/product/jp-op15-bb',
    label: 'View booster box'
  }
];

const HomeSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = slides[currentSlide];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setCurrentSlide(previous => (previous + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="fuji-hero" aria-label="Featured collections">
      <div className="fuji-hero-copy">
        <span className="fuji-hero-eyebrow">{slide.eyebrow}</span>
        <h1>{slide.title}</h1>
        <p>{slide.description}</p>
        <Link className="fuji-hero-link" to={slide.link}>{slide.label}<span aria-hidden="true"> →</span></Link>
      </div>
      <div className="fuji-hero-art">
        <img key={slide.image} src={slide.image} alt={slide.title + ' trading card product'}
          width="750" height="750" decoding="async" fetchPriority={currentSlide === 0 ? 'high' : 'auto'} />
      </div>
      <div className="fuji-hero-dots" aria-label="Choose featured collection">
        {slides.map((item, index) => (
          <button key={item.title} type="button"
            aria-label={'Show ' + item.title}
            aria-current={index === currentSlide ? 'true' : undefined}
            onClick={() => setCurrentSlide(index)} />
        ))}
      </div>
    </section>
  );
};

export default HomeSlider;
