# River of Reading

An interactive visualization of reading history rendered as a braided streamgraph — a flowing river where each tributary represents a different reading "vibe."

## Concept

Your reading life is a river. It starts as a single current and branches into tributaries based on the themes and moods of the books you read. Over time, branches grow, shrink, merge back, and sometimes dry up entirely — creating an organic, living map of your literary journey.

## How It Works

### The River (D3.js Streamgraph)

The core visualization is a horizontal stacked-area chart built with **D3.js**. Each month of reading data becomes a vertical slice, and books are grouped into six **vibe tributaries**:

| Vibe | Label | What it captures |
|------|-------|-----------------|
| `escapist` | The Escape | Adventure, mystery, thriller, dystopian fiction |
| `ideas` | The Lab | Business, technology, science, psychology |
| `nature` | The Wild | Nature writing, travel |
| `history` | The World | History, culture, politics, memoir |
| `life` | The Hearth | Literary fiction, reflective, warm, hopeful |
| `current` | The Main Current | The base flow — books that don't fit a specific vibe |

### Branch Lifecycle

Branches don't just exist from the start — they have organic birth and death rules:

- **Birth:** A branch is "born" when a vibe appears in **3 out of 6 consecutive months**. It then ramps up over 3 months for a natural sprouting effect.
- **Death:** A branch "dries up" after **6 consecutive months** with zero books of that vibe. It fades out gradually over 3 months before disappearing.

### Visual Details

- **Meandering:** Each tributary follows its own sine-wave meander pattern, so streams weave and braid naturally rather than running in straight parallel lines.
- **Smoothing:** Book counts are Gaussian-smoothed across neighboring months to avoid jagged transitions.
- **Delta ending:** The river fans out into a wide delta at the current month rather than collapsing to a point.
- **Tooltips:** Hover over any month to see the books read, their ratings, and vibe tags.
- **Customizable colors:** Each tributary color can be customized via the settings panel.

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
│   ├── DeltaInsights.tsx     # Summary stats at the river's end
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
│   ├── Upload.tsx             # CSV upload page
│   └── Auth.tsx               # Login / signup
└── index.css                  # Design tokens and theme
```

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the river.
