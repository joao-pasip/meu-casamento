import Header from './components/Header';
import Footer from './components/Footer';
import Hero from './sections/Hero';
import WeddingCountdown from './sections/WeddingCountdown';
import OurStory from './sections/OurStory';
import PhotoGallery from './sections/PhotoGallery';
import WeddingLocations from './sections/WeddingLocations';
import { Hotels, MakeupArtists } from './sections/Recommendations';
import GiftRegistry from './sections/GiftRegistry';
import RSVPForm from './sections/RSVPForm';
import { useWeddingData } from './hooks/useWeddingData';
export default function App() { const state = useWeddingData(); return <><Header/><main id="conteudo"><Hero/><WeddingCountdown/><OurStory/><PhotoGallery/><WeddingLocations/><Hotels state={state}/><MakeupArtists state={state}/><GiftRegistry state={state}/><RSVPForm/></main><Footer/></>; }
