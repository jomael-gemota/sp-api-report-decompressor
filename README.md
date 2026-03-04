# SP-API Report Decompressor

A full-stack web application that decompresses Amazon SP-API generated reports and outputs clean CSV files. Built with **Next.js**, **React**, **Tailwind CSS**, **Express**, and **MongoDB**.

## Tech Stack

| Layer      | Technology               |
| ---------- | ------------------------ |
| Frontend   | Next.js 16, React 19     |
| Styling    | Tailwind CSS 4           |
| Backend    | Express 4                |
| Database   | MongoDB (via Mongoose 8) |
| Language   | TypeScript (client), JavaScript (server) |

## Project Structure

```
├── client/             # Next.js + Tailwind CSS frontend
│   ├── src/
│   │   ├── app/        # App Router pages & layouts
│   │   └── components/ # Reusable React components
│   └── package.json
├── server/             # Express + MongoDB backend
│   ├── src/
│   │   ├── config/     # Database connection
│   │   ├── middleware/  # Error handling, etc.
│   │   ├── models/     # Mongoose models
│   │   └── routes/     # API routes
│   └── package.json
└── package.json        # Root workspace scripts
```

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **MongoDB** running locally or a connection URI (e.g. MongoDB Atlas)

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Configure Environment Variables

Copy the example env files and fill in your values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

**`server/.env`**

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sp-api-report-decompressor
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**`client/.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run in Development

Start both the client and server concurrently:

```bash
npm run dev
```

Or run them individually:

```bash
npm run dev:client   # Next.js on http://localhost:3000
npm run dev:server   # Express on http://localhost:5000
```

### 4. Build for Production

```bash
npm run build
```

## API Endpoints

| Method | Endpoint           | Description            |
| ------ | ------------------ | ---------------------- |
| GET    | `/api/health`      | Health check           |
| GET    | `/api/reports`     | List all reports       |
| GET    | `/api/reports/:id` | Get a single report    |
| POST   | `/api/reports`     | Create a new report    |
| DELETE | `/api/reports/:id` | Delete a report        |

## License

See [LICENSE](./LICENSE) for details.
