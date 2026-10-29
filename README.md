# River of Reads

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

New books are automatically added to the database via an **n8n workflow** that runs on a schedule (or can be triggered manually). Books are logged in **[Hardcover](https://hardcover.app)** and pulled from its GraphQL API. The workflow:

1. **Fetches recent reads from Hardcover** — a `POST` to `https://api.hardcover.app/v1/graphql` returns the user's books with status "read" (`status_id: 3`), newest first, including title, author, rating, last read date, and cover image
2. **Normalizes fields** — the response is split into one item per book and mapped to the fields the rest of the workflow expects (`title`, `author_name`, `user_read_at`, `user_rating`, `book_id`, `book_image_url`)
3. **Checks Notion for existing books** — skips any book whose title (before any subtitle or series tag) is already in the Notion reading log
4. **Classifies and summarizes** each new book with an LLM, which assigns format, vibe tags, and a short reflective summary
5. **Writes to Notion** as a new page in the reading log
6. **Authenticates** against the backend using stored credentials to obtain a session token
7. **Inserts** each book into the `books` table via the REST API with proper authorization headers

> **Why Hardcover?** Goodreads shelf RSS feeds stopped working, and shelf pages now require a login to view. Hardcover offers a documented API with personal tokens, so the sync no longer depends on scraping.

### Key Details

- **Hardcover auth:** The request uses an API token from Hardcover's account settings, sent as `Authorization: Bearer <token>`. The token must include scopes that allow reading your profile (`read:me`) and your library; without the library scope the query returns an empty list rather than an error. Tokens expire, so the workflow fails if the token isn't renewed.
- **Query shape:** Books are fetched through `me { user_books(...) }` and sorted with `last_read_date: desc_nulls_last`, so undated books don't crowd out recent reads.
- **Duplicate prevention:** Two layers. The Notion lookup matches on title, ignoring subtitles and series tags (e.g. "The Red Book (Billy Harney, #2)" matches "The Red Book"). The `books` table also has a unique constraint on user + title + date read, and the insert uses `on_conflict` with `Prefer: resolution=ignore-duplicates`, so any duplicate that slips past Notion is skipped instead of failing the run.
- **Ratings:** Hardcover allows half-star ratings. The insert rounds them to whole numbers and sends `null` for unrated books, to satisfy the `books_rating_check` constraint.
- **Vibe tagging:** Tags from the LLM are mapped to the six river tributaries (`nature`, `history`, `ideas`, `escapist`, `life`, `current`) in the n8n Code node.
- **Auth flow:** The workflow uses `POST /auth/v1/token?grant_type=password` to obtain an access token, then passes it as a `Bearer` token in the `Authorization` header for the insert request.

### Adding a New Book Manually

You can also add books via CSV upload on the `/upload` page, or directly through the REST API with a valid auth token.
