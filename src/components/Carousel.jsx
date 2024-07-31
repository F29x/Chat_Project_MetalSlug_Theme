import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/carousel.css';

const text1Options = [
  "Metal Slug Super Vehicle 001",
  "Metal Slug 2",
  "Metal Slug 3",
  "Metal Slug 4",
  "Metal Slug 5",
  "Metal Slug 6"
];
const text2Options = [
  "Play Soldier",
  "Gear up Soldier",
  "Ready Soldier ?",
  "Soldier Buckle up",
  "It's time Soldier",
  "Mission Started Soldier"
];
const colorOptions = ["#C79A5F", "#B47C36", "#A3662D", "#93522A", "#723A14", "#573103"];
const iframeOptions = [
  "https://www.retrogames.cc/embed/9157-metal-slug-super-vehicle-001.html",
  "https://www.retrogames.cc/embed/9158-metal-slug-2-super-vehicle-001ii-ngm-2410-ngh-2410.html",
  "https://www.retrogames.cc/embed/9159-metal-slug-3-ngh-2560.html",
  "https://www.retrogames.cc/embed/9161-metal-slug-4-ngh-2630.html",
  "https://www.retrogames.cc/embed/9164-metal-slug-5-bootleg.html",
  "https://www.retrogames.cc/embed/9169-metal-slug-6-metal-slug-3-bootleg-bootleg.html"
];
const imageOptions = [
  "../pictures/download1.png",
  "../pictures/metal2.webp",
  "../pictures/metal3.webp",
  "../pictures/dd.png",
  
  "../pictures/5.png",
  
  "../pictures/6.png"
];

const Carousel = () => {
  const [index, setIndex] = useState(0);
  const [animClass, setAnimClass] = useState('');

  const handleNext = () => {
    setAnimClass('anim-next');
    setTimeout(() => {
      setIndex((prevIndex) => (prevIndex + 1) % text1Options.length);
    }, 455);
    setTimeout(() => {
      setAnimClass('');
    }, 650);
  };

  const handlePrevious = () => {
    setAnimClass('anim-previous');
    setTimeout(() => {
      setIndex((prevIndex) => (prevIndex === 0 ? text1Options.length - 1 : prevIndex - 1));
    }, 455);
    setTimeout(() => {
      setAnimClass('');
    }, 650);
  };

  return (
    <div className={`carousel-wrapper ${animClass}`}>
      <div id="menu" style={{ background: colorOptions[index] }}>
        <div id="current-option">
          <img src={imageOptions[index]} alt={text1Options[index]} className="slide-image" />
          <span id="current-option-text1" data-next-text={text1Options[index]}>{text1Options[index]}</span>
          <span id="current-option-text2" data-next-text={text2Options[index]}>{text2Options[index]}</span>
          <Link to="/chat">
            <button className="chat-button">Go to Chat</button>
          </Link>
        </div>
        <button id="previous-option" onClick={handlePrevious}></button>
        <button id="next-option" onClick={handleNext}></button>
      </div>
      <div id="iframe-container">
        <iframe
          src={iframeOptions[index % iframeOptions.length]}
          width="400"
          height="350"
          frameBorder="0"
          allowFullScreen={true}
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
          scrolling="no"
        ></iframe>
      </div>
    </div>
  );
};

export default Carousel;
