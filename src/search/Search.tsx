import { useState, useRef, useEffect } from "react";
import './Search.css';
import { LuSearch } from "react-icons/lu";
import { MdImageNotSupported } from "react-icons/md";
import { MdArrowOutward } from "react-icons/md";
import { LuArrowUpLeft } from "react-icons/lu";
import { IoCloseSharp } from "react-icons/io5";
import { TbWorld } from "react-icons/tb";

interface WormsRecord {
  AphiaID: number;
  scientificname: string;
  authority: string;
  rank: string;
  status: string;

  isMarine?: number | null;
  isBrackish?: number | null;
  isFreshwater?: number | null;
  isTerrestrial?: number | null;
  isExtinct?: number | null;
}

interface SpeciesWithImage extends WormsRecord {
  image?: string | null;
}

const QUICK_SUGGESTIONS: [string, string][] = [
  ["Dolphin", "Delphinus"],
  ["Coral", "Coralanthura"],
  ["Humpback Whale", "Megaptera novaeangliae"],
  ["Atlantic Cod", "Gadus morhua"],
];

const MORE_SPECIES: [string, string][] = [
  ["Acorn Barnacle", "Semibalanus balanoides"],
  ["American Lobster", "Homarus americanus"],
  ["Blue Whale", "Balaenoptera musculus"],
  ["California Sea Lion", "Zalophus californianus"],
  ["Clown Anemonefish", "Amphiprion ocellaris"],
  ["Common Octopus", "Octopus vulgaris"],
  ["Crown-of-thorns Starfish", "Acanthaster planci"],
  ["Giant Kelp", "Macrocystis pyrifera"],
  ["Giant Squid", "Architeuthis dux"],
  ["Great White Shark", "Carcharodon carcharias"],
  ["Harbor Seal", "Phoca vitulina"],
  ["Humpback Whale", "Megaptera novaeangliae"],
  ["Knotted Wrack", "Ascophyllum nodosum"],
  ["Moon Jellyfish", "Aurelia aurita"],
  ["Ocean Sunfish", "Mola mola"],
  ["Pacific Manta Ray", "Manta birostris"],
  ["Polar Bear", "Ursus maritimus"],
  ["Scalloped Hammerhead", "Sphyrna lewini"],
  ["Sea Otter", "Enhydra lutris"],
  ["Seagrass", "Zostera marina"],
  ["Yellowfin Tuna", "Thunnus albacares"],
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpeciesWithImage[]>([]);
  const [selected, setSelected] = useState<SpeciesWithImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSpeciesPanel, setShowSpeciesPanel] = useState(false);
  const [highlightInput, setHighlightInput] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);



const fetchSpeciesDetails = async (aphiaID: number) => {
  return await safeFetchJSON(
    `https://www.marinespecies.org/rest/AphiaRecordByAphiaID/${aphiaID}`
  );
};
  

 useEffect(() => {
  const handleClickOutside = (event: PointerEvent) => {
    if (
      showSpeciesPanel &&
      panelRef.current &&
      !panelRef.current.contains(event.target as Node)
    ) {
      setShowSpeciesPanel(false);
    }
  };

  document.addEventListener("pointerdown", handleClickOutside);

  return () => {
    document.removeEventListener("pointerdown", handleClickOutside);
  };
}, [showSpeciesPanel]);
  
  const safeFetchJSON = async (url: string) => {
    try {
      const res = await fetch(url);
      const text = await res.text();

      if (!text) return null;

      return JSON.parse(text);
    } catch (err) {
      console.error("Fetch error:", url, err);
      return null;
    }
  };

  
  const fetchImage = async (name: string) => {
    try {
      const match = await safeFetchJSON(
        `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`
      );

      if (!match?.usageKey) return null;

      const media = await safeFetchJSON(
        `https://api.gbif.org/v1/species/${match.usageKey}/media`
      );

      return media?.results?.[0]?.identifier || null;
    } catch {
      return null;
    }
  };

  const getHabitats = (s: SpeciesWithImage) => {
  const habitats = [];

  if (s.isMarine) habitats.push("Ocean");
  if (s.isBrackish) habitats.push(" Brackish");
  if (s.isFreshwater) habitats.push(" Freshwater");
  if (s.isTerrestrial) habitats.push(" Land");

  return habitats.length ? habitats.join(", ") : "Unknown habitat";
};


  const searchSpecies = async (forcedQuery?: string) => {
    const q = forcedQuery ?? query;
    if (!q.trim()) return;

    setLoading(true);
    setSelected(null);

    try {
      
      let data = await safeFetchJSON(
        `https://www.marinespecies.org/rest/AphiaRecordsByName/${encodeURIComponent(q)}?like=true&marine_only=true`
      );

      
      if (!data || data.length === 0) {
        const vernacular = await safeFetchJSON(
          `https://www.marinespecies.org/rest/AphiaRecordsByVernacular/${encodeURIComponent(q)}`
        );

        if (vernacular && vernacular.length > 0) {
          data = vernacular.map((v: { AphiaID: number; scientificname: string }) => ({
            AphiaID: v.AphiaID,
            scientificname: v.scientificname,
            authority: "",
            rank: "Unknown",
            status: "accepted",
          }));
        }
      }

      console.log("RESULTS:", data);

      if (!data || data.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      const sliced = data.slice(0, 6);

      
    const withImages = await Promise.all(
  sliced.map(async (item: WormsRecord) => {
    const img = await fetchImage(item.scientificname);
    const details = await fetchSpeciesDetails(item.AphiaID);

    return {
      ...item,
      image: img,
      ...details, 
    };
  })
);

      setResults(withImages);
    } catch (err) {
      console.error("Search error:", err);
    }

    setLoading(false);
  };

  const pickFromPanel = (name: string) => {
    setQuery(name);
    setShowSpeciesPanel(false);
    setHighlightInput(true);
    setTimeout(() => setHighlightInput(false), 600);
    searchSpecies(name);
  };

  function suggestedBtnNavs(name: string){
    setQuery(name)
  }

  return (
    <div className='search-page-container'>
      <div className='scanner-wrapper'>
        <div className="search-area">
          <div className={`search-wrapper ${highlightInput ? "highlight" : ""}`}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchSpecies()}
              placeholder="Search Marine Species..."
              className="search-bar"
              aria-label="Search marine species"
            />
            <button
              className='search-btn'
              aria-label="Search"
              onClick={() => searchSpecies()}
            >
              <LuSearch size={20} />
            </button>
          </div>
        </div>

        <div className='suggestions-area'>
          <p>Suggestions</p>
          <div className='btn-container'>
            {QUICK_SUGGESTIONS.map(([label, scientific]) => (
              <div className='btn-wrapper' key={scientific}>
                <button onClick={() => suggestedBtnNavs(scientific)}>{label}</button>
              </div>
            ))}
          </div>

          <div className='see-more'>
            <button className='show-more-btn' onClick={() => setShowSpeciesPanel(true)}>
              <span><LuArrowUpLeft /></span>
              <p>See more suggestions</p>
            </button>
          </div>
        </div>
        <div className='search-result-wrapper-deco' aria-hidden="true"></div>

        <div className='search-result-wrapper'>
          <div className='results-text'>
            {loading && <p>Loading...</p>}
            {!loading && results.length === 0 && (
              <p>No results found. Try scientific names like "Delphinus".</p>
            )}
          </div>

          {!loading && results.length > 0 && (
            <div className='info-cards-container'>
              {results.map((item) => (
                <div
                  className='info-card'
                  key={item.AphiaID}
                  onClick={() => setSelected(item)}
                >
                  {item.image ? (
                    <img
                      className='info-card-img'
                      src={item.image}
                      alt={item.scientificname}
                      loading="lazy"
                    />
                  ) : (
                    <div className='info-card-img-area'>
                      <MdImageNotSupported size={40} />
                    </div>
                  )}

                  <h3>{item.scientificname}</h3>
                  <p>{item.rank}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div onClick={() => setSelected(null)} className='if-selected'>
          <div
            onClick={(e) => e.stopPropagation()}
            className='selected-info-card'
            role="dialog"
            aria-modal="true"
            aria-label={selected.scientificname}
          >
            <button
              className='selected-close-btn'
              aria-label="Close"
              onClick={() => setSelected(null)}
            >
              <IoCloseSharp />
            </button>

            <div className='selected-name-wrapper'>
              <h2 className="selected-name" data-text={selected.scientificname}>
                {selected.scientificname}
              </h2>

              <div className='status-wrapper'>
                <p>
                  <strong>What is it?</strong>
                  <span>A marine species found in global ocean ecosystems.</span>
                </p>
                <p>
                  <strong>Scientific Rank</strong>
                  <span>{selected.rank}</span>
                </p>
                <p>
                  <strong><TbWorld /> Habitat</strong>
                  <span>{getHabitats(selected)}</span>
                </p>
                <p>
                  <strong>Status</strong>
                  <span>{selected.isExtinct ? "Extinct species" : "Currently existing"}</span>
                </p>
                <p>
                  <strong>Conservation Status</strong>
                  <span>
                    {selected.status === "accepted"
                      ? "Recognized species"
                      : selected.status || "Unknown"}
                  </span>
                </p>
                <p>
                  <strong>Scientific Name</strong>
                  <span>{selected.scientificname}</span>
                </p>
              </div>

              <div className='selected-name-img-area'>
                {selected.image ? (
                  <img
                    src={selected.image}
                    alt={selected.scientificname}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="fallback-icon">
                    <MdImageNotSupported size={50} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        ref={panelRef}
        className={`show-more-list ${showSpeciesPanel ? "open" : ""}`}
        aria-hidden={!showSpeciesPanel}
      >
        <div className='panel-header'>
          <h2 className='panel-title'>More species</h2>
          <button
            className="close-menu-btn"
            onClick={() => setShowSpeciesPanel(false)}
          >
            <span><IoCloseSharp /></span>
            close
          </button>
        </div>

        <div className='show-more-list-only'>
          <ul>
            {MORE_SPECIES.map(([label, scientific]) => (
              <li key={scientific} onClick={() => pickFromPanel(scientific)}>
                <span className='species-label'>{label}</span>
                <MdArrowOutward className='arrow-icon' />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
