import { useState } from "react";
import './Search.css';
import { LuSearch } from "react-icons/lu";


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

  return (
    <div className='search-page-container'>
        <div className='grid-bg'/>
        <div className='top-effect'/>
      <h1>Marine Scanner</h1>

      
      <div className="search-area">
        <div className='search-wrapper'>

        
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchSpecies()}
          placeholder="Search Marine Species..."
          className='search-bar'
        />
        <button 
        className='search-btn'
        onClick={searchSpecies}>
            
            <LuSearch size={20}/>
            </button>
      </div>
      </div>

      
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
                style={{
                  height: "150px",
                  background: "#222",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "0.5rem",
                  fontSize: "0.8rem",
                }}
              >
                No Image
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
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#111",
              padding: "2rem",
              maxWidth: "500px",
              width: "90%",
              border: "1px solid gray",
            }}
          >
            {selected.image && (
              <img
                src={selected.image}
                style={{ width: "100%", marginBottom: "1rem" }}
              />
            )}

            <h2>{selected.scientificname}</h2>
            <p><strong>Authority:</strong> {selected.authority || "Unknown"}</p>
            <p><strong>Rank:</strong> {selected.rank}</p>
            <p><strong>Status:</strong> {selected.status}</p>
          </div>
        </div>
      )}
    </div>
  );
}