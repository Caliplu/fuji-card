import { useState, useEffect, useRef } from 'react';
import './PriceRange.css';

const PriceRange = ({ onFilterChange, maxPrice = 2000, minValue = 0, maxValue = maxPrice }) => {
  const [range, setRange] = useState({ min: minValue, max: maxValue });
  const timeoutRef = useRef(null);
  const onFilterChangeRef = useRef(onFilterChange);
  useEffect(() => { onFilterChangeRef.current = onFilterChange; }, [onFilterChange]);

  // Products remounts this draft input when the URL changes, cancelling a pending edit.
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const updateRange = (next) => {
    setRange(next);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onFilterChangeRef.current(next), 500);
  };

  const changeMin = (event) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) return;
    updateRange({ ...range, min: Math.max(0, Math.min(value, range.max)) });
  };

  const changeMax = (event) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) return;
    updateRange({ ...range, max: Math.min(maxPrice, Math.max(value, range.min)) });
  };

  const reset = () => {
    clearTimeout(timeoutRef.current);
    setRange({ min: 0, max: maxPrice });
    onFilterChangeRef.current({ min: 0, max: maxPrice });
  };

  return (
    <div className="price-range-container">
      <h3 className="price-range-title">Price Range (GBP)</h3>
      <div className="price-inputs">
        <div className="input-group">
          <label htmlFor="price-min">Min (£)</label>
          <input id="price-min" type="number" value={range.min} onChange={changeMin}
            min="0" max={range.max} step="1" />
        </div>
        <span className="separator">–</span>
        <div className="input-group">
          <label htmlFor="price-max">Max (£)</label>
          <input id="price-max" type="number" value={range.max} onChange={changeMax}
            min={range.min} max={maxPrice} step="1" />
        </div>
      </div>
      <div className="price-slider">
        <input type="range" aria-label="Minimum price" min="0" max={maxPrice}
          value={range.min} onChange={changeMin} className="slider-min" step="10" />
        <input type="range" aria-label="Maximum price" min="0" max={maxPrice}
          value={range.max} onChange={changeMax} className="slider-max" step="10" />
      </div>
      <div className="price-display">
        <span>£{range.min.toLocaleString()}</span>
        <span>–</span>
        <span>{range.max >= maxPrice ? `£${(maxPrice / 1000).toLocaleString()}k+` : `£${range.max.toLocaleString()}`}</span>
      </div>
      <button type="button" className="reset-btn" onClick={reset}>Reset Filter</button>
    </div>
  );
};

export default PriceRange;
