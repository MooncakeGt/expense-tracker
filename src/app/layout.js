import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { AppDialogProvider } from "./components/ConfirmationModal";

export const metadata = {
  title: "Expense-Tracker",
  description: "My Expense Tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><AppDialogProvider>{children}</AppDialogProvider></body>
    </html>
  );
}
