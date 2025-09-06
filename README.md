# Referee-Playstyle-Discipline Analytics

Advanced analytics for soccer fouls and referee decisions using StatsBomb data with tactical archetype categorization.

## Features

### Core Analytics
- **StatsBomb Data Integration**: Real match events, lineups, and formations
- **Referee Analysis**: Disciplinary patterns and spatial distributions  
- **Zone-based Modeling**: Negative Binomial GLMs for foul prediction
- **Tactical Profiles**: Team playstyle categorization and archetype system

### Tactical Archetypes

We now compute `style_archetype` (e.g., 'High-Press Possession', 'Low-Block Counter + Wing Overload Crossers'), derived from axis tags:

**Sample Team-Season Record:**
```csv
team,season_id,competition_id,style_archetype,cat_pressing,cat_block,cat_possess_dir,cat_width,cat_transition,cat_overlays
Barcelona,90,11,"High-Press Possession","High Press","High Block","Possession-Based","Central Focus","Low Transition","[]"
Atletico Madrid,90,11,"Low-Block Counter","Low Press","Low Block","Direct","Balanced Channels","High Transition","[""Set-Piece Focus""]"
Real Madrid,90,11,"Mid-Block Possession + Central Combinational","Mid Press","Mid Block","Possession-Based","Central Focus","Low Transition","[]"
```

**Archetype Categories:**
- **High-Press Possession**: Aggressive pressing with ball-oriented play
- **Low-Block Counter**: Defensive setup with fast transitions
- **Mid-Block Balanced**: Balanced approach across all phases
- **High-Press Direct**: Aggressive pressing with direct attacking
- **Low-Block Contain**: Deep defensive block without transition focus

**Overlay Modifiers:**
- **Wing Overload Crossers**: High wing usage + cross-heavy delivery
- **Central Combinational**: Central focus + possession-based style
- **Set-Piece Focus**: Disciplined teams with low foul counts

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB
- GitHub Personal Access Token (for StatsBomb data)

### Installation
```bash
# Clone repository 
git clone <repository-url>
cd referee-playstyle-discipline

# Backend setup
pip install -r backend/requirements.txt

# Frontend setup  
cd frontend
yarn install

# Environment setup
cp backend/.env.example backend/.env
# Add GITHUB_TOKEN=your_token_here
```

### Run Dataset Builder
```bash
# Build tactical archetype dataset
cd /app
python src/run_build_dataset.py --github-token YOUR_TOKEN --competitions 11:90 2:44

# Outputs:
# - data/match_team_features_with_tags.parquet (match-level with archetypes)
# - data/team_season_features_with_tags.parquet (season-level with archetypes)  
# - data/team_season_style_categories.csv (archetype labels only)
```

### Start Services
```bash
# Start all services
sudo supervisorctl restart all

# Or individually:
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

## API Endpoints

### Tactical Archetype APIs
- `GET /api/style/team?team=Barcelona&season_id=90&competition_id=11` - Get team archetype
- `GET /api/style/match/{match_id}` - Get match team archetypes
- `GET /api/style/competition/{competition_id}/season/{season_id}` - Competition archetype distribution

### Core Analytics APIs
- `GET /api/competitions` - Available competitions
- `GET /api/matches/{match_id}/tactical-analysis` - Match tactical analysis
- `GET /api/analytics/zone-models/status` - Zone models status
- `GET /api/analytics/available-features` - Available features
- `POST /api/analytics/predict-fouls` - Foul prediction

## Configuration

Archetype thresholds are configurable in `config.yaml`:

```yaml
archetype_thresholds:
  pressing:
    high:
      ppda: [8, 12]
      def_share_att_third: [0.25, 1.0]
  possession_directness:
    possession_based:
      possession_share: [0.55, 1.0]
      directness: [0, 0.4]
  # ... more categories
```
