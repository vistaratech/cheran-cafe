# ChefCito - Restaurant Management System

ChefCito is a modern restaurant management system built with Next.js 14, featuring Point of Sale (POS), Kitchen Display System (KDS), inventory management, and more.

## Features

- 🍽️ **Point of Sale (POS)** - Intuitive order taking and payment processing
- 👨‍🍳 **Kitchen Display System (KDS)** - Real-time order management for kitchen staff
- 📊 **Reports & Analytics** - Business insights and performance metrics
- 🏪 **Restaurant Management** - Menu, inventory, and staff management
- 👥 **User Management** - Role-based access control system
- 💳 **Payment Processing** - Cash and card payment handling
- 📱 **Mobile Responsive** - Works on all devices

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Shadcn/ui, Tailwind CSS
- **State Management**: Zustand, SWR
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based auth
- **Internationalization**: Custom i18n implementation


## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)


### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chefcito-main
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure your `.env.local` file:
```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=chefcito


```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Payment Processing

ChefCito supports cash and card payment processing for restaurant transactions.



## Project Structure

```
src/
├── app/                 # Next.js 14 app directory
│   ├── (app)/          # Main application routes
│   │   ├── kds/        # Kitchen Display System
│   │   ├── orders/     # Order management
│   │   ├── pos/        # Point of Sale
│   │   ├── profile/    # User profile
│   │   ├── reports/    # Business reports
│   │   └── restaurant/ # Restaurant management
│   ├── api/            # API routes
│   └── login/          # Authentication
├── components/         # Reusable UI components
├── lib/               # Utilities and business logic
├── models/            # Database models
├── services/          # External service integrations
└── locales/           # Internationalization files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email ajestrellar@outlook.com.
