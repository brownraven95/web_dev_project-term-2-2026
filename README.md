📈 StockTracker – Live Stock Monitoring Application

📌 Project Description

StockTracker is a fully functional, DOM based web application that allows users to track live simulated stock prices, manage auto-refresh intervals, set price alerts, and maintain application state using browser storage.

The project is built entirely using JavaScript, HTML, and CSS, with heavy usage of DOM manipulation, event handling, and client side state management.

Note : I have tried to use an API to pull real time stock data, but the data access was restricted while using free versions of APIs which would've limited the site's functionality. so, This application uses simulated stock data for demonstration and learning purposes.

❓ Problem Statement

Tracking stock prices requires:

Continuous updates

Real-time feedback

Alerts based on user-defined conditions

Persistent state across page reloads

This project solves the problem by providing an interactive frontend application that behaves like a real stock-tracking dashboard without using any frontend frameworks.

✅ Features Implemented
🔹 Core Features

Add and remove stock symbols dynamically

Real-time simulated price updates

Auto-refresh with adjustable interval

Pause / Resume live updates

Price change indicators (positive / negative)

Dynamic stock cards rendered using JavaScript

🔹 Alerts & Notifications

Set price alerts (Above / Below target price)

Alert triggering based on live price updates

Browser notifications (with permission handling)

Alert management (add / delete)

🔹 State Management

Tracked stocks stored in localStorage

Alerts persisted across reloads

Refresh interval saved

Activity log maintained

🔹 UX Enhancements

Empty states for stocks and alerts

Input validation & error handling

User feedback via toast messages

Responsive layout (desktop + mobile)

Activity log panel for transparency

🧠 DOM Concepts Used

This project heavily uses DOM manipulation, including:

document.createElement()

element.innerHTML

appendChild() / removeChild()

Dynamic class toggling

Inline style updates via JavaScript

Conditional rendering

Event delegation (for dynamically created elements)

Form handling and keyboard events

Real-time DOM updates based on state changes

🧩 JavaScript Concepts Used

Arrays & Objects

Application-level state object

Timers (setInterval, setTimeout)

LocalStorage API

Event-driven programming

Conditional logic & edge-case handling

Modular function structure

Browser Notification API

🛠️ Technologies Used
✅ Allowed (Used)

HTML5

CSS3 (Flexbox, Grid, Responsive Design)

Vanilla JavaScript (ES6+)

Browser APIs:

LocalStorage

Notification API

Timers

▶️ Steps to Run the Project

Clone the repository:

git clone <your-github-repo-link>


Open the project folder

Run the site:

Simply open index.html in any modern browser

No server or setup required

⚠️ Known Limitations

Uses simulated stock data (not real market prices)

No backend integration

Chart data is short-term