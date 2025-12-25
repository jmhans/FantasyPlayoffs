# Fantasy Playoffs

A Fantasy Football Playoff Challenge application built with Next.js 15, PostgreSQL, Drizzle ORM, and Auth0.

## Features

- **Participant Dashboard**: View all participants and their standings
- **Roster Management**: View detailed rosters with weekly scoring (4-week playoff period)
- **Auth0 Authentication**: Secure user authentication
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **PostgreSQL + Drizzle**: Type-safe database interactions

## Getting Started

### Prerequisites

- Node.js 20.12.0 or higher
- PostgreSQL database (Vercel Postgres recommended)
- Auth0 account

### Installation

1. Clone the repository and navigate to the project:

```bash
cd FantasyPlayoffs
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file based on `.env.example` and fill in your credentials:

```bash
cp .env.example .env.local
```

4. Set up the database:

```bash
npm run db:push
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

The application uses the following main tables:

- **participants**: Users/participants in the playoff challenge
- **roster_entries**: Player entries for each participant's roster
- **weekly_scores**: Weekly scoring data (weeks 1-4) for each roster entry
- **season_config**: Configuration for the current playoff season

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## Deployment

This project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

## Tech Stack

- **Framework**: Next.js 15
- **UI**: React 19, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Auth0
- **Deployment**: Vercel

## Future Features

- Draft interface for roster selection
- Real-time score updates
- Player statistics integration
- Mobile app support

## License

MIT
