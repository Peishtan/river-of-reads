# River of Reading

An interactive visualization of reading history rendered as a braided streamgraph — a flowing river where each tributary represents a different reading "vibe."

## Concept

Your reading life is a river. It starts as a single current and branches into tributaries based on the themes and moods of the books you read. Over time, branches grow, shrink, merge back, and sometimes dry up entirely — creating an organic, living map of your literary journey.

## How It Works

### The River (D3.js Streamgraph)

The core visualization is a horizontal stacked-area chart built with **D3.js**. Each month of reading data becomes a vertical slice, and books are grouped into six **vibe tributaries**:

| Vibe | Label | Associated Tags |
|------|-------|-----------------|
| `escapist` | Escapist & Adventure | adventure, bleak, dark, dystopian, escapist, mystery, thriller, uncomfortable |
| `ideas` | Ideas & Technology | business, craft, future, idea-dense, practical, science, systems, technology |
| `history` | History & World | culture, food, history, legal, literary, politics, travel |
| `nature` | Nature & Ocean | nature |
| `life` | Life & Reflective | hope, memoir, philosophy-lite, psychology, reflective, warm |
| `current` | The Main Current | The base flow — books that don't match any recognized tag |

> **How tags work:** Tags describe a book's *themes and moods*, not its genre or format. A novel can be tagged `reflective` (→ Life & Reflective) or `dark` (→ Escapist & Adventure) based on its feel. Fiction vs non-fiction doesn't determine the stream — a memoir about adventure could be `escapist`, while a thriller with psychological depth might be both `thriller` + `reflective`. When a book has tags mapping to multiple streams, it contributes to all of them. Books with no recognized tags fall into The Main Current.
>
> **AI tag classification:** Tags not in the built-in map are automatically classified by AI (via the `classify-tags` edge function) into the best-fitting stream. This runs once per upload — mappings are cached per-user in the `tag_mappings` table, so users can use any vocabulary they like and it'll be mapped intelligently.

### Branch Lifecycle

Branches don't just exist from the start — they have organic birth and death rules:

- **Birth:** A branch is "born" when a vibe appears in **3 out of 6 consecutive months**. It then ramps up over 3 months for a natural sprouting effect.
- **Death:** A branch "dries up" after **6 consecutive months** with zero books of that vibe. It fades out gradually over 3 months before disappearing.

### Visual Details

- **Meandering:** Each tributary follows its own sine-wave meander pattern, so streams weave and braid naturally rather than running in straight parallel lines.
- **Smoothing:** Book counts are Gaussian-smoothed across neighboring months to avoid jagged transitions.
- **Delta ending:** The river fans out into a wide delta at the current month rather than collapsing to a point.
- **Format filter:** Toggle between All, Fiction, and Non-fiction & Memoir to see how each format flows through the streams. The entire river re-renders with filtered data.
- **Tooltips:** Hover over any month to see the books read, their ratings, and vibe tags.
- **Customizable colors:** Each tributary color can be customized via the settings panel.

### River Gauge

Below the river, a set of **insight cards** surface patterns in your reading. Cards are ordered by recency — the most recent phenomenon appears first.

| Card | Trigger | Description |
|------|---------|-------------|
| **The Current** | Always shows | Where you are right now — dominant vibe and number of active streams. The anchor card. |
| **The Surge** | Recent spike in one vibe | A single tributary is running unusually strong compared to its historical average. |
| **The Flood** | Anomalous month volume ≥ 1.5× average | A single month where you read far more than your baseline. |
| **The Drought** | A stream dry for 6+ months | A tributary that once flowed has gone completely silent. Only fires when real. |
| **The Season** | Quarterly volume ratio ≥ 1.3× | A recurring seasonal pattern — one quarter consistently outpaces the others. |

Cards that don't trigger simply don't render. The Current always appears first; the rest sort by how recently the phenomenon occurred.

### Reader Archetype

At the top of the river, a **reader archetype** badge identifies your reading personality based on the blend of your strongest streams. The archetype shifts dynamically as your reading evolves. There are **8 archetypes**:

| Archetype | Trigger |
|-----------|---------|
| **The White-Water Kayaker** | Dominant in Escapist & Adventure |
| **The Fly Fisher** | Dominant in Life & Reflective |
| **The Cartographer** | Dominant in History & World |
| **The Lock Engineer** | Dominant in Ideas & Technology |
| **The Drift Diver** | Dominant in Nature & Ocean |
| **The Submarine Pilot** | Top 2 streams are Escapist + Ideas |
| **The River Keeper** | Top 2 streams are History + Life |
| **The Delta Explorer** | Even spread across all streams |

Combo archetypes (Submarine Pilot, River Keeper) take priority when both streams are in the reader's top two. The archetype is displayed as a circular SVG avatar with a gradient border using the reader's top two stream colors. Hover to see the full description.

### The Basin (Book Index)

The Basin is a searchable, filterable list of every book that has flowed through the river — "where the river settles." Accessible at `/library`, it provides:

- **Search** by title or author
- **Filter** by vibe stream or book format (Fiction / Non-fiction & Memoir)
- **Sort** by date (newest/oldest), rating (highest/lowest), or alphabetically
- **Year grouping** with sticky headers when sorted by date
- **Day-level sorting** within months using the full `date_read` timestamp
- **Book detail panel** — click any row to slide open a sheet showing rating, date read, format, stream tags, summary, and a "Find on Goodreads" link (constructed from title + author)

Each book row displays the date, title, author, overlapping vibe-color dots, and a star rating.

### The Delta (AI-Powered Recommendations)

Below the River Gauge, **The Delta** surfaces book recommendations generated by AI. An edge function (`generate-tributaries`) analyses the reader's 50 most recent books and strongest vibe streams, then calls Lovable AI to suggest exactly 3 books that:

1. **Bridge** two or more of the reader's active streams
2. **Pull** toward an underexplored stream
3. Are genuinely excellent, well-regarded books

Recommendations are stored in the `tributaries` table and displayed as cards with overlapping stream-color dots and source-stream tags. Each card shows the book title, author, a one-sentence reason, and the streams it bridges. Users can dismiss cards, and a server-side dedup filter prevents suggesting books already in the reader's history.

The function can be triggered via **n8n** on a schedule (e.g. weekly) or manually. It requires authentication — the caller must provide a valid Bearer token.

## Data

### CSV Upload

Users can upload a CSV of their reading history. The parser auto-detects columns and maps freeform tags (e.g. "thriller", "nature", "reflective") to the six vibe groups. Supported date formats include `MMMM d, yyyy`, `yyyy-MM-dd`, `MM/dd/yyyy`, and more.

### Database Persistence

Authenticated users have their books and color preferences saved to the backend (Lovable Cloud). Data loads automatically on sign-in.

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **D3.js** for the streamgraph visualization
- **Tailwind CSS** + **shadcn/ui** for styling
- **Lovable Cloud** for authentication, database, and persistence
- **date-fns** for date parsing

## Project Structure

```
src/
├── components/
│   ├── RiverOfReading.tsx    # Main D3 visualization
│   ├── DeltaInsights.tsx     # River Gauge insight cards
│   ├── TheDelta.tsx          # AI-powered book recommendations
│   ├── ReaderArchetype.tsx   # Reader personality badge
│   ├── BookDetailSheet.tsx   # Slide-out book detail panel
│   ├── TopBar.tsx            # Shared sticky navigation bar
│   ├── MonthTooltip.tsx      # Hover tooltip for monthly data
│   ├── RiverSettings.tsx     # Color customization panel
│   ├── StarRating.tsx        # Star display component
│   └── NavLink.tsx           # Navigation link component
├── contexts/
│   └── ReadingDataContext.tsx # Global state: auth, data, colors
├── data/
│   └── readingData.ts        # Vibe definitions, tag mapping, demo data
├── lib/
│   └── parseCSV.ts           # CSV parsing and column mapping
├── pages/
│   ├── Index.tsx              # Main river view
│   ├── Library.tsx            # The Basin — book index
│   ├── Upload.tsx             # CSV upload page
│   └── Auth.tsx               # Login / signup
└── index.css                  # Design tokens and theme

supabase/
└── functions/
    ├── classify-tags/
    │   └── index.ts           # AI tag classification edge function
    └── generate-tributaries/
        └── index.ts           # AI recommendation edge function
```

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the river.

## Automated Book Ingestion (n8n)

New books are automatically added to the database via an **n8n workflow** that runs on a schedule (or can be triggered manually). The workflow:

1. **Fetches book data** from an external source (e.g. a reading tracker API or RSS feed)
2. **Parses and enriches** each book with title, author, date read, rating, and vibe tags using a JavaScript code node
3. **Authenticates** against the backend using stored credentials to obtain a session token
4. **Inserts** each book into the `books` table via the REST API with proper authorization headers

### Key Details

- **Duplicate prevention:** The workflow should check for existing entries before inserting (e.g. by matching on title + date_read) to avoid duplicates.
- **Vibe tagging:** Tags from the source are mapped to the six river tributaries (`nature`, `history`, `ideas`, `escapist`, `life`, `current`) in the n8n Code node.
- **Auth flow:** The workflow uses `POST /auth/v1/token?grant_type=password` to obtain an access token, then passes it as a `Bearer` token in the `Authorization` header for the insert request.
- **Prefer header:** Add `Prefer: return=representation` to the insert HTTP request to get the created row back in the response.

### Adding a New Book Manually

You can also add books via CSV upload on the `/upload` page, or directly through the REST API with a valid auth token.
