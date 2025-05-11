import "./globals.css";

export const metadata = {
  title: 'React Three Mind - Next.js Face Tracking Example',
  description: 'Face tracking example using Next.js and react-three-mind',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 