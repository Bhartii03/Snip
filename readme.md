# SNIP. | Advanced System Architecture for URL Shortening

SNIP is a highly performant, full-stack URL shortening service built with a focus on system design, caching, and background data processing. It features a cyberpunk-inspired developer UI, sub-millisecond redirect speeds, and live geographic telemetry.

## 🚀 Tech Stack & Architecture

* **Frontend:** React (Vite), Tailwind CSS, Recharts (Live Polling Data)
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (Relational data, Schema auto-migration)
* **Caching Layer:** Redis (L1 Cache for redirects, Token-bucket Rate Limiting)
* **Infrastructure:** Docker & Docker Compose
* **Analytics:** GeoIP-lite (Background async geographic IP mapping)

## 🧠 Core System Features

1. **L1 Redis Caching:** Redirect endpoints check Redis first, resulting in ~1ms latency for cached links before falling back to PostgreSQL.
2. **Asynchronous Telemetry:** Click tracking and geographic IP lookups (`setImmediate`) are detached from the main redirect thread, ensuring analytics processing never slows down the user's redirect.
3. **Collision-Safe Hashing:** Implements a custom Base62 encoding algorithm to generate short, URL-safe aliases.
4. **Rate Limiting:** IP-based fixed-window rate limiting via Redis protects the link-generation API from automated spam and abuse.
5. **Live Dashboard Sync:** The React frontend utilizes background short-polling to keep click data and global geographic metrics synchronized without requiring page refreshes.

## 🛠️ Getting Started (Local Deployment)

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
* [Node.js](https://nodejs.org/) (v18+)

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/Bhartii03/Snip.git](https://github.com/Bhartii03/Snip.git)
   cd snip
   ```
2. **Boot the infrastructure**  
    ```bash
    docker compose up -d
    ```

3. **Start the Backend API**
    ```bash
    cd server
    npm install 
    npm run dev
    ```

4. **Start the Frontend Client**
Open a new terminal window:
    ```bash
    cd client
    npm install
    npm run dev
    ```
5. **Access the Application**
    Navigate to http://localhost:5173 in your browser.           