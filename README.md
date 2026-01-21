# Hệ thống Quản lý Quá trình Sụt lún Đất tại TPHCM

Hệ thống web quản lý và giám sát quá trình sụt lún đất tại Thành phố Hồ Chí Minh.

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js** + **Express.js** - Server framework
- **Sequelize** - ORM cho SQL Server
- **Microsoft SQL Server** - Database
- **JWT** (jsonwebtoken) - Authentication & Authorization
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security headers
- **morgan** - HTTP request logger
- **cors** - Cross-Origin Resource Sharing
- **Jest** + **Supertest** - Testing framework

### Frontend
- **ReactJS** (v18) - UI framework
- **Vite** - Build tool và dev server
- **Ant Design** (v5) - UI component library
- **LeafletJS** + **react-leaflet** - Bản đồ tương tác
- **Chart.js** + **react-chartjs-2** - Biểu đồ và visualization
- **React Router DOM** - Routing
- **Zustand** - State management (lightweight)
- **Axios** - HTTP client
- **Day.js** - Date manipulation

### Đánh giá công cụ
✅ **Công cụ hiện tại đã đủ** cho dự án quản lý sụt lún đất:
- Backend có đầy đủ: authentication, validation, security, logging
- Frontend có đầy đủ: UI components, maps, charts, state management
- Có thể bổ sung thêm (tùy chọn):
  - **Socket.io** - Real-time monitoring nếu cần
  - **Redis** - Caching nếu cần tối ưu performance
  - **Docker** - Containerization cho deployment

## 📁 Cấu trúc dự án

```
hcmc-land-subsidence-system/
├── backend/                    # Backend API server
│   ├── src/
│   │   ├── config/            # Cấu hình database, JWT, etc.
│   │   ├── controllers/       # Controllers xử lý logic
│   │   ├── db/                # Database connection
│   │   ├── middleware/        # Custom middleware (auth, error handling)
│   │   ├── migrations/        # Database migrations
│   │   ├── models/            # Sequelize models
│   │   ├── routes/            # API routes
│   │   │   ├── misc/          # Miscellaneous routes
│   │   │   └── v1/            # API version 1 routes
│   │   ├── seeders/           # Database seeders
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # Utility functions
│   │   ├── validators/        # Input validation schemas
│   │   ├── types/             # Type definitions
│   │   ├── constants/         # Constants và config values
│   │   └── app.js             # Express app entry point
│   ├── tests/                 # Test files
│   ├── package.json
│   └── README.md
│
├── frontend/                   # Frontend React app
│   ├── src/
│   │   ├── api/               # API client
│   │   │   ├── auth/          # Authentication API
│   │   │   ├── subsidence/    # Subsidence data API
│   │   │   └── monitoring/    # Monitoring API
│   │   ├── assets/            # Static assets
│   │   │   ├── images/        # Images
│   │   │   ├── icons/         # Icons
│   │   │   └── fonts/         # Fonts
│   │   ├── components/        # Reusable components
│   │   │   ├── common/        # Common components
│   │   │   ├── forms/         # Form components
│   │   │   ├── charts/        # Chart components
│   │   │   └── maps/          # Map components (Leaflet)
│   │   ├── features/          # Feature modules
│   │   │   ├── auth/          # Authentication feature
│   │   │   ├── dashboard/     # Dashboard feature
│   │   │   ├── subsidence/    # Subsidence management
│   │   │   ├── monitoring/    # Monitoring feature
│   │   │   └── reports/       # Reports feature
│   │   ├── hooks/             # Custom React hooks
│   │   ├── layouts/           # Layout components
│   │   ├── pages/             # Page components
│   │   │   ├── auth/          # Auth pages
│   │   │   ├── dashboard/     # Dashboard pages
│   │   │   ├── subsidence/    # Subsidence pages
│   │   │   ├── monitoring/    # Monitoring pages
│   │   │   └── reports/       # Reports pages
│   │   ├── routes/            # Route configuration
│   │   ├── store/             # State management (Zustand)
│   │   │   ├── auth/          # Auth store
│   │   │   ├── subsidence/    # Subsidence store
│   │   │   └── monitoring/    # Monitoring store
│   │   ├── styles/            # Styles
│   │   │   ├── utils/         # Style utilities
│   │   │   └── components/    # Component styles
│   │   ├── utils/             # Utility functions
│   │   │   ├── helpers/       # Helper functions
│   │   │   ├── validators/    # Validation functions
│   │   │   └── constants/     # Constants
│   │   ├── App.jsx            # Main App component
│   │   └── main.jsx           # Entry point
│   ├── public/                # Public assets
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── docs/                       # Tài liệu dự án
│   ├── api/                    # API documentation
│   └── database/               # Database documentation
│
├── scripts/                     # Scripts
│   ├── setup/                  # Setup scripts
│   └── deploy/                 # Deployment scripts
│
├── .gitignore
└── README.md
```

## 🚀 Cài đặt và chạy

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Chỉnh sửa file .env với thông tin database của bạn
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Chỉnh sửa file .env với API URL
npm run dev
```

## 📝 License

MIT

