export const metadata = {
  title: "claudeimage-mcp",
  description: "Free image generation MCP server",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
