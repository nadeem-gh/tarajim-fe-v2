# Tarajim Translation Platform - Frontend

A modern Next.js frontend for the Tarajim Translation Platform, a comprehensive marketplace for book translation services.

## Features

- **User Authentication**: Login, registration, and profile management
- **Book Catalog**: Browse and discover books available for translation
- **Translation Management**: Create and manage translation requests
- **Speech-to-Text**: Integration with Whisper AI for voice translation
- **Audio Reading**: Generate and listen to audio books
- **Dashboard**: Role-based dashboards for readers, requesters, and translators
- **Responsive Design**: Mobile-first design with Tailwind CSS

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Authentication**: JWT with auto-refresh
- **UI Components**: Headless UI, Heroicons
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
cp .env.example .env.local
```

3. Update environment variables in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # User dashboard
│   ├── books/            # Book catalog and details
│   ├── translations/     # Translation requests
│   ├── login/           # Authentication pages
│   └── register/
├── components/           # Reusable UI components
├── contexts/            # React contexts (Auth, etc.)
├── lib/                 # Utility functions and API client
└── types/               # TypeScript type definitions
```

## Key Components

### Authentication
- `AuthContext`: Manages user authentication state
- `Navbar`: Navigation with user menu
- Login/Register pages with form validation

### Book Management
- Book catalog with search and filtering
- Book detail pages with chapters and statistics
- EPUB reader integration

### Translation Features
- Translation request creation and management
- Application system for translators
- Milestone tracking and payment management

### Speech & Audio
- Speech-to-text integration with Whisper
- Audio book generation
- Voice profile management

## API Integration

The frontend communicates with the Django backend through RESTful APIs:

- **Authentication**: `/api/accounts/`
- **Books**: `/api/books/`
- **Translations**: `/api/translations/`
- **Payments**: `/api/payments/`
- **Speech**: `/api/speech/`

## User Roles

### Reader
- Browse and purchase translated books
- Use audio reading features
- Track reading progress

### Requester
- Create translation requests
- Fund escrow accounts
- Manage translation projects
- Approve milestones

### Translator
- Apply to translation requests
- Submit sample translations
- Work on translation projects
- Build portfolio

## Development

### Code Style
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

### Testing
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

## Deployment

The application can be deployed to any platform that supports Next.js:

- **Vercel** (recommended)
- **Netlify**
- **AWS Amplify**
- **Docker**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
