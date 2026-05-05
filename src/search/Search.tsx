import { useState, useRef, useEffect } from "react";
import './Search.css';
import { LuSearch } from "react-icons/lu";
import { MdImageNotSupported } from "react-icons/md";
import { MdArrowOutward } from "react-icons/md";
import { LuArrowUpLeft } from "react-icons/lu";
import { IoCloseSharp } from "react-icons/io5";

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
  const handleClickOutside = (event: MouseEvent) => {
    if (
      showSpeciesPanel &&
      panelRef.current &&
      !panelRef.current.contains(event.target as Node)
    ) {
      setShowSpeciesPanel(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
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
        `https://api.gbif.org/v1/species/match?name=${name}`
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

  if (s.isMarine) habitats.push("🌊 Ocean");
  if (s.isBrackish) habitats.push("🌗 Brackish");
  if (s.isFreshwater) habitats.push("💧 Freshwater");
  if (s.isTerrestrial) habitats.push("🌍 Land");

  return habitats.length ? habitats.join(", ") : "Unknown habitat";
};


  const searchSpecies = async (forcedQuery?: string) => {
    const q = forcedQuery ?? query;
    if (!q.trim()) return;

    setLoading(true);
    setSelected(null);

    try {
      
      let data = await safeFetchJSON(
        `https://www.marinespecies.org/rest/AphiaRecordsByName/${q}?like=true&marine_only=true`
      );

      
      if (!data || data.length === 0) {
        const vernacular = await safeFetchJSON(
          `https://www.marinespecies.org/rest/AphiaRecordsByVernacular/${query}`
        );

        if (vernacular && vernacular.length > 0) {
          data = vernacular.map((v: any) => ({
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
        />
        <button 
        className='search-btn'
        onClick={() => searchSpecies()}>
            
            <LuSearch size={20}/>
            </button>
      </div>
      
      </div>

      <div className='suggestions-area'>
        <p>Suggestions</p>
        <div className='btn-container'>
          <div className='btn-wrapper'>
              <button onClick={() => suggestedBtnNavs("Delphinus")}>Dolphin</button>
          </div>

          <div className='btn-wrapper'>
              <button
              onClick={() => suggestedBtnNavs("Coralanthura")}
              >Coral</button>
          </div>

          <div className='btn-wrapper'>
              <button
              onClick={() => {
                suggestedBtnNavs("Megaptera novaeangliae")
              }}
              >Humpback Whale</button>
          </div>

          <div className='btn-wrapper'>
              <button
              onClick={() => suggestedBtnNavs("Gadus morhua")}
              >Atlantic Cod</button>
          </div>
              
           
        </div>
        <div className='see-more'>

                      <button className='show-more-btn' onClick={() => setShowSpeciesPanel(true)}>
         <span><LuArrowUpLeft /></span> <p>See more suggestions </p>
          </button>
              </div>
       <div className='search-result-wrapper-deco'></div>
      </div>
    

      <div className='search-result-wrapper'>
           
     
      {loading && <p>Loading...</p>}

      
      {!loading && results.length === 0 && (
        <p className='results-text'>
          No results found. Try scientific names like "Delphinus".
        </p>
      )}
      

        
      <div
        className='info-cards-container'
      >
        {results.map((item) => (
          <div
            className='info-card'
            key={item.AphiaID}
            onClick={() => setSelected(item)}
            
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.scientificname}
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                  marginBottom: "0.5rem",
                }}
              />
            ) : (
              <div
              className='info-card-img-area'
              
              >
                <MdImageNotSupported size={40}/>
              </div>
            )}

            <h3>{item.scientificname}</h3>
            <p>{item.rank}</p>
          </div>
        ))}
      </div>

      
      {selected && (
        <div
          onClick={() => setSelected(null)}
          className='if-selected'
        
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='selected-info-card'
          >
            
            
          <div className='selected-name-wrapper'>

          
            <h2 
  className="selected-name"
  data-text={selected.scientificname}
>
  {selected.scientificname}
</h2>

           <div className='status-wrapper'>

  <p>
    <strong> What is it?</strong><br />
    A marine species found in global ocean ecosystems.
  </p>

  <p>
    <strong> Scientific Rank</strong><br />
    {selected.rank}
  </p>
  <p>
  <strong>🌍 Habitat</strong><br />
  {getHabitats(selected)}
</p>

<p>
  <strong> Status</strong><br />
  {selected.isExtinct ? "Extinct species" : "Currently existing"}
</p>

  <p>
    <strong> Conservation Status</strong><br />
    {selected.status === "accepted"
      ? "Recognized species"
      : selected.status || "Unknown"}
  </p>

  <p>
    <strong> Scientific Name</strong><br />
    {selected.scientificname}
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
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
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
       </div>
 



 <div 
 ref={panelRef}
 className={`show-more-list ${showSpeciesPanel ? "open" : ""}`}>
    
  <div>
    <ul>

          <li
  onClick={() => {
    setQuery("Semibalanus balanoides");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Acorn Barnacle <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Homarus americanus");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  American Lobster <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Balaenoptera musculus");
    setShowSpeciesPanel(false);
    setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Blue Whale <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Zalophus californianus");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  California Sea Lion <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Amphiprion ocellaris");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Clown Anemonefish <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Octopus vulgaris");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Common Octopus <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Acanthaster planci");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Crown-of-thorns Starfish <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Macrocystis pyrifera");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Giant Kelp <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Architeuthis dux");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Giant Squid <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Carcharodon carcharias");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
 Great White Shark <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Phoca vitulina");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Harbor Seal <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Megaptera novaeangliae");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Humpback Whale <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Ascophyllum nodosum");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Knotted Wrack <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Aurelia aurita");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Moon Jellyfish <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Mola mola");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Ocean Sunfish <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Manta birostris");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Pacific Manta Ray <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Ursus maritimus");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Polar Bear <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Sphyrna lewini");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Scalloped Hammerhead <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Enhydra lutris");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Sea Otter <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Zostera marina");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Seagrass <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Thunnus albacares");
    setShowSpeciesPanel(false);
      setHighlightInput(true);
    setTimeout(() => {
    setHighlightInput(false);
  }, 600);
    searchSpecies();
  }}
>
  Yellowfin Tuna <MdArrowOutward className='arrow-icon'/>
</li>


</ul>
</div>
<button 
    className="close-menu-btn"
    onClick={() => setShowSpeciesPanel(false)}>
      <span>
        <IoCloseSharp />
      </span>
      close
      </button>

  </div>

      
    </div>
    </div>
  );
}