import { useState, useRef, useEffect } from "react";
import './Search.css';
import { LuSearch } from "react-icons/lu";
import { MdImageNotSupported } from "react-icons/md";
import { MdArrowOutward } from "react-icons/md";
import { LuArrowUpLeft } from "react-icons/lu";

interface WormsRecord {
  AphiaID: number;
  scientificname: string;
  authority: string;
  rank: string;
  status: string;
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


  const searchSpecies = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSelected(null);

    try {
      
      let data = await safeFetchJSON(
        `https://www.marinespecies.org/rest/AphiaRecordsByName/${query}?like=true&marine_only=true`
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
          return { ...item, image: img };
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
        onClick={searchSpecies}>
            
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
              
            <p><strong>Authority__</strong> {selected.authority || "Unknown"}</p>

            <p><strong>Rank__</strong> {selected.rank}</p>

            <p><strong>Status__</strong> {selected.status}</p>

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
    <button 
    className="close-menu-btn"
    onClick={() => setShowSpeciesPanel(false)}>x</button>
  
    <ul>

          <li
  onClick={() => {
    setQuery("Semibalanus balanoides");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Acorn Barnacle <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Homarus americanus");
    setShowSpeciesPanel(false);
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
    searchSpecies();
  }}
>
  California Sea Lion <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Amphiprion ocellaris");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Clown Anemonefish <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Octopus vulgaris");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Common Octopus <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Acanthaster planci");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Crown-of-thorns Starfish <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Macrocystis pyrifera");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Giant Kelp <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Architeuthis dux");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Giant Squid <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Carcharodon carcharias");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
 Great White Shark <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Phoca vitulina");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Harbor Seal <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Megaptera novaeangliae");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Humpback Whale <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Ascophyllum nodosum");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Knotted Wrack <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Aurelia aurita");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Moon Jellyfish <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Mola mola");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Ocean Sunfish <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Manta birostris");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Pacific Manta Ray <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Ursus maritimus");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Polar Bear <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Sphyrna lewini");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Scalloped Hammerhead <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Enhydra lutris");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Sea Otter <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Zostera marina");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Seagrass <MdArrowOutward className='arrow-icon'/>
</li>

<li
  onClick={() => {
    setQuery("Thunnus albacares");
    setShowSpeciesPanel(false);
    searchSpecies();
  }}
>
  Yellowfin Tuna <MdArrowOutward className='arrow-icon'/>
</li>


</ul>

  </div>

      
    </div>
    </div>
  );
}